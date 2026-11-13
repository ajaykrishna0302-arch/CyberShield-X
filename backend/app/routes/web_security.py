
from fastapi import APIRouter, HTTPException
from pydantic import HttpUrl
from http.cookies import SimpleCookie
import socket
import ipaddress
import httpx
import ssl
from datetime import datetime, timezone
import json
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SecurityAssessment
def check_ssl_certificate(hostname):

    context = ssl.create_default_context()

    try:
        with socket.create_connection(
            (hostname, 443),
            timeout=10
        ) as sock:

            with context.wrap_socket(
                sock,
                server_hostname=hostname
            ) as secure_socket:

                certificate = secure_socket.getpeercert()

                expiry_date = datetime.strptime(
                    certificate["notAfter"],
                    "%b %d %H:%M:%S %Y %Z"
                ).replace(tzinfo=timezone.utc)

                remaining_days = (
                    expiry_date - datetime.now(timezone.utc)
                ).days

                return {
                    "valid": True,
                    "expiry_date": expiry_date.isoformat(),
                    "days_remaining": remaining_days
                }

    except ssl.SSLCertVerificationError:
        return {
            "valid": False,
            "error": "SSL certificate verification failed."
        }

    except (socket.error, ssl.SSLError, TimeoutError):
        return {
            "valid": False,
            "error": "Unable to establish a secure SSL connection."
        }
router = APIRouter(
    prefix="/api/web-security",
    tags=["Web Security"]
)


def validate_website_url(url):

    hostname = url.host

    if not hostname:
        raise HTTPException(
            status_code=400,
            detail="Invalid website hostname."
        )

    try:
        addresses = socket.getaddrinfo(
            hostname,
            None,
            type=socket.SOCK_STREAM
        )

        print("Hostname:", hostname)
        print("Resolved addresses:", addresses)

        for address in addresses:

            ip = ipaddress.ip_address(address[4][0])

            if not ip.is_global:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Private or restricted network "
                        "addresses are not allowed."
                    )
                )

    except socket.gaierror:
        raise HTTPException(
            status_code=400,
            detail="Unable to resolve website hostname."
        )


@router.post("/check")
async def check_website(
    url: HttpUrl,
    db: Session = Depends(get_db)
):

    # Validate the URL before making a request
    validate_website_url(url)

    target_url = str(url)

    try:
        async with httpx.AsyncClient(
            timeout=10,
            follow_redirects=False
        ) as client:

            response = await client.get(target_url)

        headers = response.headers
        findings = []
        ssl_result = None

        # Cookie security analysis
        cookies = response.headers.get_list("set-cookie")
        cookie_findings = []

        for cookie_header in cookies:
            parsed_cookie = SimpleCookie()
            parsed_cookie.load(cookie_header)

            for cookie_name, cookie in parsed_cookie.items():
                if not cookie["secure"]:
                    cookie_findings.append({
                        "cookie": cookie_name,
                        "issue": "Cookie missing Secure attribute",
                        "severity": "Medium",
                        "recommendation": "Add the Secure attribute."
                    })

                if not cookie["httponly"]:
                    cookie_findings.append({
                        "cookie": cookie_name,
                        "issue": "Cookie missing HttpOnly attribute",
                        "severity": "Medium",
                        "recommendation": "Add the HttpOnly attribute."
                    })

                if not cookie["samesite"]:
                    cookie_findings.append({
                        "cookie": cookie_name,
                        "issue": "Cookie missing SameSite attribute",
                        "severity": "Low",
                        "recommendation": "Configure an appropriate SameSite attribute."
                    })

        findings.extend(cookie_findings)

       
        # Check SSL/TLS certificate
        if url.scheme.lower() == "https":
            ssl_result = check_ssl_certificate(url.host)

            if not ssl_result["valid"]:
                findings.append({
                    "issue": "SSL/TLS certificate validation failed",
                    "severity": "High",
                    "recommendation": ssl_result["error"]
                })
            elif ssl_result["days_remaining"] <= 30:
                findings.append({
                    "issue": "SSL/TLS certificate is expiring soon",
                    "severity": "Medium",
                    "recommendation": (
                        f"Certificate expires on "
                        f"{ssl_result['expiry_date']}. "
                        "Renew it before expiration."
                    )
                })

        # Check whether the website uses HTTPS
        if url.scheme.lower() != "https":
            findings.append({
                "issue": "Website is not using HTTPS",
                "severity": "High",
                "recommendation": "Configure HTTPS with a valid SSL/TLS certificate."
            })

        security_headers = {
            "strict-transport-security": "HSTS",
            "content-security-policy": "CSP",
            "x-content-type-options": "X-Content-Type-Options",
            "x-frame-options": "X-Frame-Options",
            "referrer-policy": "Referrer-Policy"
        }

        # Check missing security headers
        for header, name in security_headers.items():
            if header not in headers:
                findings.append({
                    "issue": f"Missing {name} header",
                    "severity": "Medium",
                    "recommendation": f"Configure the {name} header."
                })

        # Clear unverified findings for blocked responses
        if response.status_code in (401, 403):
            findings = []
            cookie_findings = []
            cookies = []

        # Risk score calculation
        if response.status_code in (401, 403):
            risk_score = None
            risk_level = "Not assessed"
            scan_status = "Inconclusive"
        else:
            risk_score = 0

            for finding in findings:
                if finding["severity"] == "High":
                    risk_score += 10
                elif finding["severity"] == "Medium":
                    risk_score += 5
                elif finding["severity"] == "Low":
                    risk_score += 2

            if risk_score >= 30:
                risk_level = "High"
            elif risk_score >= 15:
                risk_level = "Medium"
            else:
                risk_level = "Low"

            scan_status = "Completed"

        # Security summary
        if response.status_code in (401, 403):
            severity_summary = None
        else:
            severity_summary = {
                "high": sum(1 for f in findings if f["severity"] == "High"),
                "medium": sum(1 for f in findings if f["severity"] == "Medium"),
                "low": sum(1 for f in findings if f["severity"] == "Low")
            }

        result = {
            "website": str(response.url),
            "status_code": response.status_code,
            "ssl_certificate": (
                ssl_result if url.scheme.lower() == "https"
                else {
                    "checked": False,
                    "message": "Website is not using HTTPS."
                }
            ),
            "cookie_analysis": {
                "total_cookies": len(cookies),
                "cookie_findings": cookie_findings
            },
            "findings": findings,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "severity_summary": severity_summary,
            "total_issues": len(findings),
            "scan_status": scan_status,
            "analysis_note": (
                "The website returned an access-denied response. "
                "Security findings may not represent its normal pages."
                if response.status_code in (401, 403)
                else "Analysis completed using the received HTTP response."
            ),
        }

        # Save assessment to database
        assessment = SecurityAssessment(
            scan_type="Web Security",
            target=str(response.url),
            status=scan_status,
            risk_score=risk_score,
            risk_level=risk_level,
            total_issues=len(findings),
            high_count=severity_summary["high"] if severity_summary else 0,
            medium_count=severity_summary["medium"] if severity_summary else 0,
            low_count=severity_summary["low"] if severity_summary else 0,
            results_json=json.dumps(result)
        )

        db.add(assessment)
        db.commit()

        return result

    except httpx.RequestError as error:
        print("HTTPX ERROR:", repr(error), flush=True)
        raise HTTPException(
            status_code=400,
            detail=f"Unable to connect: {repr(error)}"
        )
