# InstantService — Run & Deploy

## Local development (recommended)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env    # MOCK_MODE=true by default
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Demo accounts (no Snowflake required when `MOCK_MODE=true`):

| Role | Email | Password |
|------|-------|----------|
| Client | `demo@instantservice.app` | `DemoPass1!` |
| Contractor | `contractor@instantservice.app` | `DemoPass1!` |

### 2. Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Open http://localhost:3000 and use **Continue as Demo Client**, then describe a plumbing issue to test the full flow.

## Production layout

| Service | Suggested host |
|---------|----------------|
| Next.js PWA | [Vercel](https://vercel.com) (see README badge `instant-service.vercel.app`) |
| FastAPI API | [Railway](https://railway.app), Render, or DigitalOcean App Platform |

Set on the frontend:

```
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

Set on the backend:

```
MOCK_MODE=false
DEMO_MODE=false
FRONTEND_ORIGIN=https://your-frontend.vercel.app
# plus GEMINI, ELEVENLABS, SNOWFLAKE keys
```

## Portfolio link

After the frontend is live, add **Explore Site** on your portfolio pointing to the Vercel URL (and keep **Explore Code** for GitHub).
