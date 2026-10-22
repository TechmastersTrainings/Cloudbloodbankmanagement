# Cloud Blood Bank Management System

A full-stack blood bank platform connecting **hospitals, donors and receivers** in one
network: live blood-stock availability, nearby hospital search, blood requests with
approval workflow, donation camps, and role-based dashboards.

## Repository layout

```
Cloudbloodbankmanagement/
├── backend/    Django + Django REST Framework API (MySQL)
└── frontend/   React + Vite single-page application
```

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Django 5.0, Django REST Framework 3.15, SimpleJWT, Celery + Redis |
| Database | MySQL 8 |
| Frontend | React 19, Vite 7, React Router 7, Axios |
| Auth | JWT (access + refresh), role-based access control |

## Roles

- **DONOR** — profile, eligibility, donation history, camps and registrations.
- **HOSPITAL** — blood stock, incoming requests (approve/reject), camps and camp requests.
- **RECEIVER** — search nearby hospitals by blood group and raise/track blood requests.
- **ADMIN** — verify hospitals/donors/receivers, manage camps, platform analytics.

## Backend setup

Requires Python 3.11+ and a running MySQL server.

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

# Create your local environment file and fill in real values
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

python manage.py migrate
python manage.py runserver 8000
```

The API is served at `http://127.0.0.1:8000/`.

### Environment variables

See `backend/.env.example`. Never commit the real `.env`; it is ignored by git.

| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DEBUG` | `True` / `False` |
| `ALLOWED_HOSTS` | Comma-separated hostnames |
| `DATABASE_NAME` / `DATABASE_USER` / `DATABASE_PASSWORD` | MySQL connection |
| `DATABASE_HOST` / `DATABASE_PORT` | MySQL host and port |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP account for notifications |

## Frontend setup

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000/` and Vite proxies `/api` requests to
`http://127.0.0.1:8000` (see `vite.config.js`). Start the backend first.

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Core API areas

- `POST /api/accounts/login/`, `POST /api/accounts/register/` — authentication
- `GET  /api/hospital/find-blood/?blood_group=O+` — public nearby hospital search
- `GET/POST /api/blood/request/` — receiver requests
- `GET  /api/blood/requests/hospital/` + `POST /api/blood/requests/{id}/action/` — hospital approval
- `GET/POST /api/blood/stock/` — hospital inventory
- `GET/POST /api/camps/` — donation camps
