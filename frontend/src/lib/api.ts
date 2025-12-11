/**
 * API Client for MedLaw Backend
 * Handles all communication with the backend services
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface QueryClassification {
  flow: string;
  intendedPage: string;
  entities: Record<string, any>;
  confidence: number;
}

export interface RAGResult {
  narrative: string;
  checklist: string[];
  citations: Record<string, string>;
  _metadata?: Record<string, any>;
}

export interface UploadedFile {
  doc_id: string;
  filename: string;
  chunks: number;
}

export interface QueryResponse {
  classification: QueryClassification;
  result?: RAGResult;
  uploaded_files?: UploadedFile[];
  redirect?: string;
  error?: string;
}

export interface UploadResponse {
  files: UploadedFile[];
  reindexed: number;
}

/**
 * Send a query to the RAG system
 * Optionally includes files for context
 */
export async function sendQuery(
  query: string,
  files?: File[],
  templateType: string = 'qa'
): Promise<QueryResponse> {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('template_type', templateType);
  
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file);
    });
  }

  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Upload files for processing (without a query)
 */
export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/rag/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Classify a query to determine routing
 * Returns classification without running full RAG
 */
export async function classifyQuery(query: string): Promise<QueryClassification> {
  const response = await fetch(`${API_BASE_URL}/api/llm/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Run a RAG query without file upload
 */
export async function runRAGQuery(
  query: string,
  docIds?: string[],
  templateType: string = 'qa'
): Promise<RAGResult> {
  const response = await fetch(`${API_BASE_URL}/api/rag/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      doc_ids: docIds,
      template_type: templateType,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Check health of backend services
 */
export async function checkHealth(): Promise<{
  backend: boolean;
  rag: boolean;
  vector: boolean;
}> {
  try {
    const [backendHealth, ragHealth] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/health`).then(r => r.ok),
      fetch(`${API_BASE_URL}/api/rag/health`).then(r => r.json()),
    ]);

    return {
      backend: backendHealth.status === 'fulfilled' && backendHealth.value,
      rag: ragHealth.status === 'fulfilled' && ragHealth.value?.rag_api?.status === 'healthy',
      vector: ragHealth.status === 'fulfilled' && ragHealth.value?.vector_api?.status === 'healthy',
    };
  } catch {
    return { backend: false, rag: false, vector: false };
  }
}

/**
 * Generate LLM response (direct, without RAG)
 */
export async function generateLLMResponse(
  prompt: string,
  temperature: number = 0.1,
  maxTokens: number = 500
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/llm/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}



