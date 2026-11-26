# LegalMind v0.3.0

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

## Set up OpenAI

**Do not reuse previously shared/exposed API keys: revoke and replace them.**

1. Create a new secret key in the OpenAI API dashboard and ensure API billing is enabled if needed.
2. Run `Copy-Item .env.example .env` in the project folder.
3. Open the local `.env` and replace the placeholder with the new key.
4. Restart LegalMind.
5. Choose Scenario Challenges or Courtroom Simulator and click **Generate New Case**.

The project uses the Responses API. The default model is `gpt-4.1-mini` and can be changed with the `LEGALMIND_MODEL` environment variable.

**Never commit `.env` or paste secrets into GitHub/chat.** The repository's Python `.gitignore` excludes `.env`.

## Persistence

Progress saves to `%USERPROFILE%\.legalmind\legalmind.db`. Older v0.2 saves are migrated automatically.

## Notes

The UI uses background threads for AI requests so Windows remains responsive. The game does not give real-world legal advice. Courtroom testimony is invented for the fictional hearing and is not evidence about real events.
