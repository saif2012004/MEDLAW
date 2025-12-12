FROM python:3.10-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pipeline/requirements.txt /app/pipeline/requirements.txt
COPY pipeline/rag-orchestrator/requirements.txt /app/pipeline/rag-orchestrator/requirements.txt
RUN pip install --no-cache-dir -r /app/pipeline/requirements.txt && \
    pip install --no-cache-dir -r /app/pipeline/rag-orchestrator/requirements.txt

COPY . /app

WORKDIR /app/pipeline/rag-orchestrator

EXPOSE 8000
CMD ["python", "api.py"]

