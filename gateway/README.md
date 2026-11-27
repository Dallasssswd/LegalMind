# LegalMind Cloudflare Worker API gateway

GitHub Pages cannot run Python or keep a server-side secret. The optional Cloudflare Worker forwards each player's personally supplied OpenAI API key to OpenAI for case generation, witness testimony and educational evaluation. **No key is written to Cloudflare KV, database, log, or any repository** by the Worker code.

## Deploy (repository owner)

1. Create a Cloudflare account and install Node.js.
2. In the repository root run `cd gateway` and `npx wrangler login`.
3. Run `npx wrangler deploy`. Confirm the issued `https://legalmind-gateway.<your-subdomain>.workers.dev` URL.
4. On your published LegalMind Pages website, open Settings and enter the **exact HTTPS Worker URL**. Each player can then supply their own OpenAI API key for their current tab only.
5. Test: `https://<your-worker-domain>/health` should show `{"ok":true,...}`.

The Worker is locked to browser requests from `https://dallasssswd.github.io`. If you move the site to a custom domain, update `ALLOWED_ORIGIN` inside `src/index.js` and redeploy.

**Security and limitations**

- This is a bring-your-own-key (BYOK) architecture. Only use this Worker if you trust the website owner and the deployed backend; user keys are transmitted over HTTPS through the Worker to OpenAI for each request. Key material can still be exposed by compromised browser extensions, client devices, malicious changes to website or Worker code, or infrastructure logging outside application control.
- Publicly exposing *your own* OpenAI key in source code is never safe; don't do it.
- This example contains basic request validation, fixed upstream URL, origin restriction and payload size caps. **CORS is not authentication, and public Workers can receive traffic from non-browser clients.** For broader public use add abuse protection, rate limits, monitoring, proper legal/privacy notices, terms and incident response.
- Do not accept arbitrary user-configured API target URLs or enable unrestricted cross-origin access in the Worker.
- This gateway is an example deployment, not an audited production security service. Users must have valid API credit; ChatGPT subscription doesn't include API calls.
- OpenAI keys are never written to `localStorage` by LegalMind. The game deliberately clears them on page reload, and progress is saved only in each browser.

