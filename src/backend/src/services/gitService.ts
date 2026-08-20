import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Path to target repository (the project root contains the git repo)
const REPO_PATH = path.resolve('/mnt/d/explore/company virtual');

export interface GitBranchResult {
  success: boolean;
  branchName: string;
  message: string;
}

export interface GitCommitResult {
  success: boolean;
  commitHash?: string;
  message: string;
}

export interface PullRequestResult {
  success: boolean;
  prId: string;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  status: 'OPEN' | 'MERGED' | 'DECLINED';
  message: string;
}

/**
 * Service to manage git branching, commits, and mock Pull Request triggers.
 */
export class GitService {
  /**
   * Helper to execute a shell command in the project root directory
   */
  private static async runGitCommand(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: REPO_PATH });
      if (stderr && !stderr.includes('Entering') && !stderr.includes('Switched to') && !stderr.includes('Already on')) {
        console.warn(`Git command warning: ${stderr}`);
      }
      return stdout.trim();
    } catch (error: any) {
      console.error(`Git command failed: ${command}`, error);
      throw new Error(`Git error: ${error.message}`);
    }
  }

  /**
   * Creates a new branch from a base branch (default is main)
   */
  public static async createBranch(branchName: string, baseBranch = 'main'): Promise<GitBranchResult> {
    try {
      // First ensure we are on the base branch or fetch/checkout
      await this.runGitCommand(`git checkout ${baseBranch}`);
      
      // Clean up branch name to be git-safe
      const safeBranchName = branchName.replace(/[^a-zA-Z0-9-_/]/g, '-').toLowerCase();
      
      // Check if branch already exists
      const branches = await this.runGitCommand('git branch');
      const exists = branches.split('\n').some(b => b.replace('*', '').trim() === safeBranchName);
      
      if (exists) {
        // If it exists, checkout to it
        await this.runGitCommand(`git checkout ${safeBranchName}`);
        return {
          success: true,
          branchName: safeBranchName,
          message: `Switched to existing branch ${safeBranchName}`
        };
      }

      // Create and checkout new branch
      await this.runGitCommand(`git checkout -b ${safeBranchName}`);
      return {
        success: true,
        branchName: safeBranchName,
        message: `Created and switched to branch ${safeBranchName} from ${baseBranch}`
      };
    } catch (error: any) {
      return {
        success: false,
        branchName,
        message: `Failed to create branch: ${error.message}`
      };
    }
  }

  /**
   * Commits all changes or specific files to the current branch
   */
  public static async commitChanges(message: string, authorName = 'AI Agent', authorEmail = 'agent@company-os.local'): Promise<GitCommitResult> {
    try {
      // Check active branch
      const currentBranch = await this.runGitCommand('git rev-parse --abbrev-ref HEAD');
      if (currentBranch === 'main') {
        throw new Error('Commits directly to main branch are blocked by policy. Please use a feature branch.');
      }

      // Stage all changes
      await this.runGitCommand('git add .');

      // Check if there are changes to commit
      const status = await this.runGitCommand('git status --porcelain');
      if (!status) {
        return {
          success: true,
          message: 'No changes to commit'
        };
      }

      // Set local git author config and commit
      await this.runGitCommand(`git -c user.name="${authorName}" -c user.email="${authorEmail}" commit -m "${message.replace(/"/g, '\\"')}"`);
      const commitHash = await this.runGitCommand('git rev-parse HEAD');

      return {
        success: true,
        commitHash,
        message: `Successfully committed changes on branch ${currentBranch} with hash ${commitHash}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to commit changes: ${error.message}`
      };
    }
  }

  /**
   * Triggers or simulates a Pull Request creation and automatically triggers reviews
   */
  public static async triggerPullRequest(
    title: string,
    sourceBranch: string,
    targetBranch = 'main'
  ): Promise<PullRequestResult> {
    try {
      if (sourceBranch === targetBranch) {
        throw new Error('Source branch and target branch must be different.');
      }

      // Verification: Check if branch exists
      const branches = await this.runGitCommand('git branch');
      const exists = branches.split('\n').some(b => b.replace('*', '').trim() === sourceBranch);
      if (!exists && sourceBranch !== 'main') {
        throw new Error(`Source branch ${sourceBranch} does not exist in local repository.`);
      }

      // Generate a mock PR ID
      const prId = `PR-${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        success: true,
        prId,
        title,
        sourceBranch,
        targetBranch,
        status: 'OPEN',
        message: `Pull Request ${prId} ("${title}") successfully created from branch ${sourceBranch} to ${targetBranch}`
      };
    } catch (error: any) {
      return {
        success: false,
        prId: '',
        title,
        sourceBranch,
        targetBranch,
        status: 'DECLINED',
        message: `Failed to trigger Pull Request: ${error.message}`
      };
    }
  }
}
