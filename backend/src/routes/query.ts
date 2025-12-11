import { Router, Request, Response } from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { llmService } from '../services/llm.service';

const router = Router();

// Python RAG service URL (use 127.0.0.1 to avoid IPv6 issues on Windows)
const RAG_API_URL = process.env.PYTHON_RAG_URL || 'http://127.0.0.1:8000';

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
  limits: { fileSize: 50 * 1024 * 1024 },
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

interface QueryResponse {
  classification: {
    flow: string;
    intendedPage: string;
    entities: Record<string, any>;
    confidence: number;
  };
  result?: {
    narrative: string;
    checklist: string[];
    citations: Record<string, string>;
    _metadata?: Record<string, any>;
  };
  uploaded_files?: Array<{
    doc_id: string;
    filename: string;
    chunks: number;
  }>;
  redirect?: string;
  error?: string;
}

/**
 * POST /api/query
 * Main entry point for all queries from the frontend
 * 
 * This endpoint:
 * 1. Classifies the query to determine routing
 * 2. Processes any uploaded files
 * 3. Runs the RAG pipeline
 * 4. Returns results with routing info
 */
router.post('/', upload.array('files', 10), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  
  try {
    // Get query from form data or JSON body
    const query = req.body.query;
    const template_type = req.body.template_type || 'qa';
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    console.log(`Processing query: "${query.substring(0, 50)}..."`);

    // Step 1: Classify the query
    const classification = await llmService.classify(query);
    console.log(`Classification: flow=${classification.flow}, page=${classification.intendedPage}`);

    const response: QueryResponse = {
      classification
    };

    // Step 2: Check if we should redirect instead of running RAG
    if (classification.intendedPage === 'templates' && classification.confidence >= 0.7) {
      response.redirect = `/dashboard/templates?search=${encodeURIComponent(classification.entities.templateType || query)}`;
      
      // Clean up any uploaded files
      if (files) {
        for (const file of files) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
      
      return res.json(response);
    }

    if (classification.intendedPage === 'alerts' && classification.confidence >= 0.7) {
      response.redirect = `/dashboard/alerts?search=${encodeURIComponent(query)}`;
      
      // Clean up any uploaded files
      if (files) {
        for (const file of files) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
      
      return res.json(response);
    }

    // Step 3: Run RAG pipeline
    try {
      let ragResponse;
      
      if (files && files.length > 0) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('query', query);
        formData.append('template_type', template_type);
        
        for (const file of files) {
          formData.append('files', fs.createReadStream(file.path), file.originalname);
        }
        
        ragResponse = await axios.post(
          `${RAG_API_URL}/rag/full`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 180000
          }
        );
      } else {
        // Use JSON for text-only queries
        ragResponse = await axios.post(
          `${RAG_API_URL}/rag/query`,
          { query, template_type },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
          }
        );
      }

      // Handle both response formats
      response.result = ragResponse.data.result || ragResponse.data;
      response.uploaded_files = ragResponse.data.uploaded_files;

    } catch (ragError: any) {
      console.error('RAG API error:', ragError.message);
      
      // If RAG fails, try to provide a basic response
      response.error = 'RAG service unavailable, providing basic response';
      response.result = {
        narrative: `I understand you're asking about: "${query}". However, the document analysis service is currently unavailable. Please try again later or contact support if the issue persists.`,
        checklist: ['Try again in a few minutes', 'Check if documents are properly uploaded'],
        citations: {}
      };
    }

    // Clean up uploaded files
    if (files) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json(response);

  } catch (err: any) {
    console.error('Query processing error:', err);
    
    // Clean up files on error
    if (files) {
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to process query',
      details: err.message
    });
  }
});

/**
 * POST /api/query/classify
 * Classify a query without running RAG (for preview/routing)
 */
router.post('/classify', async (req: Request, res: Response) => {
  try {
    const { query } = req.body || {};
    
    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const classification = await llmService.classify(query);
    res.json(classification);

  } catch (err: any) {
    console.error('Classification error:', err);
    res.status(500).json({ error: 'Failed to classify query' });
  }
});

export default router;

