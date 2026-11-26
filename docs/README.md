# LegalMind GitHub Pages (static demo)

This folder is a **GitHub Pages-compatible** version of LegalMind that runs entirely in a web browser. It uses the same retro theme and includes rotating fictional practice cases, scripted witness answers, a simple disclosed practice scoring checklist, career XP, case archives in browser localStorage, and free browser text-to-speech.

**No live AI is available on GitHub Pages alone.** GitHub Pages cannot execute the Python Flask backend. Do **not** put an OpenAI API key in front-end source code or send a private key through a public untrusted service. Live AI needs a separately hosted, secured backend.

## Publish

1. Open the LegalMind repository on GitHub.
2. Under **Settings → Pages**, choose **Deploy from a branch**.
3. Choose branch **main** and folder **/docs**, then **Save**.
4. The expected project-site address is `https://dallasssswd.github.io/LegalMind/` once GitHub confirms publication.

If your GitHub plan is Free, GitHub Pages requires a **public repository**. Your LegalMind repository was private when this folder was created. Do not change its visibility without checking that you are comfortable making the entire repository source public. Paid GitHub plans may offer Pages publication from private repositories, but the published website itself is public.

The main Windows and local Flask versions are still maintained separately. This demo's progress does not synchronize with those versions.

## Cross-device support

The static GitHub Pages practice version is designed for phone, tablet, laptop and desktop browsers. It includes responsive navigation, touch-friendly buttons, accessible focus states and mobile-friendly text input sizing. Speech uses the browser's speech synthesis support; if unavailable, the text game is still usable. Some mobile browsers require a tap on **Replay Last Audio** rather than autoplay.

Progress is kept in that browser's localStorage, not synced between phones and computers. Private browsing or clearing site data may erase it. This is a non-AI sample-case demo; the live AI local Flask app is a separate project mode that cannot run on GitHub Pages alone. Browser and device testing is still recommended before calling every device fully supported.
