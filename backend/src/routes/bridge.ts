import { Router, Request, Response } from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const router = Router();

// Python RAG service URLs (use 127.0.0.1 to avoid IPv6 issues on Windows)
const RAG_API_URL = process.env.PYTHON_RAG_URL || 'http://127.0.0.1:8000';
const VECTOR_API_URL = process.env.VECTOR_SEARCH_URL || 'http://127.0.0.1:5001';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  }
});

/**
 * POST /api/rag/upload
 * Upload files for processing through the ingestion pipeline
 */
router.post('/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Forward files to Python RAG API
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', fs.createReadStream(file.path), file.originalname);
    }

    const response = await axios.post(
      `${RAG_API_URL}/rag/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 120000 // 2 minute timeout for large files
      }
    );

    // Clean up uploaded files
    for (const file of files) {
      fs.unlinkSync(file.path);
    }

    res.json(response.data);

  } catch (err: any) {
    console.error('RAG upload error:', err.message);
    
    // Clean up files on error
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    
    res.status(502).json({ 
      error: 'Failed to process files',
      details: err.response?.data?.error || err.message
    });
  }
});

/**
 * POST /api/rag/query
 * Run a RAG query against the vector store
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, doc_ids, template_type = 'qa' } = req.body || {};
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const response = await axios.post(
      `${RAG_API_URL}/rag/query`,
      { query, doc_ids, template_type },
      { timeout: 60000 }
    );

    res.json(response.data);

  } catch (err: any) {
    console.error('RAG query error:', err.message);
    res.status(502).json({ 
      error: 'Failed to run RAG query',
      details: err.response?.data?.error || err.message
    });
  }
});

/**
 * POST /api/rag/full
 * Full pipeline: upload files (optional) + run query (optional)
 * - If only files: processes files and returns
 * - If only query: runs RAG on existing docs
 * - If both: processes files then runs RAG query
 */
router.post('/full', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const query = req.body.query;
    const template_type = req.body.template_type || 'qa';
    
    // At least one of query or files must be provided
    if (!query && (!files || files.length === 0)) {
      return res.status(400).json({ error: 'Either query or files must be provided' });
    }

    // Build form data for the Python API
    const formData = new FormData();
    if (query) {
      formData.append('query', query);
    }
    formData.append('template_type', template_type);
    
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('files', fs.createReadStream(file.path), file.originalname);
      }
    }

    const response = await axios.post(
      `${RAG_API_URL}/rag/full`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 180000 // 3 minute timeout
      }
    );

    // Clean up uploaded files
    if (files) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json(response.data);

  } catch (err: any) {
    console.error('RAG full pipeline error:', err.message);
    
    // Clean up files on error
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    
    res.status(502).json({ 
      error: 'Failed to run full RAG pipeline',
      details: err.response?.data?.error || err.message
    });
  }
});

/**
 * POST /api/rag/analyze (legacy endpoint - forwards to query)
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { query, docIds, k = 5 } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });

    const response = await axios.post(
      `${VECTOR_API_URL}/vector/search`,
      { query, k, filters: docIds?.length ? { doc_id: docIds[0] } : undefined },
      { timeout: 15000 }
    );

    res.json({
      query,
      results: response.data?.results || [],
      count: response.data?.count || 0,
    });
  } catch (err: any) {
    console.error('RAG analyze error', err.message);
    res.status(502).json({ error: 'Failed to call Python RAG service' });
  }
});

/**
 * GET /api/rag/health
 * Check health of Python RAG services
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const [ragHealth, vectorHealth] = await Promise.allSettled([
      axios.get(`${RAG_API_URL}/health`, { timeout: 5000 }),
      axios.get(`${VECTOR_API_URL}/health`, { timeout: 5000 })
    ]);

    res.json({
      rag_api: ragHealth.status === 'fulfilled' ? ragHealth.value.data : { status: 'unavailable' },
      vector_api: vectorHealth.status === 'fulfilled' ? vectorHealth.value.data : { status: 'unavailable' }
    });
  } catch (err: any) {
    res.status(502).json({ error: 'Failed to check RAG service health' });
  }
});

export default router;
