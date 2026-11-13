import random
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import AcademyQuestionHistory, User
from app.routes.auth import require_roles

router = APIRouter(prefix="/api/academy", tags=["Learning Academy"])

# Original educational items, kept server-side so correct answers are not sent before submission.
BANKS = {
 "quiz": [
  ("q01","Beginner","Phishing","A campus notice says your mailbox will close today and links to a sign-in page. What is the safest first step?",["Open the link and check","Visit the known campus portal directly","Reply asking if it is real","Forward it to classmates"],1,"Use a known address or app rather than a link in an unexpected urgent message."),
  ("q02","Beginner","Passwords","A new account allows a passphrase and MFA. Which setup is strongest?",["Reuse your email password","Use a unique long passphrase and MFA","Use your name with 123","Share a password with a teammate"],1,"Unique passwords limit reuse risk; MFA adds another verification factor."),
  ("q03","Beginner","Links","A delivery text links to a tracking page on an unfamiliar domain. What should you do?",["Enter your address and card details","Open the carrier app or type its known website","Install the suggested tracking app","Send the link to a friend"],1,"Check delivery information through the official app or a website you navigate to yourself."),
  ("q04","Beginner","Information disclosure","A caller asks for your one-time login code to verify your identity. What is safest?",["Read it out if they know your name","Share only the first digits","Do not share it; contact the service through a known channel","Ask them to text you first"],2,"One-time codes should not be shared with callers; verify independently."),
  ("q05","Intermediate","Pretexting","A caller claims to be from IT and says a director approved a password reset, but the request is unusual. What should you do?",["Follow the caller's instructions","Verify through the published IT contact and approval process","Ask for the director's birthday","Send a screenshot of your account"],1,"A plausible story is not proof. Verify the request through a separate trusted channel."),
  ("q06","Intermediate","MFA fatigue","You receive repeated sign-in prompts you did not initiate. What is the safest response?",["Approve one to stop the alerts","Deny them and report the prompts; change credentials through the official portal","Turn off MFA","Send the prompts to the requester"],1,"Unexpected prompts may signal password compromise. Deny and report them promptly."),
  ("q07","Intermediate","Attachments","An expected-looking invoice arrives from a vendor, but the file asks you to enable macros. What should you do?",["Enable macros to read it","Verify with the vendor using known contact details and report the file","Upload it to a public converter","Rename and open it"],1,"Unexpected active content is risky; verify the file independently before opening."),
  ("q08","Intermediate","Website trust","A login page has the expected logo but a misspelled domain. What matters most?",["The logo looks genuine","The domain matches the official address","The page loads quickly","A colleague forwarded it"],1,"Visual branding is easy to copy. Check the exact domain and navigate independently."),
  ("q09","Advanced","Business email compromise","A supplier emails new bank details and says payment must be made before close of business. What should finance do?",["Pay quickly to avoid delay","Verify the change using the established callback number and dual-approval process","Reply to confirm the account number","Ask the sender to resend the email"],1,"Urgency and changed payment details require independent verification and normal approvals."),
  ("q10","Advanced","Incident response","You entered credentials on a suspicious page and then approved an MFA prompt. What should happen first?",["Delete the browser history","Report immediately through the incident channel and follow account containment steps","Wait to see whether anything happens","Warn others by forwarding the original link"],1,"Prompt reporting enables responders to secure the account and investigate quickly."),
  ("q11","Advanced","Identity verification","A senior executive messages from a new number asking for employee records. How do you respond?",["Send a small sample first","Verify identity using the directory-listed contact and approved data-sharing process","Ask them to send a photo ID","Move the conversation to a personal account"],1,"Verify identity and authorization separately before sharing sensitive information."),
  ("q12","Expert","Multi-step manipulation","A familiar colleague asks you to review a shared document, then a chat support agent requests the code sent to your phone to restore access. What is safest?",["Give the code because the colleague referred you","Stop, do not share the code, and report both contacts through known channels","Open the document on a personal device","Ask the agent to use a different code"],1,"A multi-step approach can combine compromised accounts and impersonation. Treat codes as secret and report the chain."),
 ],
 "challenge": [
  ("c01","Beginner","Phishing","A library account warning arrives with a link to confirm your password.","What is the safest action?",["Use the link immediately","Open the library website from a saved bookmark and check notices","Reply with your password","Ignore all future library notices"],1,"The saved official site avoids the unsolicited link while letting you check the notice."),
  ("c02","Beginner","Suspicious links","A QR code on a poster promises free campus event tickets and opens a short URL.","How should you proceed?",["Enter your campus login","Check the event through the official campus events page","Install the app it recommends","Share the QR code"],1,"Confirm the offer using a trusted source before entering information or installing software."),
  ("c03","Beginner","Information disclosure","Someone at a shared desk asks you to read the code that just arrived on your phone.","What do you do?",["Read it aloud","Decline and ask what account they are trying to access","Show them the notification","Send a screenshot"],1,"Verification codes authorize access and must remain private."),
  ("c04","Intermediate","Impersonation","A person wearing a contractor badge asks you to hold a secure door because their hands are full.","What is the safest response?",["Let them follow you in","Direct them to reception or the normal visitor check-in","Ask which employee they know","Take a photo of their badge and admit them"],1,"Use the established access process; appearance or a convincing reason is not authorization."),
  ("c05","Intermediate","Pretexting","A caller says they are conducting an urgent account audit and asks you to confirm your manager's travel dates.","What should you do?",["Answer only approximate dates","Decline and verify the request with your manager through a known channel","Ask the caller to guess the dates","Post the request in a public chat"],1,"Personal and operational details can aid targeted manipulation. Verify the purpose and requester."),
  ("c06","Intermediate","MFA fatigue","During a meeting, sign-in approval prompts keep appearing on your phone.","Choose the safest response.",["Approve and investigate later","Deny the prompts, report them, and contact IT using the directory","Silence the phone","Approve one and change password next week"],1,"Repeated unexpected prompts are a warning signal and should be reported promptly."),
  ("c07","Intermediate","Attachments","A known partner sends a spreadsheet you were not expecting and asks you to enable editing.","What should you do?",["Enable editing","Verify the file using a known contact method and follow attachment policy","Open it on a shared kiosk","Forward it to your team"],1,"Compromised or spoofed accounts can send harmful files. Confirm unexpected content out of band."),
  ("c08","Advanced","Business email compromise","A supplier's email thread changes payment instructions and requests secrecy until the transfer clears.","What is the safest next step?",["Keep it confidential and pay","Pause payment and verify via the established callback and approval workflow","Reply asking whether the account is correct","Send a small test payment"],1,"Changed payment instructions and secrecy pressure are strong fraud indicators."),
  ("c09","Advanced","Incident response","You realize you uploaded a work document to a site reached from an unexpected message.","What should you do first?",["Delete your local copy","Report it immediately through the incident process and provide accurate details","Ask the sender to delete it","Wait until the next team meeting"],1,"Early reporting helps responders limit exposure and preserve useful evidence."),
  ("c10","Advanced","Identity verification","A manager's account asks you to send a roster to a new external address, citing a deadline.","What is the safest response?",["Send it because it came from their account","Verify through a separate known channel and confirm the recipient is authorized","Remove phone numbers and send the rest","Ask the new address to confirm"],1,"A real account can be compromised. Verify the request and data authorization independently."),
  ("c11","Expert","Multi-step social engineering","A caller posing as help desk asks you to approve MFA, while a chat from a colleague says the request is expected.","How should you respond?",["Approve because two people confirmed it","Stop the interaction and contact IT using the directory-listed channel; report both messages","Ask the caller for an employee ID","Approve after changing your password"],1,"Coordinated messages do not independently validate a request. Use a trusted channel and report the pattern."),
  ("c12","Expert","Incident response","You suspect a colleague's account sent a confidential file request to several teams and one person complied.","What is the best response?",["Confront the colleague in the group chat","Report through incident response, preserve the message, and avoid forwarding the file","Delete the message from everyone's inbox","Wait for the colleague to confirm"],1,"A coordinated report lets responders contain the account and assess exposure without spreading the material."),
 ]
}

