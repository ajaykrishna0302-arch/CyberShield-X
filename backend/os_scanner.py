
import json
import platform
import subprocess
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SecurityAssessment

from fastapi import APIRouter

router = APIRouter()


def run_powershell(command):
    try:
        result = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                command,
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )

        if result.returncode != 0 or not result.stdout.strip():
            return None

        return json.loads(result.stdout)

    except Exception:
        return None


def check_firewall():
    data = run_powershell(
        "Get-NetFirewallProfile | "
        "Select-Object Name, Enabled | ConvertTo-Json -Compress"
    )

    if not data:
        return {"status": "unavailable", "details": "Could not read firewall status."}

    if isinstance(data, dict):
        data = [data]

    enabled = all(item.get("Enabled") is True for item in data)

    return {
        "status": "secure" if enabled else "warning",
        "details": "All firewall profiles enabled." if enabled
        else "One or more firewall profiles are disabled."
    }


def check_antivirus():
    data = run_powershell(
        "Get-MpComputerStatus | "
        "Select-Object AntivirusEnabled, RealTimeProtectionEnabled "
        "| ConvertTo-Json -Compress"
    )

    if not data:
        return {"status": "unavailable", "details": "Defender status unavailable."}

    active = (
        data.get("AntivirusEnabled") is True
        and data.get("RealTimeProtectionEnabled") is True
    )

    return {
        "status": "secure" if active else "warning",
        "details": "Microsoft Defender protection is active."
        if active else "Defender protection needs review."
    }


def check_updates():
    data = run_powershell(
        "Get-HotFix | Sort-Object InstalledOn -Descending "
        "| Select-Object -First 1 HotFixID, InstalledOn "
        "| ConvertTo-Json -Compress"
    )

    if not data:
        return {
            "status": "unavailable",
            "details": "Could not retrieve installed update information."
        }

    return {
        "status": "info",
        "details": (
            f"Latest listed update: {data.get('HotFixID', 'Unknown')} "
            f"({data.get('InstalledOn', 'Date unavailable')}). "
            "Pending updates have not been checked."
        )
    }



def check_encryption():
    try:
        result = subprocess.run(
            ["manage-bde", "-status"],
            capture_output=True,
            text=True,
            timeout=20
        )

        output = result.stdout

        if result.returncode != 0 or not output.strip():
            return {
                "status": "unavailable",
                "details": "Permission denied or encryption status unavailable. Run the backend with appropriate permissions."
            }

        import re

        volumes = re.split(r"Volume [A-Z]:", output)[1:]

        if not volumes:
            return {
                "status": "unavailable",
                "details": "No BitLocker-protected volumes were detected."
            }

        results = []

        for volume in volumes:
            percentage = re.search(
                r"Percentage Encrypted:\s*([\d.]+)%",
                volume
            )

            protection = re.search(
                r"Protection Status:\s*(.+)",
                volume
            )

            encrypted = (
                percentage
                and float(percentage.group(1)) == 100.0
            )

            protected = (
                protection
                and protection.group(1).strip().lower() == "protection on"
            )

            results.append(encrypted and protected)

        all_secure = all(results)

        return {
            "status": "secure" if all_secure else "warning",
            "details": (
                f"{len(results)} volume(s) checked. "
                "All detected volumes are fully encrypted and protected."
                if all_secure else
                "One or more detected volumes need encryption review."
            )
        }

    except Exception as error:
        return {
            "status": "unavailable",
            "details": str(error)
        }


@router.get("/api/os-security/scan")
def scan_os_security(db: Session = Depends(get_db)):
    if platform.system() != "Windows":
        return {
            "os": platform.system(),
            "message": "This scanner currently supports Windows only.",
            "checks": {}
        }

    checks = {
        "firewall": check_firewall(),
        "antivirus": check_antivirus(),
        "updates": check_updates(),
        "encryption": check_encryption(),
    }

    result = {
        "os": platform.platform(),
        "checks": checks,
    }

    # Count checks that need attention
    total_issues = sum(
        1 for check in checks.values()
        if check["status"] == "warning"
    )

    unavailable_count = sum(
        1 for check in checks.values()
        if check["status"] == "unavailable"
    )

    # Determine assessment status
    assessment_status = (
        "Partial" if unavailable_count > 0 else "Completed"
    )

    if total_issues > 0:
        risk_level = "Review required"
    elif unavailable_count > 0:
        risk_level = "Partially assessed"
    else:
        risk_level = "No warnings detected"

    # Save OS assessment
    assessment = SecurityAssessment(
        scan_type="OS Security",
        target=platform.platform(),
        status=assessment_status,
        risk_score=None,
        risk_level=risk_level,
        total_issues=total_issues,
        high_count=0,
        medium_count=0,
        low_count=0,
        results_json=json.dumps(result)
    )

    db.add(assessment)
    db.commit()

    return result