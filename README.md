# Simple CRUD Fullstack App

A fullstack CRUD application built with Go (backend), Next.js (frontend), and PostgreSQL, fully Dockerized for easy development and deployment.

## Features

- User CRUD (Create, Read, Update, Delete)
- Clean architecture (DTOs, Entities, Mappers, Services)
- Birth date selection with calendar (year/month dropdown)
- Age calculation from birth date
- Robust API response structure
- Logging for debugging (backend & frontend)
- Null safety in frontend mapping
- Modern UI with Tailwind CSS & shadcn/ui
- Docker Compose for multi-service orchestration

## Prerequisites

- Docker & Docker Compose installed

## How to Run (Development)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd simple-crud
   ```

2. **Start all services:**
   ```bash
   docker compose up --build
   ```
   - This will start:
     - PostgreSQL database (port 5432)
     - Go backend API (port 8000)
     - Next.js frontend (port 3000)

3. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)

4. **Stop services:**
   ```bash
   docker compose down
   ```

## How to Run (Production)

1. **Build and start production containers:**
   ```bash
   docker compose -f docker-compose.prod.yml up --build
   ```

## Project Structure

```
backend/    # Go API server
frontend/   # Next.js frontend app
```

## Environment Variables

- Backend: `DATABASE_URL` (set automatically in Docker Compose)
- Frontend: `NEXT_PUBLIC_API_URL` (set automatically in Docker Compose)

## Notes

- All code changes in `backend/` and `frontend/` are reflected in containers via bind mounts (development only).
- For production, containers use optimized Dockerfiles and do not mount local code.

