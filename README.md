# LegalMind — Desktop, Local Web, and GitHub Pages v1

Retro-terminal legal simulation game with **Windows desktop** and **local browser web** versions. Both feature AI-generated fictional legal scenarios and interactive courtroom hearings.

## Web edition (new in v0.5.0)

The Windows app remains available and unchanged. To run the browser edition on your Windows computer:

```powershell
cd "$HOME\LegalMind-GitHub"
git pull origin main
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe web_app.py
```

Then open **http://127.0.0.1:5050** in your browser. Keep the terminal running; press Ctrl+C to stop.

The web edition provides AI scenario challenges, courtroom witness questions, AI grading, career XP, saved case archives, and **free browser text-to-speech**. Enter your OpenAI key in Settings; the key remains only in browser page memory, is sent to the local Flask backend with each AI request, and isn't written to disk. Closing or refreshing the page clears it. Case history/XP is separately stored in that browser's localStorage (not synchronized with desktop saves).

**Security:** This is a *localhost-only development web app*, not a deployed public website. Do not expose the Flask development server to the internet. Public hosting requires HTTPS, production deployment, authentication and abuse protections. The OpenAI API can still incur usage charges. Revoke any earlier exposed keys.

## GitHub Pages website (v1.0 BYOK)

The `docs/` folder now contains the **live AI** GitHub Pages frontend.
Visitors can enter their own OpenAI API key in Settings for each browser tab.
The key is not saved by LegalMind. Cases, witnesses and grading work only after
an HTTPS Cloudflare Worker API gateway has been deployed. GitHub Pages itself
cannot run the backend; the gateway code is included in `gateway/`.

**Required setup:** deploy `gateway/` with `npx wrangler deploy`, then place its
public `*.workers.dev` URL in `docs/config.js`. See
[docs/README.md](docs/README.md) and [gateway/README.md](gateway/README.md).
Do not publish an API key or blindly trust another person's gateway.
API usage may be billed to the key owner.

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

## Free Windows text-to-speech

Windows' built-in System.Speech voice engine reads new case facts, witness replies, and judge feedback aloud. There are **no voice API charges** and no additional Python libraries required. Text-to-speech works offline, although generating AI content still requires the OpenAI API and may incur API costs.

- Open **Settings** to toggle voice on/off, test a voice, or stop playback.
- On a case screen, use **Replay Last Audio** or **Stop Audio**.
- The voice preference lasts only while the application is running.
- The app does not save speech audio files. Narration relies on installed Windows voices and may sound robotic.

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
