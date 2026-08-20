import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';
import { GitService } from '../services/gitService.js';

const router = Router();

/**
 * Helper to generate random string identifiers for spawned employees.
 */
function generateAgentId(role: string): string {
  const prefix = role.toLowerCase().includes('qa') ? 'EMP-QA' : 'EMP-DEV';
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

/**
 * POST /api/factory/spawns
 * Defines and spawns a new developer/QA agent, saving it to the employees table.
 */
const spawnAgent: RequestHandler = async (req, res) => {
  const { name, title, department_id, daily_ai_limit_usd, monthly_ai_limit_usd, autonomy_level, manager_id } = req.body;

  if (!name || !title) {
    res.status(400).json({ success: false, message: 'Name and Title are required' });
    return;
  }

  // Find company_id first
  try {
    const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
    if (companyRes.rowCount === 0) {
      res.status(400).json({ success: false, message: 'No company exists in database' });
      return;
    }
    const companyId = companyRes.rows[0].id;

    // Use default Engineering department if none provided
    let finalDeptId = department_id;
    if (!finalDeptId) {
      const deptRes = await pool.query("SELECT id FROM departments WHERE name ILIKE 'Engineering' LIMIT 1");
      if (deptRes.rowCount && deptRes.rowCount > 0) {
        finalDeptId = deptRes.rows[0].id;
      }
    }

    const agentId = generateAgentId(title);

    const insertQuery = `
      INSERT INTO employees (
        id, company_id, name, title, department_id, manager_id,
        daily_ai_limit_usd, monthly_ai_limit_usd, autonomy_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      agentId,
      companyId,
      name,
      title,
      finalDeptId || null,
      manager_id || 'EMP-ENG-001', // Default manager is Alex (Senior Software Architect)
      daily_ai_limit_usd || 10.00,
      monthly_ai_limit_usd || 200.00,
      autonomy_level || 1
    ];

    const result = await pool.query(insertQuery, values);
    
    res.status(201).json({
      success: true,
      message: `Agent ${agentId} (${name}) successfully spawned and registered in Engineering.`,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error spawning agent:', error);
    res.status(500).json({ success: false, message: `Database error: ${error.message}` });
  }
};

/**
 * POST /api/factory/review
 * Triggers an automated code review loop by the Architect agent (Alex / EMP-ENG-001).
 * Expects { taskId, codeChanges, comments } in body.
 */
const triggerReview: RequestHandler = async (req, res) => {
  const { taskId, codeChanges, comments } = req.body;

  if (!taskId) {
    res.status(400).json({ success: false, message: 'taskId is required' });
    return;
  }

  try {
    // 1. Fetch the Task
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    const task = taskRes.rows[0];

    // 2. Fetch Architect agent info (EMP-ENG-001) as the reviewer
    const reviewerId = 'EMP-ENG-001';
    const reviewerRes = await pool.query('SELECT * FROM employees WHERE id = $1', [reviewerId]);
    const reviewerName = reviewerRes.rowCount && reviewerRes.rowCount > 0 ? reviewerRes.rows[0].name : 'Alex (Architect)';

    // 3. Mock Architect Automated Review Decision Process
    // Logic: Architect checks standard and assigns rating. We do a quick analysis of inputs.
    const cleanScore = codeChanges && !codeChanges.toLowerCase().includes('todo') && !codeChanges.toLowerCase().includes('hack') ? 95 : 70;
    const reviewApproved = cleanScore >= 80;
    const statusResult = reviewApproved ? 'COMPLETED' : 'IN_PROGRESS'; // If not approved, goes back/remains in progress

    let reviewComment = '';
    if (reviewApproved) {
      reviewComment = `Architect review approved by ${reviewerName}. Code looks clean, matches architecture specifications. Score: ${cleanScore}/100.`;
    } else {
      reviewComment = `Architect review rejected by ${reviewerName}. Found potential placeholders or TODOs. Score: ${cleanScore}/100. Please fix code changes.`;
    }

    // 4. Update the Task reviewer and status in DB
    const updateQuery = `
      UPDATE tasks 
      SET status = $1, reviewer_id = $2
      WHERE id = $3 
      RETURNING *
    `;
    const updatedTaskRes = await pool.query(updateQuery, [statusResult, reviewerId, taskId]);

    // 5. Mock Git PR trigger
    const gitPrTitle = `Architect Review for Task: ${task.title}`;
    const branchName = `feature/task-${taskId.slice(0, 8)}`;
    const prResult = await GitService.triggerPullRequest(gitPrTitle, branchName);

    res.json({
      success: true,
      message: 'Automated code review loop processed.',
      review: {
        reviewerId,
        reviewerName,
        approved: reviewApproved,
        score: cleanScore,
        comments: reviewComment,
        suggestedFixes: reviewApproved ? [] : ['Remove TODOs/Hacks', 'Ensure full error handling implementation']
      },
      pullRequest: prResult,
      task: updatedTaskRes.rows[0]
    });

  } catch (error: any) {
    console.error('Error during automated code review:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

/**
 * POST /api/factory/test
 * Runs automated unit/integration tests and logs bug reports as subtasks if they fail.
 * Expects { taskId, runCoverage } in body.
 */
const runTests: RequestHandler = async (req, res) => {
  const { taskId, runCoverage } = req.body;

  if (!taskId) {
    res.status(400).json({ success: false, message: 'taskId is required' });
    return;
  }

  try {
    // 1. Fetch parent Task
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    const parentTask = taskRes.rows[0];

    // 2. Mock Test Exec Results
    // Simulate some tests failing randomly or based on certain conditions
    const testRuns = [
      { name: 'Unit Tests: Database Connection Middleware', status: 'PASSED', durationMs: 142 },
      { name: 'Unit Tests: Git Service Branch Creation', status: 'PASSED', durationMs: 98 },
      { name: 'Integration Tests: Factory Spawn Endpoint', status: Math.random() > 0.3 ? 'PASSED' : 'FAILED', durationMs: 405 },
      { name: 'Security Check: SQL Injection Prevention', status: 'PASSED', durationMs: 180 }
    ];

    const failedTests = testRuns.filter(t => t.status === 'FAILED');
    const testsPassed = failedTests.length === 0;

    let subtaskBug = null;

    // 3. If tests fail, automatically insert a Bug Task in database linked to the project and department
    if (!testsPassed) {
      const bugTitle = `[BUG] Test Failures for Task: ${parentTask.title}`;
      const bugGoal = `Automated QA pipeline failed. Failed tests details:\n` +
        failedTests.map(t => `- ${t.name} (failed, took ${t.durationMs}ms)`).join('\n') +
        `\n\nPlease investigate and resolve the failing integration test suite.`;

      const insertBugQuery = `
        INSERT INTO tasks (
          title, goal, project_id, department_id, assignee_id, reviewer_id,
          priority, status, budget_usd
        ) VALUES ($1, $2, $3, $4, $5, $6, 'HIGH', 'BACKLOG', 0.00)
        RETURNING *
      `;

      const bugValues = [
        bugTitle,
        bugGoal,
        parentTask.project_id,
        parentTask.department_id,
        parentTask.assignee_id || 'EMP-ENG-001', // Default to assignee or Architect
        'EMP-ENG-001' // Architect reviews the bug fix
      ];

      const bugRes = await pool.query(insertBugQuery, bugValues);
      subtaskBug = bugRes.rows[0];
    }

    res.json({
      success: true,
      message: testsPassed ? 'All tests passed successfully.' : 'Tests failed. Bug report created.',
      testSuite: {
        totalTests: testRuns.length,
        passed: testRuns.length - failedTests.length,
        failed: failedTests.length,
        coveragePct: runCoverage ? 88.5 : undefined,
        runs: testRuns
      },
      bugCreated: !testsPassed,
      bugTask: subtaskBug
    });

  } catch (error: any) {
    console.error('Error running automated tests:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

router.post('/spawns', spawnAgent);
router.post('/review', triggerReview);
router.post('/test', runTests);

export default router;
