# CMS Project & Public Catalog API

A production-ready Content Management System (CMS) for educational content, featuring a robust Public API, Role-Based Access Control (RBAC), and automated scheduled publishing.

> **Requirements Compliance**: This project fulfills all functional and operational requirements outlined in the `chaishot.txt` assignment.

## 🏗️ Architecture

The system follows a 3-tier architecture with a specialized background worker for reliable job scheduling.

```mermaid
graph TD
    User((User))
    Admin((Admin/Editor))

    subgraph "Frontend Layer"
        WebClient[React Web App (Admin UI)]
    end

    subgraph "Backend Layer"
        API[Express API Server]
        Worker[Background Worker (Cron)]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
    end

    User -->|Views Public Catalog| API
    Admin -->|Manages Content| WebClient
    WebClient -->|Authenticated Requests| API
    API -->|Reads/Writes| DB
    Worker -->|Polls/Updates (Per Minute)| DB
```

### Components
*   **Web (`/client`)**: React + Vite + TailwindCSS. Provides a responsive Admin interface.
*   **API (`/server`)**: Node.js + Express + TypeScript. Handles business logic, validation, and Public Catalog endpoints.
*   **Worker (`/server`)**: Dedicated Node.js service running `node-cron`. Ensures idempotent, concurrency-safe publishing of scheduled content.
*   **Database**: PostgreSQL. Enforces strict data integrity via Foreign Keys, Unique Constraints, and ENUMs.

---

## 🚀 Quick Start (Automated)

The project uses Docker Compose for a zero-config startup. The database schema and partial seed data are applied **automatically** when the containers start.

### 1. Start the Application
```bash
docker compose up --build
```
*Wait for ~30 seconds. The system will:*
1.  Initialize the Database.
2.  Push the Schema.
3.  **Seed Data** (Users, Programs, Lessons).
4.  Start the API, Worker, and Web services.

### 2. Access the Application
*   **Admin CMS**: [http://localhost:5173](http://localhost:5173)
*   **Public API**: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Credentials & Seed Data

The auto-seeder creates the following accounts and data hierarchy:

### Accounts
| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` | Full Access (Users, Delete Programs) |
| **Editor** | `editor@example.com` | `password123` | Content Management (Create, Edit, Publish) |
| **Viewer** | *(Public Access)* | N/A | Read-Only (Published Content Only) |

### Demo Content
*   **Computer Science Fundamentals** (English + Hindi)
    *   *Includes a Scheduled Lesson for the Demo Flow*
*   **Applied AI & Machine Learning** (English + Hindi)
*   **Modern Web Development** (English)

---

## 🧪 Demo Flow Verification

Follow this exact flow to verify the **Scheduled Publishing** requirement:

1.  **Launch**: Run `docker compose up --build`. This starts a **2-minute timer** on a specific seeded lesson.
2.  **Login**: Go to [http://localhost:5173](http://localhost:5173) and login as **Editor**.
3.  **Navigate**: Open **Computer Science Fundamentals** > **Term 2**.
4.  **Observe**: You will see a lesson named **"Self-Balancing Trees"** with status **SCHEDULED**.
5.  **Wait**: Wait until the container has been running for 2 minutes.
6.  **Verify**: Refresh the page. The status will automatically flip to **PUBLISHED**.
    *   *Behind the scenes, the `cms_worker` container detected the time, acquired a lock, and updated the record transactionally.*

---

## ✅ Requirements Checklist (`chaishot.txt`)

### Core Deliverables
- [x] **Deployed URL**: (Localhost provided via Docker)
- [x] **Worker/Cron**: Implemented in `worker.ts`, runs every minute to publish scheduled lessons.
- [x] **Docker Compose**: `docker compose up --build` brings up `web`, `api`, `worker`, `db`.
- [x] **Seed Script**: `npm run seed` creates Programs, Terms, Lessons (Multi-lang), and Assets.

### Database Constraints (Strict)
- [x] **Unique Constraints**: `(program_id, term_number)`, `(term_id, lesson_number)`, `topic.name`.
- [x] **Logic Constraints**: `publish_at` required for Scheduled; `published_at` required for Published.
- [x] **Asset Integrity**: Normalized `program_assets` and `lesson_assets` tables with composite unique keys.

### Media Assets
- [x] **Variants**: Supports Portrait (`PORTRAIT`) and Landscape (`LANDSCAPE`).
- [x] **Validation**: Backend blocks publishing if required assets (Portrait+Landscape for primary language) are missing.
- [x] **Seed Data**: Includes real Unsplash URLs for all seeded content.

### Public Catalog API
- [x] **Filtering**: Filter by `language`, `topic`.
- [x] **Visibility**: Returns **only** items with `status: 'PUBLISHED'`.
- [x] **Structure**: Returns deeply nested objects including Terms, Lessons, and categorized Assets.

### publishing Workflow
- [x] **State Transitions**: Draft -> Scheduled -> Published -> Archived.
- [x] **Program Auto-Publish**: Programs become Published automatically when their first Lesson is published.
- [x] **Concurrency Safety**: Worker uses `FOR UPDATE SKIP LOCKED` (or equivalent transactional logic) to prevent race conditions.
