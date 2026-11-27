# LegalMind Web — AI connection and practice mode

LegalMind is published on [GitHub Pages](https://dallasssswd.github.io/LegalMind/).
The website supports both **free built-in practice** and an optional **live AI mode**.

## Why the OpenAI key isn't enough

GitHub Pages only serves static HTML/CSS/JS. It **cannot operate the OpenAI API backend** by itself.
For security, LegalMind sends API keys only to an explicitly configured HTTPS server-side gateway.
**Do not put an OpenAI key in `config.js`, the repository, HTML or JavaScript source.**

## One-time setup for site owner (not players)

The example Cloudflare Worker is already checked into `gateway/`.

Option A — Cloudflare dashboard (no local Node.js needed):

1. Sign into [Cloudflare](https://dash.cloudflare.com/), go to **Workers & Pages**, and choose to create a Worker from an existing Git repository.
2. Connect the `Dallasssswd/LegalMind` GitHub repository and select the `main` branch.
3. Set the **root directory** to `gateway`. The Worker project name should match `legalmind-gateway` in `gateway/wrangler.json`.
4. Configure the deploy command as `npx wrangler deploy` if prompted, and deploy.
5. Cloudflare displays the new `https://....workers.dev` URL. Open that URL with `/health` appended to verify it returns `{"ok":true,...}`.
6. Edit `docs/config.js` in GitHub and set only the **public Worker URL**:

   ```js
   window.LEGALMIND_GATEWAY_URL = 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev';
   ```

7. Commit the change, allow GitHub Pages to publish, and refresh the website.

Option B — PowerShell:

```powershell
cd "$HOME\LegalMind-GitHub"
git pull origin main
cd gateway
npx wrangler login
npx wrangler deploy
```

The site owner must deploy the Worker once. **Players never enter a gateway URL.** Cloudflare account authorization and deployment cannot be completed by GitHub commits alone.

## For players

1. On LegalMind, go to **Settings**.
2. When AI is activated, enter **your own OpenAI API key** and click **Connect OpenAI**.
3. Generate a new case. It will then use live AI for cases, witnesses and grading.
4. Click **Clear Session Key** or close the browser tab to clear LegalMind's current key reference.

The key is not written to localStorage; progress is saved in localStorage on that particular browser. A browser extension, compromised frontend or modified server can still expose keys, so only enter keys on a site/server you trust. Keys pass through the deployed Worker and on to OpenAI over HTTPS. OpenAI API usage may have charges separate from ChatGPT.

If the Worker isn't deployed, Settings clearly displays **Live AI is not activated** and the free practice mode continues working. **No one should be asked to enter a key until the owner configures the backend.**

## Before a broad public release

The example server isn't security audited. Configure Cloudflare rate limiting, monitoring, and abuse prevention; audit the source and privacy disclosures. A CORS origin allowlist alone is *not* authentication. The game is fictional educational content, not legal advice.
