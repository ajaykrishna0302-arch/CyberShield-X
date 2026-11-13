

from getpass import getpass

from app.database import SessionLocal
from app.models import User
from app.routes.auth import hash_password


def create_admin():
    db = SessionLocal()

    try:
        print("\n=== CyberShield X | Admin Account Setup ===\n")

        name = input("Enter Admin name: ").strip()
        email = input("Enter Admin email: ").strip().lower()

        if len(name) < 2 or len(email) < 5:
            print("Invalid name or email.")
            return

        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            print("This email already has an account.")
            print("Choose a different email for the Admin account.")
            return

        password = getpass("Create Admin password: ")
        confirm_password = getpass("Confirm Admin password: ")

        if len(password) < 10 or len(password) > 128:
            print("Password must be 10–128 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="Admin",
            is_active=1
        )

        db.add(admin)
        db.commit()

        print("\nAdmin account created successfully!")
        print("You can now log in through CyberShield X.")

    except Exception as error:
        db.rollback()
        print("Could not create Admin account:", error)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
