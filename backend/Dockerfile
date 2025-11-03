# Backend Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# NOTE: If you encounter a pip error like:
#   THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE
# during a Docker build, it's usually due to a stale Docker build cache
# or an unexpected requirements file in the build context. To resolve:
#   1) Rebuild without cache:
#        docker compose build --no-cache backend
#   2) Or clear builder cache:
#        docker builder prune --all --force
# This comment is intentionally informational to help future debugging.
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
