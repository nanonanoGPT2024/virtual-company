import OpenAI from 'openai';
import dotenv from 'dotenv';
import { pool } from '../config/db';

dotenv.config();

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:20128/v1',
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy',
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'ag/gemini-3.7-flash-high';

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export async function callAgentLLM(
  agentId: string,
  systemPrompt: string,
  userPrompt: string,
  projectId?: string
): Promise<LLMResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    const inputTokens = response.usage?.prompt_tokens || Math.round((systemPrompt.length + userPrompt.length) / 4);
    const outputTokens = response.usage?.completion_tokens || Math.round(content.length / 4);
    
    // Perhitungan estimasi biaya ($0.5 / 1M token input, $1.5 / 1M token output)
    const costUsd = Number(((inputTokens * 0.0000005) + (outputTokens * 0.0000015)).toFixed(6));

    // Log usage to database
    await pool.query(
      `INSERT INTO token_usages (project_id, agent_id, model_name, input_tokens, output_tokens, cost_usd)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId || null, agentId, DEFAULT_MODEL, inputTokens, outputTokens, costUsd]
    );

    // Update agent ai_cost_used_today
    await pool.query(
      `UPDATE employees SET ai_cost_used_today = ai_cost_used_today + $1 WHERE id = $2`,
      [costUsd, agentId]
    );

    if (projectId) {
      await pool.query(
        `UPDATE projects SET total_token_cost_usd = total_token_cost_usd + $1 WHERE id = $2`,
        [costUsd, projectId]
      );
    }

    return {
      content,
      inputTokens,
      outputTokens,
      costUsd
    };
  } catch (error: any) {
    console.error(`[LLM Error Agent ${agentId}]:`, error.message);
    throw error;
  }
}
