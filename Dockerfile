# Multi-stage Dockerfile: Frontend Build + Python FastAPI Backend
# Compatible with Hugging Face Spaces (Port 7860), Render, Railway, and Local Docker

# Stage 1: Build Frontend (React + TypeScript + Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Static Server
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces runs as user 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

# Install Python requirements
COPY --chown=user:user backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --user -r backend/requirements.txt

# Copy backend code, models, and dataset
COPY --chown=user:user backend/ ./backend/

# Copy built frontend assets from stage 1 into frontend/dist
COPY --chown=user:user --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port (Hugging Face Spaces default is 7860)
EXPOSE 7860
ENV PORT=7860
ENV HOST=0.0.0.0

# Start command using uvicorn
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
