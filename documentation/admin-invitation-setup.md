# Admin invitation code setup

Public registration always assigns the `Learner` role unless the registrant selects the Admin flow and supplies the server-side invitation code. The FastAPI backend compares that code before creating an Admin account. A role value submitted by a client is ignored; authorization continues to come from the stored user role.

## Configure the code

The backend loads `backend/.env` at startup (existing process environment values take precedence). Copy `backend/.env.example` to `backend/.env`, then replace the placeholder with a long, randomly generated value. To generate 32 random bytes encoded as hex in PowerShell, use:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Put the generated value after `CYBERSHIELD_ADMIN_INVITATION_CODE=` in `backend/.env`. The local code can be found only in that ignored backend file. Never put it in frontend configuration, React code, API responses, or a committed file. Restart FastAPI after changing it. Admin registration is rejected when the value is unset or empty, or when the submitted code is missing or incorrect. Learner registration does not require it. The code is not returned by the API or persisted in the database.

For deployments that load `.env` files, use the deployment's existing environment loader to provide this variable to the backend process; do not commit real secrets. Existing Admin accounts and the separate `create_admin.py` setup flow are unaffected.
