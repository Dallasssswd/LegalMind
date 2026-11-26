# LegalMind v0.3.1

Retro-terminal Windows desktop law simulation game, with AI-generated fictional scenarios and interactive courtroom hearings.

## Game modes

- **Scenario Challenges:** Select a jurisdiction, legal category, and difficulty. Generate a fictional case, write your analysis, and get AI feedback and a 0–100 educational score.
- **Courtroom Simulator:** Generate a fictional hearing, ask up to six questions of an AI witness, then submit a closing argument to an AI judge for feedback.
- **Career Mode:** Earn XP and unlock ranks.
- **Archives:** Review your previous arguments, scores, XP, and feedback saved in SQLite.

Case generation and grading require an OpenAI API key. API usage is billed separately from ChatGPT subscriptions. Results are educational and may be legally inaccurate; consult official sources for real legal questions.

## Run on Windows

Install Python (3.12 or later), open PowerShell in the cloned project folder, and run:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```

If the virtual environment already exists, skip the first command. To receive updates:

```powershell
git pull origin main
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```

## OpenAI key: temporary session-only entry

**Revoke any previously exposed API key and create a new one.**

1. Open LegalMind and choose **Settings / API Status**.
2. Paste your new API key into the masked field.
3. Click **USE KEY FOR THIS SESSION**.
4. Return to the main menu and generate an AI case.
5. To discard the session key early, use **FORGET SESSION KEY NOW**.

The key is held only in Python process memory. It is **not** saved to `.env`, SQLite,
or GitHub. When LegalMind closes, the key is no longer retained by the app;
you will need to enter it again at the next launch. Python does not guarantee
that all memory copies are securely erased, and API requests send the key to OpenAI
to authenticate. The input box clears after you press the Use Key button.

Existing `.env` files are no longer used for API credentials. Remove any secret
from them if you previously configured the app that way. The model defaults to
`gpt-4.1-mini` and is configurable through `LEGALMIND_MODEL`.

API usage is billed separately from ChatGPT subscriptions.

## Persistence

Progress saves to `%USERPROFILE%\.legalmind\legalmind.db`. Older v0.2 saves are migrated automatically.

## Notes

The UI uses background threads for AI requests so Windows remains responsive. The game does not give real-world legal advice. Courtroom testimony is invented for the fictional hearing and is not evidence about real events.
