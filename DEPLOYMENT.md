# Production Deployment Guide

This document outlines step-by-step instructions for containerizing the **Autonomous AI Report Agent** platform and deploying it to cloud hosting environments (Vercel, Render, and Docker Compose clusters).

---

## 🐳 Docker Containerization

We orchestrate the complete full-stack SaaS platform using Docker. Below is the multi-container configuration:

### 1. Backend Dockerfile (`/backend/Dockerfile`)
Create this file under `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Frontend Dockerfile (`/frontend/Dockerfile`)
Create this file under `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
```

### 3. Orchestrated Compose Stack (`/docker-compose.yml`)
Create this file in the root directory `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: agent_postgres
    environment:
      POSTGRES_DB: report_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret_password_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: agent_redis
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    container_name: agent_backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://admin:secret_password_db@postgres:5432/report_db
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/static:/app/static

  frontend:
    build: ./frontend
    container_name: agent_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
    depends_on:
      - backend

volumes:
  pgdata:
```

To run the complete stack locally using Docker:
```bash
docker-compose up --build -d
```

---

## 🚀 Cloud Provider Setup

### 1. Backend Deployments on Render.com
1. Create a **Web Service** on Render connected to your backend repository.
2. Select Environment: `Python`.
3. Set the build command: `pip install -r requirements.txt`.
4. Set the start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add Environment Variables under settings:
   - `DATABASE_URL`: Set up a Render PostgreSQL database and copy the connection string.
   - `OPENAI_API_KEY`: Set your credentials.
   - `SECRET_KEY`: Set a secure hashing password.

### 2. Frontend Deployments on Vercel
1. Create a new project on Vercel connected to your Next.js application subfolder (`/frontend`).
2. Vercel will auto-detect **Next.js** framework configurations.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Set to your live Render backend base endpoint (e.g. `https://your-backend.onrender.com/api/v1`).
4. Click **Deploy**. Vercel will optimize bundle files and expose public CDN routes.

---

## 🛠️ CI/CD GitHub Actions Pipeline

Create `.github/workflows/deploy.yml` to run automated syntax checks on push:
```yaml
name: Deploy Fullstack App

on:
  push:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    - name: Lint check
      run: |
        cd backend
        python -m compileall app/

  build-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    - name: Build bundle
      run: |
        cd frontend
        npm run build
```
This ensures code changes are compiled and verified automatically before push merges.
