import { BaseAgent } from './baseAgent.js';
import pool from './db.js';

class ArchitectAgent extends BaseAgent {
  constructor() {
    super({
      id: 'EMP-ENG-001',
      name: 'Alex',
      title: 'Senior Software Architect',
      autonomyLevel: 2
    });
  }

  // Architect Loop logic
  async runLoop() {
    console.log(`[${this.name}] Starting Architect cycle...`);

    // 1. Process active tasks assigned to the Architect
    const activeTask = await this.fetchActiveTask();
    if (activeTask) {
      console.log(`[${this.name}] Found active task: "${activeTask.title}"`);
      await this.updateTask(activeTask.id, 'IN_PROGRESS');

      // Query LLM to draft system design or technical review
      const systemPrompt = `You are Alex, the Senior Software Architect of AI Virtual Company. Create HLD/LLD document outlines or technical designs.`;
      const userPrompt = `Task Title: ${activeTask.title}\nGoal: ${activeTask.goal}\n\nDraft a technical layout or system architecture review.`;
      
      const response = await this.queryLLM(systemPrompt, userPrompt);
      console.log(`[${this.name}] LLM Tech Specs:\n${response}`);

      // Save the architecture layout to the documents table (Phase 2 integration!)
      await this.saveArchitectureDocument(activeTask.project_id, activeTask.title, response);
      
      await this.updateTask(activeTask.id, 'COMPLETED', `Generated system design and documented under /api/documents.\n\n${response}`);
    } else {
      console.log(`[${this.name}] No pending Architect tasks.`);
    }
  }

  // Save the architecture details as an ADR or LLD document
  async saveArchitectureDocument(projectId: string | null, title: string, content: string) {
    try {
      const query = `
        INSERT INTO documents (project_id, type, title, content, version)
        VALUES ($1, 'ADR', $2, $3, 1)
        RETURNING *
      `;
      const values = [projectId, `ADR: ${title}`, content];
      const result = await pool.query(query, values);
      console.log(`[${this.name}] Saved document: "${result.rows[0].title}"`);
    } catch (error) {
      console.error(`[${this.name}] Failed to save document:`, error);
    }
  }
}

// Instantiate and start running the loop
const architect = new ArchitectAgent();
const run = async () => {
  await architect.runLoop();
  // Keep loop active every 15 seconds
  setInterval(async () => {
    await architect.runLoop();
  }, 15000);
};

run().catch(console.error);
