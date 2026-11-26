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
