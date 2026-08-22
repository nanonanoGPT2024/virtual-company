import { Router } from 'express';
import { pool } from '../config/db';
import { callAgentLLM } from '../services/llmService';

const router = Router();

// GET messages (War Room or Direct)
router.get('/', async (req, res) => {
  try {
    const { room_type = 'WAR_ROOM', project_id, agent_id } = req.query;

    let query = `
      SELECT m.*, e.name as sender_name, e.role as sender_role, e.avatar_url as sender_avatar
      FROM chat_messages m
      LEFT JOIN employees e ON m.sender_id = e.id
    `;
    const params: any[] = [];

    if (room_type === 'DIRECT' && agent_id) {
      query += ` WHERE (m.room_type = 'DIRECT' AND ((m.sender_id = $1 AND m.recipient_id = 'EMP-OWNER') OR (m.sender_id = 'EMP-OWNER' AND m.recipient_id = $1)))`;
      params.push(agent_id);
    } else if (project_id) {
      query += ` WHERE m.project_id = $1`;
      params.push(project_id);
    } else {
      query += ` WHERE m.room_type = 'WAR_ROOM'`;
    }

    query += ` ORDER BY m.created_at ASC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Send message & get auto-reply from agent if targeted
router.post('/', async (req, res) => {
  try {
    const { room_type = 'WAR_ROOM', project_id, sender_id = 'EMP-OWNER', recipient_id, message } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Save human message
    const savedMsg = await pool.query(
      `INSERT INTO chat_messages (room_type, project_id, sender_type, sender_id, recipient_id, message)
       VALUES ($1, $2, 'HUMAN', $3, $4, $5)
       RETURNING *`,
      [room_type, project_id || null, sender_id, recipient_id || null, message]
    );

    // If Direct message to an agent or War Room message, generate agent reply
    let agentReply = null;
    const targetAgentId = recipient_id || 'EMP-CEO';

    const empRes = await pool.query('SELECT * FROM employees WHERE id = $1', [targetAgentId]);
    if (empRes.rows.length > 0) {
      const agent = empRes.rows[0];
      const replyPrompt = `Pesan dari Owner: "${message}". Berikan tanggapan yang profesional, solutif, dan ramah sesuai dengan peranmu sebagai ${agent.title}.`;
      
      const llmRes = await callAgentLLM(agent.id, agent.system_prompt || `Kamu adalah ${agent.title}`, replyPrompt, project_id);
      
      const savedReply = await pool.query(
        `INSERT INTO chat_messages (room_type, project_id, sender_type, sender_id, recipient_id, message)
         VALUES ($1, $2, 'AGENT', $3, $4, $5)
         RETURNING *`,
        [room_type, project_id || null, agent.id, sender_id, llmRes.content]
      );
      agentReply = savedReply.rows[0];
    }

    res.status(201).json({
      user_message: savedMsg.rows[0],
      agent_reply: agentReply
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
