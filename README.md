# Humanity-AI.Quest — Deployment Guide


This is the complete, production-ready website for **humanity-ai.quest**.

- React + Vite single-page app
- All 10 pages, interactive HRC explorer with 52 clauses, live HRC Agent
- Cloudflare Pages Function as secure backend proxy to the Anthropic API
- Total monthly cost: **$0** for hosting. Only Anthropic API usage costs anything, and only when people actually chat with the agent.

---

## Why this stack

**10web.io won't work.** 10web is a WordPress + Elementor AI builder. It generates page content from prompts but cannot run a React application with interactive components or a live AI chat. Trying to force it would mean losing all interactivity.

**Cloudflare Pages is the right answer.** It has unlimited bandwidth on the free tier (Vercel and Netlify cap at ~100GB/month), built-in serverless functions to securely proxy the Anthropic API, and is by far the cheapest way to run a public-facing React site with a live AI agent.

---

## Project structure

```
humanity-ai-quest/
├── functions/
│   └── api/
│       └── chat.js          ← Secure Anthropic proxy (runs server-side)
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx              ← The full website (all 10 pages + agent)
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

---

## Step-by-step: Get it live

### Prerequisites (one-time)

- A GitHub account (free) → https://github.com/signup
- A Cloudflare account (free) → https://dash.cloudflare.com/sign-up
- An Anthropic API key → https://console.anthropic.com (sign in, go to API Keys, create new key)
- Node.js 18+ installed locally → https://nodejs.org

### 1. Test the site locally (5 minutes)

```bash
cd humanity-ai-quest
npm install
npm run dev
```

Open http://localhost:5173 — the site runs but the HRC Agent will fail because `/api/chat` doesn't exist yet locally. That's fine. We'll fix it on deploy.

### 2. Push to GitHub (3 minutes)

```bash
cd humanity-ai-quest
git init
git add .
git commit -m "Initial commit — Humanity-AI.Quest"
```

Then on github.com, create a new empty repo (name it `humanity-ai-quest`, keep it public or private — your choice), and:

```bash
git remote add origin https://github.com/YOUR-USERNAME/humanity-ai-quest.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Cloudflare Pages (5 minutes)

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare to access your GitHub, select the `humanity-ai-quest` repo.
3. On the build config screen:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - Leave everything else default
4. Click **Save and Deploy**. First build takes ~2 minutes.
5. You'll get a URL like `humanity-ai-quest.pages.dev` — open it. The site is live, but the agent won't work yet (no API key configured).

### 4. Add the Anthropic API key as a secret (2 minutes)

This is the critical security step. **Never put the API key in your code.**

1. In Cloudflare dashboard → your Pages project → **Settings** → **Environment variables**.
2. Under **Production**, click **Add variable**:
   - **Variable name**: `ANTHROPIC_API_KEY`
   - **Value**: paste your Anthropic API key (starts with `sk-ant-…`)
   - **Encrypt**: yes (toggle on — this is essential)
3. Click **Save**.
4. Go to **Deployments** → click **Retry deployment** on the latest one so the function picks up the new variable.

Now visit your `.pages.dev` URL again and try the HRC Agent. It should respond.

### 5. Point the humanity-ai.quest domain at Cloudflare (10 minutes)

If you bought the domain elsewhere (Namecheap, GoDaddy, etc.):

1. Cloudflare dashboard → **Add a site** → enter `humanity-ai.quest` → choose Free plan.
2. Cloudflare gives you two nameservers (e.g., `ada.ns.cloudflare.com`). Go to your domain registrar's control panel, find DNS / nameserver settings, and replace whatever's there with Cloudflare's nameservers. Save.
3. Wait 5–60 minutes for DNS to propagate. Cloudflare's dashboard will show a green check when ready.

If you didn't buy the domain yet, **buy it through Cloudflare Registrar** — it's at-cost pricing with no markup, currently about $10–15/year for `.quest`. Then it's already configured.

### 6. Connect the domain to your Pages site (2 minutes)

1. Cloudflare → your Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `humanity-ai.quest` and `www.humanity-ai.quest` (one at a time).
3. Cloudflare auto-creates the DNS records. SSL is automatic. Done.

Visit https://humanity-ai.quest. Live.

---

## Cost expectations

| Item | Cost |
|---|---|
| Cloudflare Pages hosting | **$0/month** (free forever, unlimited bandwidth) |
| Cloudflare Pages Functions | **$0/month** (100,000 requests/day free) |
| Domain (humanity-ai.quest) | **~$10–15/year** |
| Anthropic API (Sonnet 4 model) | Pay per use, ~$3 per million input tokens. A typical HRC Agent conversation uses 5–15k tokens. **First 1000 visitors who actually chat with the agent ≈ $5–15.** |

For traffic spikes, the only thing that scales is your Anthropic bill. The hosting stays free. To cap your exposure, set a **spending limit** in your Anthropic console (Settings → Billing → Usage limits).

---

## Operating the site after launch

### To update the site

Edit code locally, then:

```bash
git add .
git commit -m "Your change description"
git push
```

Cloudflare auto-rebuilds and redeploys in ~90 seconds. Every push to `main` goes live automatically.

### To change the agent's behaviour

Open `src/App.jsx`, find `buildSystemPrompt`, edit. Push.

### To add new HRC clauses

Open `src/App.jsx`, find the `HRC_CORE`, `HRC_GOV`, or `HRC_OPS` arrays at the top. Add new entries following the same shape: `{ n: 34, t: "...", s: "...", r: "..." }`. Update the clause counts in the homepage and constitution page text. Push.

### To monitor cost and traffic

- Cloudflare → your Pages project → **Analytics** for visitors
- Anthropic Console → **Usage** for API spend

### Safety extras worth adding later

- **Rate limiting**: add a Cloudflare WAF rule to limit `/api/chat` to ~30 requests/minute per IP
- **Captcha**: gate the HRC Agent behind Cloudflare Turnstile (free, invisible to humans) to prevent abuse
- **Verified human auth**: when the project is ready, layer in real identity verification (WebAuthn or a service like Worldcoin)

---

## Troubleshooting

**Agent returns "I couldn't reach the constitution layer"**
- Check that `ANTHROPIC_API_KEY` is set in Cloudflare → Pages → Settings → Environment variables (Production tab).
- Re-deploy after adding the variable.
- Check the function logs: Cloudflare → Pages → your project → **Functions** tab → look for errors.

**Site won't build**
- Make sure Node 18+ is installed locally and try `npm install` again.
- On Cloudflare, double-check the build output directory is `dist` not `build`.

**Custom domain shows "Not Secure" or wrong page**
- Wait 10–15 minutes after adding the custom domain — SSL certificate provisioning takes a moment.
- Check DNS is fully propagated using https://dnschecker.org

---

## What you have now

- A complete launch-ready website at zero monthly hosting cost
- A live, secure HRC Agent backed by the Anthropic API
- Auto-deploy from GitHub on every push
- A foundation you can scale to millions of visitors without changing the architecture

Welcome to the constitutional era of AI.
