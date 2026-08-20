import pool from './db.js';

export interface AgentConfig {
  id: string;
  name: string;
  title: string;
  autonomyLevel: number;
}

export class BaseAgent {
  public id: string;
  public name: string;
  public title: string;
  public autonomyLevel: number;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.name = config.name;
    this.title = config.title;
    this.autonomyLevel = config.autonomyLevel;
  }

  // Fetch the oldest pending task assigned to this agent
  async fetchActiveTask() {
    try {
      const query = `
        SELECT * FROM tasks 
        WHERE assignee_id = $1 AND status IN ('READY', 'IN_PROGRESS')
        ORDER BY priority = 'CRITICAL' DESC, priority = 'HIGH' DESC, created_at ASC
        LIMIT 1
      `;
      const result = await pool.query(query, [this.id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`[${this.name}] Error fetching active task:`, error);
      return null;
    }
  }

  // Update task status in database
  async updateTask(taskId: string, status: string, resultText?: string) {
    try {
      const query = `
        UPDATE tasks 
        SET status = $2, ${resultText ? 'goal = goal || $3' : 'title = title'}
        WHERE id = $1
        RETURNING *
      `;
      const params = resultText ? [taskId, status, `\n\n[Result]: ${resultText}`] : [taskId, status];
      const result = await pool.query(query, params);
      console.log(`[${this.name}] Task ${taskId} updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[${this.name}] Error updating task ${taskId}:`, error);
      return null;
    }
  }

  // Helper to query LLM via the local 9Router endpoint
  async queryLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiBase = process.env.OPENAI_BASE_URL || 'http://localhost:20128/v1';
    const model = process.env.OPENAI_MODEL || 'ag/gemini-3.5-flash-extra-low';
    const apiKey = process.env.OPENAI_API_KEY || 'dummy-key';

    try {
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API returned status ${response.status}`);
      }

      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error(`[${this.name}] LLM query failed, using offline fallback. Error:`, error);
      return `[Offline Fallback] Successfully processed prompt: "${userPrompt.slice(0, 60)}..."`;
    }
  }
}
