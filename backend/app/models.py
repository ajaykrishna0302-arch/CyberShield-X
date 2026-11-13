
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    device_name = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=False)
    device_type = Column(String(50), nullable=False)
    description = Column(String(250), nullable=True)
    status = Column(String(30), default="Registered")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
class SecurityAssessment(Base):
    __tablename__ = "security_assessments"

    id = Column(Integer, primary_key=True, index=True)
    scan_type = Column(String(30), nullable=False)
    target = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False)

    risk_score = Column(Integer, nullable=True)
    risk_level = Column(String(30), nullable=True)

    total_issues = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)

    results_json = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    target = Column(String(255), nullable=True)
    severity = Column(String(30), nullable=False)
    recommendation = Column(Text, nullable=True)
    status = Column(String(30), default="Open", nullable=False)

    source_assessment_id = Column(
        Integer,
        ForeignKey("security_assessments.id"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="Learner", nullable=False)
    is_active = Column(Integer, default=1, nullable=False)
    academy_xp = Column(Integer, default=0, nullable=False, server_default="0")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class SupportRequest(Base):
    __tablename__ = "support_requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(160), nullable=False)
    category = Column(String(40), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AcademyQuestionHistory(Base):
    __tablename__ = "academy_question_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mode = Column(String(20), nullable=False)
    question_id = Column(String(80), nullable=False)
    cycle = Column(Integer, nullable=False, default=1)
    attempt_token = Column(String(36), unique=True, nullable=False)
    answered = Column(Integer, nullable=False, default=0)
    correct = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
