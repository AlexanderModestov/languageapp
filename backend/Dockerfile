FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including Node.js (for yt-dlp) and FFmpeg
RUN apt-get update && apt-get install -y \
    gcc \
    ffmpeg \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway provides PORT env variable
ENV PORT=8000
EXPOSE $PORT

# Start command (using shell form to expand $PORT)
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
