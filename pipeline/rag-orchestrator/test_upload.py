#!/usr/bin/env python
"""Test file upload to RAG API."""
import requests

# Create test file
with open('test_doc.txt', 'w') as f:
    f.write('X-ray machine installation and safety guide. This document covers setup procedures.')

print("Testing file upload to RAG API...")

try:
    with open('test_doc.txt', 'rb') as f:
        response = requests.post(
            'http://127.0.0.1:8000/rag/full',
            files={'files': ('test_doc.txt', f, 'text/plain')},
            data={'query': 'What is this document about?', 'template_type': 'qa'},
            timeout=120
        )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500] if len(response.text) > 500 else response.text}")
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

