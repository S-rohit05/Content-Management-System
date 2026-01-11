# CMS Project

A production-ready CMS and Public Catalog API for managing educational content.

## Architecture

- **Frontend (`web`)**: React (Vite) + TailwindCSS. Admin interface for creating/managing content.
- **Backend (`api`)**: Node.js (Express) + TypeScript. Handles business logic, auth, and CRUD.
- **Worker (`worker`)**: Node.js Cron service. Handles scheduled publishing of lessons and programs.
- **Database (`db`)**: PostgreSQL. Relational data model with strict constraints.

```mermaid
graph TD
    Client[Client Browser] <-->|HTTP| Web[Frontend (Vite)]
    Client <-->|HTTP| API[Backend API (Express)]
    Web -->|API Calls| API
    API <-->|SQL| DB[(PostgreSQL)]
    Worker[Worker Service] <-->|SQL| DB
    Worker -->|Check Schedulers| API
```

## Prerequisites

- Docker & Docker Compose
- Node.js (for local script execution if needed)

## Local Setup

1. **Clone & Start**:
   ```bash
   docker compose up --build
   ```
   This starts:
   This starts:
   - **Web (Admin)**: http://localhost:5173
   - **API (Public)**: http://localhost:3000
   - **DB**: localhost:5432

2. **Database Setup (Automatic)**:
   The repository includes migrations. However, if running fresh, you might need to run:
   ```bash
   docker compose exec api npx prisma migrate dev --name init
   docker compose exec api npm run seed
   ```

## Authentication (Seed Data)

- **Admin**: `admin@example.com` / `password123`
- **Editor**: `editor@example.com` / `password123`

## Demo Flow

1. **Login**: Go to http://localhost:5173/login and login as `editor@example.com`.
2. **Explore**: See the "Full Stack Web Development" program (Seeded).
3. **Create Content**:
   - Go to Program Detail.
   - Click "+ Add Term" -> "+ Add Lesson".
   - Click "Edit" on the new lesson.
4. **Schedule Publishing**:
   - In Lesson Editor, set Content Type/Title.
   - Set Status to `SCHEDULED`.
   - Set "Publish At" to 1 minute from now (UTC).
   - Save.
5. **Verify**:
   - Wait 1 minute.
   - Check the running `worker` logs: `docker compose logs -f worker`.
   - Refresh the CMS page. Status should change to `PUBLISHED`.
6. **Public Catalog**:
   - Access `http://localhost:3000/api/catalog/programs` to see published content.

## Public API Endpoints

- `GET /api/catalog/programs`: List published programs.
- `GET /api/catalog/programs/:id`: Program details.
- `GET /api/catalog/lessons/:id`: Lesson details.

## Deployment

The project is Dockerized and ready for platforms like Railway/Render. Set `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV=production`.
