# LegalMind Web v1.0 — GitHub Pages

The LegalMind website includes AI-generated legal scenarios, AI courtroom witnesses,
AI argument evaluation, local browser career saves and free browser text-to-speech.

This version is **bring your own OpenAI API key (BYOK)**. Every visitor uses
their own OpenAI API key, for which OpenAI may charge usage. ChatGPT plans do not
include API credit. Keys are held only in the current browser tab's JavaScript memory
(not localStorage, cookies or the GitHub repository), and cleared on refresh/close.
Cases and career history **are** stored in browser localStorage, and do not sync.

## One-time site owner setup — REQUIRED for live AI

GitHub Pages only hosts static content and cannot run API requests securely.
You must deploy the small HTTPS gateway in the repository's `gateway/` directory.

1. Set up a Cloudflare account and Node.js.
2. Download/clone this repository and open a terminal in its `gateway` folder.
3. Run `npx wrangler login`, then `npx wrangler deploy`.
4. Copy the deployed `https://<your-worker-name>.<your-subdomain>.workers.dev` URL.
5. Edit `docs/config.js` and set
   `window.LEGALMIND_GATEWAY_URL = 'https://<your-worker-name>.<your-subdomain>.workers.dev';`.
6. Commit that config change; GitHub Pages will then display a prefilled gateway URL
   in Settings. **The URL is public and is safe to commit; OpenAI API keys are not.**
7. Ensure **Settings → Pages → Deploy from a branch → main /docs**.

Alternatively, players can enter a trusted `*.workers.dev` gateway URL manually
in Settings without editing the repo.

## How players use LegalMind

1. Open `https://dallasssswd.github.io/LegalMind/`.
2. Choose **Settings**.
3. Review the gateway URL and verify that it belongs to the site owner or another
   operator you trust. Enter your own **new, unshared** OpenAI API key.
4. Choose **CONNECT FOR THIS SESSION**.
5. Return to Scenarios or Courtroom; play with AI-generated responses.
6. Use **DISCONNECT / CLEAR KEY** to discard the current key reference.

Keys are transmitted over HTTPS to the gateway and to OpenAI for each AI request.
They are never persisted by this application's code, but can be exposed by
malicious websites, modified Worker code, browser extensions or infrastructure
outside the app's control. Do not share the API key in chat or on GitHub.
Revoke any previously exposed keys.

## Security and launch readiness

This is application v1.0 **source code**, not a certified or audited production
service. Before a large public launch, test the deployed gateway on mobile and
desktop, add server-side rate limiting, monitoring, privacy policy, support and
abuse handling. The origin check is not authentication and does not prevent
non-browser callers from sending requests with their own credentials.

Legal information is fictional and may be incorrect; this game is **not legal advice**.
There is no live AI until a separately hosted gateway is deployed.

## Browser compatibility

The interface is responsive for desktop, tablets, Android and iOS; browser
speech synthesis can vary. Progress is stored separately in each browser.
