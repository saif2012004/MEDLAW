FROM python:3.10-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pipeline/requirements.txt /app/pipeline/requirements.txt
RUN pip install --no-cache-dir -r /app/pipeline/requirements.txt

COPY . /app

WORKDIR /app/pipeline/embed-and-vec-search

EXPOSE 5001
CMD ["python", "vector_search_api.py"]

