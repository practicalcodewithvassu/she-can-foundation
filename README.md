# She Can Foundation — MERN Contact Form

This project contains a minimal MERN stack contact form for the She Can Foundation internship task.

Structure:
- backend: Express + Mongoose API
- frontend: React (Vite)

Quick start

1. Backend

```bash
cd backend
npm install
# copy .env.example to .env and set MONGO_URI if you want DB persistence
npm run dev
```

The backend runs on port 5000 by default and exposes `POST /api/form`.

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the dev server (Vite) URL shown in terminal. By default the frontend submits to `http://localhost:5000/api/form`.

If the backend starts on a different port, set the frontend env variable before running Vite:

```powershell
cd frontend
$env:VITE_API_URL='http://localhost:5002'
npm run dev
```

Advanced features
- New form fields: `subject` and `phone`.
- Backend validation for email and phone input.
- Health check endpoint: `GET /api/health`.
- Admin login API at `POST /api/admin/login`.
- Admin submissions endpoint at `GET /api/admin/submissions` with `Authorization: Bearer <token>`.
- Email notification support on submission when SMTP variables are configured.
- Frontend admin dashboard support with `VITE_SHOW_ADMIN=true`.

Environment setup
1. Copy `backend/.env.example` to `backend/.env` and update:
   - `ADMIN_USER`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - optional SMTP settings for email notifications
2. Copy `frontend/.env.example` to `frontend/.env` and update as needed.

Notes
- If `MONGO_URI` is not set the backend will accept submissions but won't persist them.
- To deploy, configure environment variables and build the frontend with `npm run build` in `frontend`.
- If port `5000` is in use, either free it or set `PORT` in `backend/.env`.
