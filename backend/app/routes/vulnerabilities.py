
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SecurityAssessment, Vulnerability

router = APIRouter(
    prefix="/api/vulnerabilities",
    tags=["Vulnerability Management"]
)


@router.get("/")
def get_vulnerabilities(db: Session = Depends(get_db)):

    assessments = (
        db.query(SecurityAssessment)
        .filter(
            SecurityAssessment.scan_type == "Web Security",
            SecurityAssessment.status == "Completed"
        )
        .all()
    )

    for assessment in assessments:
        try:
            result = json.loads(assessment.results_json or "{}")
        except (json.JSONDecodeError, TypeError):
            continue

        findings = result.get("findings", [])

        for finding in findings:
            title = finding.get("issue")

            if not title:
                continue

            existing = db.query(Vulnerability).filter(
                Vulnerability.source_assessment_id == assessment.id,
                Vulnerability.title == title
            ).first()

            if existing:
                continue

            db.add(Vulnerability(
                title=title,
                target=assessment.target,
                severity=finding.get("severity", "Low"),
                recommendation=finding.get("recommendation", ""),
                source_assessment_id=assessment.id
            ))

    db.commit()

    vulnerabilities = (
        db.query(Vulnerability)
        .order_by(Vulnerability.id.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "title": item.title,
            "target": item.target,
            "severity": item.severity,
            "recommendation": item.recommendation,
            "status": item.status,
            "source_assessment_id": item.source_assessment_id,
            "created_at": item.created_at
        }
        for item in vulnerabilities
    ]


@router.patch("/{vulnerability_id}/status")
def update_vulnerability_status(
    vulnerability_id: int,
    status: str,
    db: Session = Depends(get_db)
):

    allowed_statuses = ["Open", "In Progress", "Resolved"]

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid vulnerability status."
        )

    vulnerability = db.query(Vulnerability).filter(
        Vulnerability.id == vulnerability_id
    ).first()

    if not vulnerability:
        raise HTTPException(
            status_code=404,
            detail="Vulnerability not found."
        )

    vulnerability.status = status
    db.commit()
    db.refresh(vulnerability)

    return {
        "message": "Status updated successfully.",
        "id": vulnerability.id,
        "status": vulnerability.status
    }
