# Deploy SuperBrain to Firebase App Hosting

The repo is already wired for **Firebase App Hosting** — `apphosting.yaml`, `firebase.json`, and `.firebaserc` are committed and point at the `superbrain-tokens` project.

> **Heads up:** App Hosting runs Cloud Run under the hood, which requires the **Blaze (pay-as-you-go) plan**. Free tier covers a generous amount but the project must be on Blaze to deploy. Switch from Spark to Blaze in the Firebase console first.

## Once-only setup

```bash
# 1. Install Firebase CLI if you don't have it
npm install -g firebase-tools

# 2. Sign in
firebase login

# 3. Confirm you're targeting the right project
firebase use superbrain-tokens

# 4. Create the App Hosting backend (one-time)
firebase apphosting:backends:create
# Choose: source = this repo, region = us-central1 (or nearest)
# Connect your GitHub: jin-dalrae/2604-tokens-hackathon, branch: main
```

After this step Firebase will auto-deploy on every push to `main`. The first deploy takes ~5 minutes.

## Push the secrets

App Hosting reads sponsor credentials from **Google Secret Manager**, not `.env`. Set each one:

```bash
firebase apphosting:secrets:set REDIS_URL
firebase apphosting:secrets:set ghost_admin_api
firebase apphosting:secrets:set ghost_url
firebase apphosting:secrets:set SENSO_API_KEY
firebase apphosting:secrets:set TinyFish_API
firebase apphosting:secrets:set CDP_client_api
firebase apphosting:secrets:set CDP_secret
firebase apphosting:secrets:set GEMINI_API_KEY
firebase apphosting:secrets:set COSMO_API_KEY
firebase apphosting:secrets:set APP_PUBLIC_URL
```

For each one, paste the value from your local `.env`. The CLI uploads it to Secret Manager and binds it to the App Hosting backend.

For `APP_PUBLIC_URL`: after the first deploy, App Hosting will give you a URL like `https://superbrain--superbrain-tokens.us-central1.hosted.app`. Set that as the value.

## Manual deploy

If you want to push without going through GitHub:

```bash
firebase deploy --only apphosting
```

## Firebase client SDK

The web SDK is wired in `src/lib/firebase.ts` and bootstrapped from `src/components/FirebaseAnalytics.tsx`. Analytics initializes once on the client (SSR-safe via `firebase/analytics`'s `isSupported()` check). The Firebase web API key is a public identifier and is committed in `apphosting.yaml` as a `NEXT_PUBLIC_*` value — that's the recommended pattern.

## Common issues

- **"Project not on Blaze"** — switch in Firebase console → Settings → Usage and billing.
- **Secret access denied** — make sure App Hosting's service account has the `Secret Manager Secret Accessor` role (Firebase usually wires this automatically).
- **Build fails on Next.js 16** — App Hosting supports Next.js 16; if it claims otherwise, set `runtime: nodejs20` in `apphosting.yaml` (we leave it default since it auto-detects).
- **Ghost iframe doesn't render in production** — set `APP_PUBLIC_URL` secret to your live App Hosting URL after the first deploy, then re-deploy. The CMS HTML is generated at run time, so Ghost posts published before this is set will still iframe `localhost`.

## Why not GitHub Pages?

GitHub Pages serves static files only. SuperBrain needs a Node runtime for SSE streaming, server-side API routes, Redis client, Gemini synthesis, CDP facilitator, Ghost / Senso publishing, and the in-memory job store. Static hosting can't run any of that.

## Alternatives to App Hosting

- **Vercel** (`npx vercel --prod`) — zero-config Next.js, free tier covers this app, fastest path to a public URL.
- **Cloud Run direct** — if you want the same backend without App Hosting's GitHub integration.
- **Railway / Fly / Render** — all work; just deploy the Next.js app and set the same env vars.
