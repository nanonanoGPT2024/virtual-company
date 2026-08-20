import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';
import { getDummyEmbedding, formatVectorForPg } from '../utils/embeddings.js';

const router = Router();

// Helper to determine if pgvector extension is available and embedding column works
let isVectorSupported: boolean | null = null;
async function checkVectorSupport(): Promise<boolean> {
  if (isVectorSupported !== null) return isVectorSupported;
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as has_vector
    `);
    isVectorSupported = result.rows[0]?.has_vector || false;
    return isVectorSupported as boolean;
  } catch (error) {
    console.warn('Vector support check failed, falling back to false:', error);
    isVectorSupported = false;
    return false;
  }
}

// 1. Semantic search / query organization memory
const searchBrain: RequestHandler = async (req, res) => {
  const { query, limit, tags } = req.query;
  const searchLimit = parseInt(limit as string || '5', 10);
  const searchTags = tags ? (tags as string).split(',') : null;

  if (!query) {
    res.status(400).json({ success: false, message: 'Query parameter is required' });
    return;
  }

  try {
    const hasVector = await checkVectorSupport();
    const queryVector = getDummyEmbedding(query as string);

    let dbQuery = '';
    let values: any[] = [];

    if (hasVector) {
      // Use pgvector cosine distance operator <=> or inner product
      // We will select cosine similarity (1 - (embedding <=> $1))
      if (searchTags && searchTags.length > 0) {
        dbQuery = `
          SELECT id, company_id, reference_id, content, meta_tags, created_at,
                 (1 - (embedding <=> $1::vector)) as similarity
          FROM company_brain
          WHERE meta_tags && $2
          ORDER BY embedding <=> $1::vector ASC
          LIMIT $3
        `;
        values = [formatVectorForPg(queryVector), searchTags, searchLimit];
      } else {
        dbQuery = `
          SELECT id, company_id, reference_id, content, meta_tags, created_at,
                 (1 - (embedding <=> $1::vector)) as similarity
          FROM company_brain
          ORDER BY embedding <=> $1::vector ASC
          LIMIT $2
        `;
        values = [formatVectorForPg(queryVector), searchLimit];
      }
    } else {
      // Fallback: Perform a simple substring/regex search on content
      console.warn('pgvector extension not active or supported. Falling back to keyword search.');
      if (searchTags && searchTags.length > 0) {
        dbQuery = `
          SELECT id, company_id, reference_id, content, meta_tags, created_at,
                 1.0 as similarity
          FROM company_brain
          WHERE content ILIKE $1 AND meta_tags && $2
          ORDER BY created_at DESC
          LIMIT $3
        `;
        values = [`%${query}%`, searchTags, searchLimit];
      } else {
        dbQuery = `
          SELECT id, company_id, reference_id, content, meta_tags, created_at,
                 1.0 as similarity
          FROM company_brain
          WHERE content ILIKE $1
          ORDER BY created_at DESC
          LIMIT $2
        `;
        values = [`%${query}%`, searchLimit];
      }
    }

    const result = await pool.query(dbQuery, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error querying company brain:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// 2. Add content to organization memory (automatically generates embedding)
const addToBrain: RequestHandler = async (req, res) => {
  const { company_id, reference_id, content, meta_tags } = req.body;

  if (!content) {
    res.status(400).json({ success: false, message: 'Content is required' });
    return;
  }

  try {
    const hasVector = await checkVectorSupport();
    const queryVector = getDummyEmbedding(content);

    let query = '';
    let values: any[] = [];

    if (hasVector) {
      query = `
        INSERT INTO company_brain (company_id, reference_id, content, embedding, meta_tags)
        VALUES ($1, $2, $3, $4::vector, $5)
        RETURNING id, company_id, reference_id, content, meta_tags, created_at
      `;
      values = [
        company_id || null,
        reference_id || null,
        content,
        formatVectorForPg(queryVector),
        meta_tags || null
      ];
    } else {
      query = `
        INSERT INTO company_brain (company_id, reference_id, content, meta_tags)
        VALUES ($1, $2, $3, $4)
        RETURNING id, company_id, reference_id, content, meta_tags, created_at
      `;
      values = [
        company_id || null,
        reference_id || null,
        content,
        meta_tags || null
      ];
    }

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding to brain:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// 3. Delete memory item
const deleteFromBrain: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM company_brain WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Memory not found' });
      return;
    }
    res.json({ success: true, message: 'Memory deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting from brain:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

router.get('/search', searchBrain);
router.post('/', addToBrain);
router.delete('/:id', deleteFromBrain);

export default router;
