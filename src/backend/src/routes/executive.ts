import { Router, RequestHandler } from 'express';
import pool from '../config/db.js';

const router = Router();

// Simulated list of C-level agents and other roles for meetings and debates
const EXEC_ROLES = [
  { id: 'EMP-EXE-001', name: 'Sovereign', title: 'CEO' },
  { id: 'EMP-EXE-002', name: 'Dr. Evelyn', title: 'CTO' },
  { id: 'EMP-EXE-003', name: 'Marcus', title: 'CFO' },
  { id: 'EMP-EXE-004', name: 'Elena', title: 'CPO' }
];

/**
 * POST /api/executive/meeting
 * Simulates a C-level agent meeting (CEO, CTO, CFO, CPO) and returns meeting summary/minutes.
 * Request body can optionally include { topic, department_id, project_id }
 */
const simulateMeeting: RequestHandler = async (req, res) => {
  const { topic, department_id, project_id } = req.body;
  const meetingTopic = topic || 'General Strategic Review and Q3 Planning';

  try {
    // 1. Fetch meeting members from DB if they exist, or fallback to mock
    // Let's check who the C-level and other management employees are
    const empRes = await pool.query(
      "SELECT id, name, title FROM employees WHERE title IN ('CEO', 'CTO', 'CFO', 'CPO', 'COO', 'Senior Software Architect') ORDER BY title DESC"
    );
    
    // Merge database employees with EXEC_ROLES mapping to ensure we have CEO, CTO, CFO, CPO
    const dbRoles = empRes.rows;
    const participants = [...EXEC_ROLES];
    
    // Update participant list if we found matching database employee rows
    dbRoles.forEach((dbEmp) => {
      const existingIdx = participants.findIndex(p => p.title === dbEmp.title);
      if (existingIdx !== -1) {
        participants[existingIdx] = { id: dbEmp.id, name: dbEmp.name, title: dbEmp.title };
      } else {
        participants.push({ id: dbEmp.id, name: dbEmp.name, title: dbEmp.title });
      }
    });

    // 2. Generate simulated C-level meeting notes/transcript
    const meetingDate = new Date();
    const agenda = [
      `1. Open discussion on: "${meetingTopic}"`,
      `2. Strategic alignment between CEO, CTO, CPO, and CFO`,
      `3. Department roadmaps, timelines, and budget adjustments`,
      `4. Review of recent initiatives and decision records`
    ];

    const transcript = [
      {
        speaker: participants.find(p => p.title === 'CEO')?.name || 'Sovereign',
        role: 'CEO',
        text: `Welcome everyone. Today we are gathered to address: "${meetingTopic}". Elena, could you start by sharing the product roadmap status?`
      },
      {
        speaker: participants.find(p => p.title === 'CPO')?.name || 'Elena',
        role: 'CPO',
        text: `Absolutely. We have finalized the user flow specs and are ready to hand off functionality requirements to engineering. CTO, how is the architecture design looking?`
      },
      {
        speaker: participants.find(p => p.title === 'CTO')?.name || 'Dr. Evelyn',
        role: 'CTO',
        text: `Our architecture model is designed to support the vector store integration. We are ensuring strict micro-budget audit middlewares are active to prevent high LLM expenses. CFO, how does this align with the budget constraints?`
      },
      {
        speaker: participants.find(p => p.title === 'CFO')?.name || 'Marcus',
        role: 'CFO',
        text: `We have set a safe initial limit for all engineering agents. Our cash flow projections look solid as long as we keep the token burn under $50.00 daily per employee. I recommend approving this project.`
      },
      {
        speaker: participants.find(p => p.title === 'CEO')?.name || 'Sovereign',
        role: 'CEO',
        text: `Excellent. Consensus has been reached. Let's document this decision in the company memory database and generate the corresponding backlog tasks.`
      }
    ];

    const actionItems = [
      { assignee: 'CPO', task: 'Finalize UX flow spec and PRD documentation' },
      { assignee: 'CTO', task: 'Prepare high-level architecture design and db migration scripts' },
      { assignee: 'CFO', task: 'Approve department budget allocation of $25,000 for development' }
    ];

    const summary = `
Executive meeting conducted successfully regarding "${meetingTopic}". 
The board (CEO, CTO, CPO, CFO) reviewed current roadmap items and aligned on resource allocation. 
CTO confirmed technical readiness and integration of AI Cost Accounting. 
CFO approved the budget guidelines under the condition of strict limit audits.
    `.trim();

    // 3. Save meeting results to company brain as organizational memory (RAG reference)
    const brainContent = `Meeting Minutes - ${meetingTopic} (${meetingDate.toISOString()})\n\n` +
      `Summary: ${summary}\n\n` +
      `Agenda:\n${agenda.join('\n')}\n\n` +
      `Action Items:\n${actionItems.map(a => `- [${a.assignee}] ${a.task}`).join('\n')}`;

    // Find default company id
    const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
    const companyId = companyRes.rowCount && companyRes.rowCount > 0 ? companyRes.rows[0].id : null;

    let brainId = null;
    try {
      // Save meeting notes to RAG brain
      const brainQuery = `
        INSERT INTO company_brain (company_id, content, meta_tags)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const brainRes = await pool.query(brainQuery, [companyId, brainContent, ['meeting', 'minutes', 'executive']]);
      brainId = brainRes.rows[0]?.id || null;
    } catch (dbErr) {
      console.warn('Could not write meeting notes to company_brain, proceeding anyway:', dbErr);
    }

    res.json({
      success: true,
      data: {
        topic: meetingTopic,
        date: meetingDate,
        participants,
        agenda,
        transcript,
        summary,
        actionItems,
        savedMemoryId: brainId
      }
    });

  } catch (error: any) {
    console.error('Error during simulated meeting:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

/**
 * POST /api/executive/debate
 * Simulates a consensual debate between agents on a strategic proposal.
 * Request body expects: { proposalTitle, proposalDescription, budgetUsd }
 */
const simulateDebate: RequestHandler = async (req, res) => {
  const { proposalTitle, proposalDescription, budgetUsd } = req.body;

  if (!proposalTitle || !proposalDescription) {
    res.status(400).json({ success: false, message: 'proposalTitle and proposalDescription are required' });
    return;
  }

  const requestedBudget = parseFloat(budgetUsd || '0.00');

  try {
    // 1. Fetch participants
    const empRes = await pool.query(
      "SELECT id, name, title FROM employees WHERE title IN ('CEO', 'CTO', 'CFO', 'CPO', 'COO') ORDER BY title DESC"
    );
    const dbRoles = empRes.rows;
    const participants = [...EXEC_ROLES];
    dbRoles.forEach((dbEmp) => {
      const existingIdx = participants.findIndex(p => p.title === dbEmp.title);
      if (existingIdx !== -1) {
        participants[existingIdx] = { id: dbEmp.id, name: dbEmp.name, title: dbEmp.title };
      } else {
        participants.push({ id: dbEmp.id, name: dbEmp.name, title: dbEmp.title });
      }
    });

    // 2. Perform Debate Simulation Logic
    // Each agent contributes an structured response: opinion, evidence, risk, and confidence level.
    const debateTurns = [
      {
        agent: participants.find(p => p.title === 'CPO')?.name || 'Elena',
        title: 'CPO',
        opinion: 'APPROVE',
        evidence: 'User feedback indicates high demand for automated features, which could boost user acquisition by 35%.',
        risk: 'Feature scope creep could delay the launch timeline by several weeks.',
        confidence: 0.90
      },
      {
        agent: participants.find(p => p.title === 'CTO')?.name || 'Dr. Evelyn',
        title: 'CTO',
        opinion: requestedBudget > 50000 ? 'REQUEST_CHANGES' : 'APPROVE',
        evidence: requestedBudget > 50000 
          ? 'An architecture revision is needed as the complexity of this deployment path requires more specialized nodes than budgeted.'
          : 'The existing stack template fully supports this proposal. Our developer factory agents can deploy it in less than 2 sprints.',
        risk: requestedBudget > 50000
          ? 'Potential technical debt and API rate limits on backend dependencies.'
          : 'Minor scaling limits if high concurrent loops are triggered.',
        confidence: 0.85
      },
      {
        agent: participants.find(p => p.title === 'CFO')?.name || 'Marcus',
        title: 'CFO',
        opinion: requestedBudget > 20000 ? 'REQUEST_CHANGES' : 'APPROVE',
        evidence: requestedBudget > 20000
          ? `The requested budget ($${requestedBudget.toLocaleString()}) exceeds the maximum threshold for autonomous micro-expenses. It requires human-in-the-loop audit.`
          : `The budget of $${requestedBudget.toLocaleString()} is within acceptable boundaries for our department allocation.`,
        risk: 'Negative cash flow impact if customer conversion metrics don\'t hold up.',
        confidence: 0.95
      },
      {
        agent: participants.find(p => p.title === 'CEO')?.name || 'Sovereign',
        title: 'CEO',
        opinion: 'PENDING_DECISION',
        evidence: 'Synthesizing opinions from CPO, CTO, and CFO. Aligning tech feasibility with financial risks.',
        risk: 'Market window opportunity might close if debate loops continue indefinitely.',
        confidence: 0.88
      }
    ];

    // Determine final status/outcome of debate based on consensus
    const approvals = debateTurns.filter(turn => turn.opinion === 'APPROVE').length;
    const requestChanges = debateTurns.filter(turn => turn.opinion === 'REQUEST_CHANGES').length;
    
    let consensusReached = false;
    let finalDecision = 'PENDING_HUMAN_APPROVAL';
    let debateConclusion = '';

    if (approvals >= 3) {
      consensusReached = true;
      finalDecision = 'APPROVED';
      debateConclusion = 'Consensus reached. All key stakeholders aligned on execution strategy.';
    } else if (requestChanges > 0) {
      consensusReached = false;
      finalDecision = 'REJECTED_NEEDS_REVISION';
      debateConclusion = 'Consensus failed due to budget constraints or technical feasibility concerns. Proposal requires revision.';
    } else {
      debateConclusion = 'Proposal deferred to CEO/Owner decision. Stakeholder opinions are divided.';
    }

    // Save debate transcript/record in DB (as document or in company brain)
    const brainContent = `Consensual Debate Record - Proposal: ${proposalTitle}\n\n` +
      `Description: ${proposalDescription}\n` +
      `Budget Requested: $${requestedBudget.toLocaleString()}\n` +
      `Conclusion: ${debateConclusion}\n` +
      `Final Status: ${finalDecision}\n\n` +
      `Opinions:\n` +
      debateTurns.map(t => `- [${t.title}] ${t.agent}: Opinion=${t.opinion}, Confidence=${t.confidence}, Risk=${t.risk}`).join('\n');

    const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
    const companyId = companyRes.rowCount && companyRes.rowCount > 0 ? companyRes.rows[0].id : null;

    let brainId = null;
    try {
      const brainQuery = `
        INSERT INTO company_brain (company_id, content, meta_tags)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const brainRes = await pool.query(brainQuery, [companyId, brainContent, ['debate', 'proposal', 'strategic']]);
      brainId = brainRes.rows[0]?.id || null;
    } catch (dbErr) {
      console.warn('Could not save debate to company_brain, proceeding anyway:', dbErr);
    }

    res.json({
      success: true,
      data: {
        proposal: {
          title: proposalTitle,
          description: proposalDescription,
          budgetUsd: requestedBudget
        },
        consensusReached,
        finalDecision,
        conclusion: debateConclusion,
        savedMemoryId: brainId,
        debateTurns
      }
    });

  } catch (error: any) {
    console.error('Error during simulated debate:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

/**
 * POST /api/executive/approve
 * Handles human-in-the-loop approvals.
 * Request body expects: { entityType, entityId, action } 
 * e.g., entityType="idea" or "task", action="approve" or "reject"
 */
const handleApproval: RequestHandler = async (req, res) => {
  const { entityType, entityId, action } = req.body;

  if (!entityType || !entityId || !action) {
    res.status(400).json({ success: false, message: 'entityType, entityId, and action are required' });
    return;
  }

  const isApproved = action === 'approve';
  const newStatus = isApproved ? 'APPROVED' : 'REJECTED';

  try {
    let tableName = '';
    let statusField = 'status';

    switch (entityType.toLowerCase()) {
      case 'idea':
        tableName = 'ideas';
        break;
      case 'task':
        tableName = 'tasks';
        break;
      case 'project':
        tableName = 'projects';
        break;
      default:
        res.status(400).json({ success: false, message: `Unsupported entity type: ${entityType}` });
        return;
    }

    // Update status in the corresponding database table
    const query = `
      UPDATE ${tableName}
      SET ${statusField} = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [newStatus, entityId]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: `${entityType} with ID ${entityId} not found.` });
      return;
    }

    res.json({
      success: true,
      message: `Human-in-the-loop action completed successfully. Entity updated.`,
      action,
      entityType,
      updatedRecord: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error handling human-in-the-loop approval:', error);
    res.status(500).json({ success: false, message: `Database error: ${error.message}` });
  }
};

router.post('/meeting', simulateMeeting);
router.post('/debate', simulateDebate);
router.post('/approve', handleApproval);

export default router;
