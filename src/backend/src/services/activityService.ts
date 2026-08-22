import { pool } from '../config/db';

export async function logActivity(
  actionType: string,
  summary: string,
  agentId?: string,
  projectId?: string,
  details?: any
) {
  try {
    let deptId = null;
    if (agentId) {
      const empRes = await pool.query('SELECT department_id FROM employees WHERE id = $1', [agentId]);
      if (empRes.rows.length > 0) {
        deptId = empRes.rows[0].department_id;
      }
    }

    await pool.query(
      `INSERT INTO activity_logs (action_type, summary, agent_id, department_id, project_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [actionType, summary, agentId || null, deptId, projectId || null, details ? JSON.stringify(details) : null]
    );
  } catch (err: any) {
    console.error('[ActivityLog Error]:', err.message);
  }
}
