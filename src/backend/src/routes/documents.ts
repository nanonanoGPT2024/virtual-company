import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

// 1. Get all documents
const getDocuments: RequestHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY updated_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// 2. Get document by ID
const getDocumentById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// 3. Create document
const createDocument: RequestHandler = async (req, res) => {
  const { project_id, type, title, content } = req.body;
  if (!type || !title || content === undefined) {
    res.status(400).json({ success: false, message: 'Type, title, and content are required' });
    return;
  }

  try {
    const query = `
      INSERT INTO documents (project_id, type, title, content, version)
      VALUES ($1, $2, $3, $4, 1)
      RETURNING *
    `;
    const values = [project_id || null, type, title, content];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// 4. Update document (with version increment)
const updateDocument: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { project_id, type, title, content } = req.body;

  try {
    // Check if document exists first to get current version
    const selectResult = await pool.query('SELECT version FROM documents WHERE id = $1', [id]);
    if (selectResult.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const currentVersion = selectResult.rows[0].version || 1;
    const newVersion = currentVersion + 1;

    // We can conditionally update fields
    // Build update dynamic query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (project_id !== undefined) {
      updates.push(`project_id = $${paramIndex++}`);
      values.push(project_id);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(type);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }

    // Always increment version and update timestamp
    updates.push(`version = $${paramIndex++}`);
    values.push(newVersion);
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const idParamIndex = paramIndex;

    const query = `
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = $${idParamIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// 5. Delete document
const deleteDocument: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }
    res.json({ success: true, message: 'Document deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/', createDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