class AnswerBody(BaseModel):
    attempt_token: str = Field(min_length=36, max_length=36)
    selected_option: int = Field(ge=0, le=3)


def learner(user: User = Depends(require_roles("Learner"))):
    return user


def tier(level):
    return "Beginner" if level <= 3 else "Intermediate" if level <= 6 else "Advanced" if level <= 10 else "Expert"


@router.get("/progress")
def progress(user: User = Depends(learner)):
    level = user.academy_xp // 100 + 1
    return {"xp": user.academy_xp, "level": level, "difficulty": tier(level)}


@router.post("/{mode}/next")
def next_question(mode: str, new_cycle: bool = Query(False), db: Session = Depends(get_db), user: User = Depends(learner)):
    if mode not in BANKS:
        raise HTTPException(status_code=404, detail="Question bank not found")
    bank = [q for q in BANKS[mode] if q[1] == tier(user.academy_xp // 100 + 1)]
    history = db.query(AcademyQuestionHistory).filter_by(user_id=user.id, mode=mode).all()
    current_cycle = max((row.cycle for row in history), default=1)
    seen = {row.question_id for row in history if row.cycle == current_cycle}
    unseen = [q for q in bank if q[0] not in seen]
    cycle = current_cycle
    if unseen:
        candidates = unseen
    else:
        if not new_cycle:
            return {"exhausted": True, "message": "You have completed this difficulty bank. Start a new cycle to continue."}
        # New cycle: avoid the four most recently seen items where the bank allows it.
        recent_ids = {row.question_id for row in sorted(history, key=lambda row: row.id)[-min(4, len(bank)-1):]}
        candidates = [q for q in bank if q[0] not in recent_ids] or bank
        cycle = current_cycle + 1
    question = random.choice(candidates)
    attempt_token = str(uuid.uuid4())
    db.add(AcademyQuestionHistory(user_id=user.id, mode=mode, question_id=question[0], cycle=cycle, attempt_token=attempt_token))
    db.commit()
    result = {"id": question[0], "difficulty": question[1], "topic": question[2], "prompt": question[3] if mode == "quiz" else question[4], "options": question[4] if mode == "quiz" else question[5], "attempt_token": attempt_token, "cycle": cycle}
    if mode == "challenge": result["scenario"] = question[3]
    return result


@router.post("/{mode}/answer")
def answer(mode: str, data: AnswerBody, db: Session = Depends(get_db), user: User = Depends(learner)):
    if mode not in BANKS: raise HTTPException(status_code=404, detail="Question bank not found")
    attempt = db.query(AcademyQuestionHistory).filter_by(user_id=user.id, mode=mode, attempt_token=data.attempt_token).first()
    if not attempt: raise HTTPException(status_code=404, detail="Question attempt not found")
    q = next((item for item in BANKS[mode] if item[0] == attempt.question_id), None)
    if not q: raise HTTPException(status_code=500, detail="Question unavailable")
    answer_index, explanation = (q[5], q[6]) if mode == "quiz" else (q[6], q[7])
    correct = data.selected_option == answer_index
    if attempt.answered:
        return {"correct": bool(attempt.correct), "explanation": explanation, "xp_awarded": 0, "already_answered": True, "correct_option": answer_index}
    attempt.answered = 1
    attempt.correct = int(correct)
    earned = (10 if mode == "quiz" else 15) if correct else 0
    user.academy_xp += earned
    db.commit()
    return {"correct": correct, "explanation": explanation, "xp_awarded": earned, "level": user.academy_xp // 100 + 1, "correct_option": answer_index}
