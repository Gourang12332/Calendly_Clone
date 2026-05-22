# Calendly Clone

A full-stack scheduling application inspired by Calendly. Admins manage event types, availability, and meetings; invitees book via public links with calendar and time-slot selection.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Python FastAPI, SQLAlchemy
- **Database:** PostgreSQL (Supabase)
- **Email:** SMTP (optional) with logs stored in database

## Features

### Core
- Event type management (create, edit, delete, public booking links)
- Weekly availability schedules with rules
- Public booking page with calendar and time slots
- Slot generation with buffers and conflict detection
- Booking confirmation with meeting links
- Admin meetings view (upcoming / past)
- Cancel and reschedule flows (admin + public token links)
- Email notification logs (booking, cancel, reschedule)

### Bonus
- Multiple availability schedules
- Date-specific availability overrides
- Custom invitee questions (text, textarea, select)
- Buffer time before/after meetings
- Email service with SMTP or mock send

## Folder Structure

```
calendly-clone/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── seed.py
│   │   ├── deps.py
│   │   ├── routers/
│   │   └── services/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── README.md
```

## Supabase PostgreSQL Setup

1. Create a project at [https://supabase.com](https://supabase.com)
2. Go to **Project Settings → Database**
3. Copy the **Connection string** (URI mode)
4. Use the pooled or direct connection URL as `DATABASE_URL`

Example:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection URL |
| `FRONTEND_URL` | Frontend origin for CORS and email links (default `http://localhost:3000`) |
| `SMTP_HOST` | Optional SMTP host |
| `SMTP_PORT` | SMTP port (default 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | From email address |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default `http://localhost:8000`) |

## How to Run Locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your Supabase URL.

```bash
python -m app.seed
uvicorn app.main:app --reload
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Seed Data

The seed script creates:
- Default admin user (`admin@calendlyclone.com`)
- Default availability (Mon–Fri 9 AM–5 PM)
- Event types: **30 Minute Meeting**, **Interview Call**
- Custom questions and sample bookings

Public booking links:
- [http://localhost:3000/book/30-minute-meeting](http://localhost:3000/book/30-minute-meeting)
- [http://localhost:3000/book/interview-call](http://localhost:3000/book/interview-call)

## Deployment

### Backend (Railway / Render / Fly.io)

1. Set environment variables from `.env.example`
2. Run `pip install -r requirements.txt`
3. Run seed once: `python -m app.seed`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set `FRONTEND_URL` to your deployed frontend URL

### Frontend (Vercel)

1. Import the `frontend` folder
2. Set `NEXT_PUBLIC_API_URL` to your deployed backend URL
3. Deploy

## Assumptions

- No authentication; one default admin user is assumed logged in
- All admin API calls use the first user in the database
- Email sends are mocked as `sent` when SMTP is not configured
- Meeting links are auto-generated Google Meet-style URLs
- Timezone default is `Asia/Kolkata`

## API Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/event-types` | Create event type |
| GET | `/api/event-types` | List event types |
| GET | `/api/event-types/{id}` | Get event type |
| PUT | `/api/event-types/{id}` | Update event type |
| DELETE | `/api/event-types/{id}` | Delete event type |
| POST | `/api/availability-schedules` | Create schedule |
| GET | `/api/availability-schedules` | List schedules |
| GET | `/api/availability-schedules/{id}` | Get schedule |
| PUT | `/api/availability-schedules/{id}` | Update schedule |
| POST | `/api/availability-schedules/{id}/overrides` | Add date override |
| GET | `/api/public/event-types/{slug}` | Public event details |
| GET | `/api/public/event-types/{slug}/slots` | Available slots |
| POST | `/api/public/bookings` | Create booking |
| GET | `/api/public/bookings/{id}` | Booking details |
| GET | `/api/public/bookings/token/{token}` | Booking by token |
| POST | `/api/public/bookings/cancel/{token}` | Cancel by token |
| POST | `/api/public/bookings/reschedule/{token}` | Reschedule by token |
| GET | `/api/meetings?type=upcoming\|past` | List meetings |
| POST | `/api/meetings/{id}/cancel` | Cancel meeting |
| POST | `/api/meetings/{id}/reschedule` | Reschedule meeting |
| POST | `/api/event-types/{id}/questions` | Add questions |
| PUT | `/api/event-types/{id}/questions` | Update questions |
| GET | `/api/email-notifications` | Email logs |
