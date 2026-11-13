
import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SecurityAssessment, Vulnerability

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/security-score")
def get_security_score(db: Session = Depends(get_db)):

    # Count completed and partially completed assessments
    assessment_count = (
        db.query(SecurityAssessment)
        .filter(
            SecurityAssessment.status.in_(["Completed", "Partial"])
        )
        .count()
    )

    # Get the latest OS Security assessment
    os_assessment = (
        db.query(SecurityAssessment)
        .filter(SecurityAssessment.scan_type == "OS Security")
        .order_by(SecurityAssessment.id.desc())
        .first()
    )

    # Get the latest completed Web Security assessment
    web_assessment = (
        db.query(SecurityAssessment)
        .filter(
            SecurityAssessment.scan_type == "Web Security",
            SecurityAssessment.status == "Completed"
        )
        .order_by(SecurityAssessment.id.desc())
        .first()
    )

    components = {}
    assessment_count = (
    db.query(SecurityAssessment)
    .filter(
        SecurityAssessment.status.in_(["Completed", "Partial"])
    )
    .count()
)
    available_scores = []

    # OS Security score
    if os_assessment:
        try:
            result = json.loads(os_assessment.results_json or "{}")
        except (json.JSONDecodeError, TypeError):
            result = {}

        checks = result.get("checks", {})

        verified = [
            checks.get(name, {}).get("status")
            for name in ("firewall", "antivirus", "encryption")
            if isinstance(checks.get(name), dict)
            and checks[name].get("status") in ("secure", "warning")
        ]

        if verified:
            secure_count = verified.count("secure")
            os_score = round(
                secure_count / len(verified) * 100
            )

            components["os_security"] = {
                "score": os_score,
                "verified_checks": len(verified),
                "total_checks": 3
            }

            available_scores.append(os_score)

        else:
            components["os_security"] = {
                "score": None,
                "verified_checks": 0,
                "total_checks": 3
            }

    # Web Security and Vulnerability score
    if web_assessment:

        vulnerabilities = (
            db.query(Vulnerability)
            .filter(
                Vulnerability.source_assessment_id == web_assessment.id
            )
            .all()
        )

        if vulnerabilities:
            active = [
                item for item in vulnerabilities
                if (item.status or "Open").lower() != "resolved"
            ]

            high = sum(
                1 for item in active
                if item.severity.lower() == "high"
            )

            medium = sum(
                1 for item in active
                if item.severity.lower() == "medium"
            )

            low = sum(
                1 for item in active
                if item.severity.lower() == "low"
            )

        else:
            try:
                result = json.loads(
                    web_assessment.results_json or "{}"
                )
            except (json.JSONDecodeError, TypeError):
                result = {}

            findings = result.get("findings", [])

            high = sum(
                1 for item in findings
                if item.get("severity", "").lower() == "high"
            )

            medium = sum(
                1 for item in findings
                if item.get("severity", "").lower() == "medium"
            )

            low = sum(
                1 for item in findings
                if item.get("severity", "").lower() == "low"
            )

        penalty = (high * 20) + (medium * 10) + (low * 4)

        web_score = max(0, 100 - penalty)

        components["web_security"] = {
            "score": web_score,
            "high": high,
            "medium": medium,
            "low": low
        }

        available_scores.append(web_score)

    # Overall Security Score
    if not available_scores:
        return {
    "score": None,
    "status": "Not assessed",
    "assessment_count": assessment_count,
    "components": components
}

    overall_score = round(
        sum(available_scores) / len(available_scores)
    )

    is_partial = len(available_scores) < 2
    status = "Partial" if is_partial else "Completed"

    return {
        "score": overall_score,
        "status": status,
        "assessment_count": assessment_count,
        "components": components
    }
