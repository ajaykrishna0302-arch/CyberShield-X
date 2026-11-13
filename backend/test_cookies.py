from http.cookies import SimpleCookie

test_cookies = [
    "session_id=abc123; Secure; HttpOnly; SameSite=Strict",
    "user_id=12345",
    "theme=dark; Secure"
]

for cookie_header in test_cookies:
    parsed_cookie = SimpleCookie()
    parsed_cookie.load(cookie_header)

    for name, cookie in parsed_cookie.items():
        print("\nCookie:", name)
        print("Secure:", bool(cookie["secure"]))
        print("HttpOnly:", bool(cookie["httponly"]))
        print("SameSite:", cookie["samesite"] or "Missing")