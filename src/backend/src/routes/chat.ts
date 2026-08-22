import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

// GET /api/chat - Get chat history filtered by agent thread
const getChatMessages: RequestHandler = async (req, res) => {
  try {
    const { agent_id } = req.query;
    const targetAgentId = (agent_id as string) || 'EMP-EXE-001';

    const query = `
      SELECT * FROM (
        SELECT * FROM chat_messages 
        WHERE (sender_id = 'OWNER' AND recipient_id = $1) 
           OR (sender_id = $1 AND (recipient_id = 'OWNER' OR recipient_id IS NULL))
           OR (recipient_id = $1)
        ORDER BY created_at DESC 
        LIMIT 100
      ) sub
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [targetAgentId]);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: `Database error: ${error.message}` });
  }
};

// POST /api/chat - Post a message and get response from targeted agent
const postChatMessage: RequestHandler = async (req, res) => {
  const { message, agent_id } = req.body;
  if (!message || message.trim() === '') {
    res.status(400).json({ success: false, message: 'Message is required' });
    return;
  }

  try {
    const targetAgentId = agent_id || 'EMP-EXE-001';
    const agentRes = await pool.query('SELECT * FROM employees WHERE id = $1', [targetAgentId]);
    const agent = agentRes.rows[0] || {
      id: 'EMP-EXE-001',
      name: 'Sovereign',
      title: 'Chief Executive Officer (CEO)'
    };

    // 1. Insert Owner's message
    const insertUserQuery = `
      INSERT INTO chat_messages (sender_id, sender_name, message, recipient_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    await pool.query(insertUserQuery, ['OWNER', 'Owner (You)', message, agent.id]);

    // 2. Fetch context
    const tasksRes = await pool.query('SELECT COUNT(*) FROM tasks');
    const taskCount = tasksRes.rows[0]?.count || 0;

    const ideasRes = await pool.query('SELECT COUNT(*) FROM ideas');
    const ideaCount = ideasRes.rows[0]?.count || 0;

    const agentsRes = await pool.query('SELECT COUNT(*) FROM employees');
    const agentCount = agentsRes.rows[0]?.count || 0;

    // 3. Call AI Model
    const openAiKey = process.env.OPENAI_API_KEY;
    const openAiBaseUrl = process.env.OPENAI_BASE_URL || 'http://localhost:20128/v1';
    const openAiModel = process.env.OPENAI_MODEL || 'ag/gemini-3.7-flash-high';

    let agentReply = `Halo Owner, saya ${agent.name} (${agent.title}). Sistem saya siap menerima arahan.`;

    if (openAiKey) {
      try {
        const systemPrompt = `You are ${agent.name}, the ${agent.title} of this AI Virtual Company.
You are in a direct 1-on-1 private conversation with the Owner/Human Boss of the company.
Always stay in character as the ${agent.title}.
Keep your answers brief, action-oriented, helpful, and executive.
Use friendly, clear Indonesian when communicating.
Company context:
- Total Workforce: ${agentCount} AI Agents
- Backlog Tasks: ${taskCount}
- Validated Ideas: ${ideaCount}`;

        const response = await fetch(`${openAiBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: openAiModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            stream: false
          })
        });

        if (response.ok) {
          const rawText = await response.text();
          try {
            // Attempt standard JSON parse
            const data = JSON.parse(rawText);
            agentReply = data.choices?.[0]?.message?.content || agentReply;
          } catch (jsonErr) {
            // If SSE stream format was returned
            let extractedContent = '';
            const lines = rawText.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const chunk = JSON.parse(trimmed.replace('data: ', ''));
                  const delta = chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content || '';
                  extractedContent += delta;
                } catch {}
              }
            }
            if (extractedContent.trim()) {
              agentReply = extractedContent;
            }
          }
        } else {
          console.error('LLM response error:', response.status, await response.text());
        }
      } catch (llmError) {
        console.error('Error calling LLM for agent chat response:', llmError);
      }
    }

    // 4. Insert Agent's reply
    const insertAgentQuery = `
      INSERT INTO chat_messages (sender_id, sender_name, message, recipient_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    await pool.query(insertAgentQuery, [agent.id, `${agent.name} (${agent.title})`, agentReply, 'OWNER']);

    // 5. Fetch updated thread messages (latest 100 messages)
    const queryThread = `
      SELECT * FROM (
        SELECT * FROM chat_messages 
        WHERE (sender_id = 'OWNER' AND recipient_id = $1) 
           OR (sender_id = $1 AND (recipient_id = 'OWNER' OR recipient_id IS NULL))
           OR (recipient_id = $1)
        ORDER BY created_at DESC 
        LIMIT 100
      ) sub
      ORDER BY created_at ASC
    `;
    const threadMessages = await pool.query(queryThread, [agent.id]);
    
    res.json({ success: true, data: threadMessages.rows });

  } catch (error: any) {
    console.error('Error posting chat message:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

router.get('/', getChatMessages);
router.post('/', postChatMessage);

export default router;
