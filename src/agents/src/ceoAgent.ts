import { BaseAgent } from './baseAgent.js';
import pool from './db.js';

class CEOAgent extends BaseAgent {
  constructor() {
    super({
      id: 'EMP-EXE-001',
      name: 'Sovereign',
      title: 'CEO',
      autonomyLevel: 3
    });
  }

  // CEO Loop logic
  async runLoop() {
    console.log(`[${this.name}] Starting CEO cycle...`);

    // 1. Process active CEO tasks
    const activeTask = await this.fetchActiveTask();
    if (activeTask) {
      console.log(`[${this.name}] Found active task: "${activeTask.title}"`);
      await this.updateTask(activeTask.id, 'IN_PROGRESS');

      // Query LLM to "think" about this task
      const systemPrompt = `You are Sovereign, the autonomous CEO of AI Virtual Company. Think strategically about the assigned task.`;
      const userPrompt = `Task Title: ${activeTask.title}\nGoal: ${activeTask.goal}\n\nProvide an executive decision or roadmap action item.`;
      
      const response = await this.queryLLM(systemPrompt, userPrompt);
      console.log(`[${this.name}] LLM Decision:\n${response}`);
      
      await this.updateTask(activeTask.id, 'COMPLETED', response);
    } else {
      console.log(`[${this.name}] No pending CEO tasks.`);
    }

    // 2. Review and process pending ideas
    await this.reviewPendingIdeas();
  }

  // CEO reviews ideas with status 'GENERATED' or 'RESEARCHING'
  async reviewPendingIdeas() {
    try {
      const query = `SELECT * FROM ideas WHERE status = 'GENERATED' LIMIT 1`;
      const result = await pool.query(query);
      const idea = result.rows[0];

      if (idea) {
        console.log(`[${this.name}] Reviewing new business idea: "${idea.title}"`);
        
        // CEO evaluates idea using LLM
        const systemPrompt = `You are Sovereign, the CEO. Evaluate the business viability of ideas. Either APPROVE or REJECT.`;
        const userPrompt = `Idea Title: ${idea.title}\nProblem: ${idea.problem}\nSolution: ${idea.solution}\nTarget: ${idea.target_audience}\nMarket: ${idea.market_size}\n\nReview and respond with an evaluation summary.`;
        
        const evaluation = await this.queryLLM(systemPrompt, userPrompt);
        console.log(`[${this.name}] Idea Evaluation Result:\n${evaluation}`);

        // Update idea status based on evaluation
        const approved = !evaluation.toLowerCase().includes('reject');
        const newStatus = approved ? 'APPROVED' : 'REJECTED';
        
        const updateQuery = `
          UPDATE ideas 
          SET status = $2, score = $3
          WHERE id = $1
        `;
        await pool.query(updateQuery, [idea.id, newStatus, approved ? 8.5 : 4.0]);
        console.log(`[${this.name}] Idea "${idea.title}" status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error(`[${this.name}] Error reviewing ideas:`, error);
    }
  }
}

// Instantiate and start running the loop
const ceo = new CEOAgent();
const run = async () => {
  await ceo.runLoop();
  // Keep loop active every 15 seconds
  setInterval(async () => {
    await ceo.runLoop();
  }, 15000);
};

run().catch(console.error);
