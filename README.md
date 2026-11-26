# LegalMind

A retro-terminal-style Windows legal scenario simulation game built with Python and CustomTkinter.

## Current prototype (v0.2.0)

- Main menu and retro green-on-black theme
- First offline constitutional-law scenario
- Player arguments, local SQLite case archives and XP
- Career dashboard
- API configuration status; `ai_engine.py` provides an initial OpenAI scenario generator (not wired into the UI yet)
- Courtroom simulator reserved for a future release

**Educational game only.** Scenarios are fictional. Legal answers should be verified from authoritative primary sources.

## Run on Windows

Install Python 3.12+, then open PowerShell in the project folder:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```

## Optional OpenAI setup

1. Revoke any previously exposed API key and generate a new one.
2. Copy `.env.example` to `.env`.
3. Paste the new key into your local `.env` file.
4. Do **not** commit `.env` or paste your key into GitHub.

The UI currently runs offline. AI-powered challenges and evaluation are planned for a later version. API use has separate billing.

## Data

Progress saves locally to `%USERPROFILE%\.legalmind\legalmind.db`.
