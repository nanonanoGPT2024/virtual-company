import { RequestHandler } from 'express';
import pool from '../config/db.js';

export const costAuditor: RequestHandler = async (req, res, next) => {
  // Check agent_id in body, query, or headers
  const agentId = req.body?.agent_id || req.query?.agent_id || req.headers['x-agent-id'] || req.headers['X-Agent-ID'];

  if (!agentId || typeof agentId !== 'string') {
    // If no agent ID is provided, let the request pass
    return next();
  }

  try {
    // Single query to fetch limits and calculate daily/monthly spent
    const query = `
      SELECT 
        id,
        daily_ai_limit_usd, 
        monthly_ai_limit_usd,
        COALESCE((SELECT SUM(amount_usd) FROM financial_logs WHERE agent_id = e.id AND created_at >= date_trunc('day', NOW())), 0) as daily_spent,
        COALESCE((SELECT SUM(amount_usd) FROM financial_logs WHERE agent_id = e.id AND created_at >= date_trunc('month', NOW())), 0) as monthly_spent
      FROM employees e
      WHERE e.id = $1
    `;
    
    const result = await pool.query(query, [agentId]);

    if (result.rowCount === 0) {
      // If agent is specified but does not exist in employees, let the request pass
      return next();
    }

    const employee = result.rows[0];
    const dailyLimit = parseFloat(employee.daily_ai_limit_usd || '0');
    const monthlyLimit = parseFloat(employee.monthly_ai_limit_usd || '0');
    const dailySpent = parseFloat(employee.daily_spent || '0');
    const monthlySpent = parseFloat(employee.monthly_spent || '0');

    if (dailySpent >= dailyLimit || monthlySpent >= monthlyLimit) {
      res.status(403).json({ 
        success: false, 
        message: 'Daily/Monthly AI budget limit exceeded' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in costAuditor middleware:', error);
    // On db error, log and proceed to avoid blocking critical endpoints
    next();
  }
};
