import { Router } from 'express';
import { pool } from '../config/db';
import { callAgentLLM } from '../services/llmService';
import { authenticateUser } from './auth';

const router = Router();

// GET messages (War Room or Direct, strictly isolated per user_id)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
    }

    const { room_type = 'WAR_ROOM', project_id, agent_id, user_id } = req.query;

    let targetUserId = user.id;
    if (user.role === 'OWNER' && user_id) {
      targetUserId = String(user_id);
    }

    let query = `
      SELECT m.*, 
             COALESCE(u.name, e.name) as sender_name, 
             COALESCE(u.role, e.role) as sender_role, 
             e.avatar_url as sender_avatar
      FROM chat_messages m
      LEFT JOIN employees e ON m.sender_id = e.id
      LEFT JOIN users u ON m.sender_id = u.id
    `;
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Isolate by user_id
    whereConditions.push(`m.user_id = $${params.length + 1}`);
    params.push(targetUserId);

    if (room_type === 'DIRECT' && agent_id) {
      whereConditions.push(`m.room_type = 'DIRECT' AND ((m.sender_id = $${params.length + 1} AND m.recipient_id = $${params.length + 2}) OR (m.sender_id = $${params.length + 2} AND m.recipient_id = $${params.length + 1}))`);
      params.push(agent_id, user.id);
    } else if (project_id) {
      whereConditions.push(`m.project_id = $${params.length + 1}`);
      params.push(project_id);
    } else {
      whereConditions.push(`m.room_type = 'WAR_ROOM'`);
    }

    query += ` WHERE ` + whereConditions.join(' AND ');
    query += ` ORDER BY m.created_at ASC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Send message & get customized auto-reply from agent matching sender identity
router.post('/', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
    }

    const { room_type = 'WAR_ROOM', project_id, recipient_id, message } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const senderId = user.id;
    const senderName = user.name;
    const senderTitle = user.role === 'OWNER' ? 'Owner (Nano)' : `Klien (${user.name})`;

    // Save human message with user_id
    const savedMsg = await pool.query(
      `INSERT INTO chat_messages (user_id, room_type, project_id, sender_type, sender_id, recipient_id, message)
       VALUES ($1, $2, $3, 'HUMAN', $4, $5, $6)
       RETURNING *`,
      [user.id, room_type, project_id || null, senderId, recipient_id || null, message]
    );

    // If Direct message to an agent or War Room message, generate agent reply
    let agentReply = null;
    const targetAgentId = recipient_id || 'EMP-CEO';

    const empRes = await pool.query('SELECT * FROM employees WHERE id = $1', [targetAgentId]);
    if (empRes.rows.length > 0) {
      const agent = empRes.rows[0];
      const replyPrompt = `Pesan dari ${senderTitle}: "${message}". Berikan tanggapan yang profesional, solutif, dan ramah sesuai dengan peranmu sebagai ${agent.title}. Sapa dan panggil pengirim secara tepat (${user.role === 'OWNER' ? 'Owner / Bang Nano' : 'Bapak/Ibu ' + user.name}).`;
      
      const llmRes = await callAgentLLM(agent.id, agent.system_prompt || `Kamu adalah ${agent.title}`, replyPrompt, project_id);
      
      const savedReply = await pool.query(
        `INSERT INTO chat_messages (user_id, room_type, project_id, sender_type, sender_id, recipient_id, message)
         VALUES ($1, $2, $3, 'AGENT', $4, $5, $6)
         RETURNING *`,
        [user.id, room_type, project_id || null, agent.id, senderId, llmRes.content]
      );
      agentReply = savedReply.rows[0];
    }

    res.status(201).json({
      user_message: {
        ...savedMsg.rows[0],
        sender_name: senderName
      },
      agent_reply: agentReply
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
