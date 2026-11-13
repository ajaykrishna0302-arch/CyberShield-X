
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*_args, **_kwargs):
        return False

load_dotenv()

router = APIRouter(
    prefix="/api/ai-assistant",
    tags=["AI Cyber Assistant"]
)

api_key = os.getenv("GEMINI_API_KEY")

from google.genai import types

client = (
    genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(
            timeout=15000,
            retry_options=types.HttpRetryOptions(
                attempts=1
            )
        ),
    )
    if api_key
    else None
)


class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
def chat_with_ai(request: ChatRequest):

    if not client:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is not configured."
        )

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a message."
        )

    
    
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=[
                """
                You are CyberShield AI, an expert cybersecurity learning assistant.

                Explain ethical hacking, networking, Linux, web security,
                security tools, vulnerabilities and secure coding.

                Use clear explanations, practical examples and safe code.
                Focus on legal and authorized cybersecurity learning.
                """,
                request.message
            ]
        )

        return {"reply": response.text}

    except Exception as e:
        print("GEMINI ERROR:", repr(e))
        raise HTTPException(
            status_code=503,
            detail="AI service is busy. Please try again shortly."
        )

