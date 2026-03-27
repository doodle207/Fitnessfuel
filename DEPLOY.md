# Deploying CaloForgeX to Vercel + Supabase

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Under **Settings → Database → Connection string**, copy the **URI** format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
3. Keep this connection string — you'll need it as `DATABASE_URL`

> **Tables are auto-created** on first boot via the `initDatabase()` function. No manual migration needed.

---

## 2. Vercel Setup

### Connect your repo

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Vercel will auto-detect the `vercel.json` configuration

### Environment Variables (add all of these in Vercel → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres` | From Supabase |
| `SESSION_SECRET` | Any long random string (e.g. 64-char hex) | Used to sign session cookies |
| `OPENAI_API_KEY` | Your OpenAI key | For AI Coach & meal plans |
| `RAZORPAY_KEY_ID` | Your Razorpay key ID | For payments |
| `RAZORPAY_KEY_SECRET` | Your Razorpay key secret | For payments |
| `RESEND_API_KEY` | Your Resend API key | For OTP emails |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID | For Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret | For Google sign-in |
| `SERVE_STATIC` | `false` | Tells Express NOT to serve static files (Vercel does it) |
| `NODE_ENV` | `production` | Auto-set by Vercel |

### Build & Output settings (auto-detected from vercel.json)

- **Build command**: `pnpm run build`
- **Output directory**: `artifacts/fitness-app/dist/public`
- **API function**: `api/index.ts` handles all `/api/*` routes

---

## 3. Google OAuth (for Google sign-in on Vercel)

In the Google Cloud Console:
1. Go to **APIs & Services → Credentials**
2. Edit your OAuth client
3. Add your Vercel domain to **Authorized JavaScript Origins**: `https://your-app.vercel.app`
4. Add to **Authorized redirect URIs**: `https://your-app.vercel.app/api/auth/google/callback`

---

## 4. Razorpay Webhook (optional)

In your Razorpay dashboard, set the webhook URL to:
```
https://your-app.vercel.app/api/payments/razorpay/webhook
```

---

## 5. Custom Domain

After deploying, add your custom domain in Vercel → Settings → Domains.
Update `FRONTEND_URL` env var to your domain if you add one.
