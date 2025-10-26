import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ProjectPlan, PlannerConfig } from '../types';

export class FileStorage {
  private configPath: string;
  private plansDir: string;

  constructor() {
    const homeDir = os.homedir();
    const appDir = path.join(homeDir, '.code-planner');
    this.configPath = path.join(appDir, 'config.json');
    this.plansDir = path.join(appDir, 'plans');
  }

  async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
      await fs.mkdir(this.plansDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  // Plan operations
  async savePlan(plan: ProjectPlan): Promise<void> {
    await this.ensureDirectories();
    const planPath = path.join(this.plansDir, `${plan.id}.json`);
    await fs.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8');
  }

  async loadPlan(id: string): Promise<ProjectPlan | null> {
    try {
      const planPath = path.join(this.plansDir, `${id}.json`);
      const content = await fs.readFile(planPath, 'utf-8');
      const plan = JSON.parse(content);
      
      // Convert date strings back to Date objects
      plan.createdAt = new Date(plan.createdAt);
      plan.updatedAt = new Date(plan.updatedAt);
      
      return plan as ProjectPlan;
    } catch (error) {
      return null;
    }
  }

  async listPlans(): Promise<ProjectPlan[]> {
    try {
      await this.ensureDirectories();
      const files = await fs.readdir(this.plansDir);
      const planFiles = files.filter(file => file.endsWith('.json'));
      
      const plans: ProjectPlan[] = [];
      
      for (const file of planFiles) {
        const id = path.basename(file, '.json');
        const plan = await this.loadPlan(id);
        if (plan) {
          plans.push(plan);
        }
      }
      
      // Sort by creation date (newest first)
      return plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return [];
    }
  }

  async deletePlan(id: string): Promise<boolean> {
    try {
      const planPath = path.join(this.plansDir, `${id}.json`);
      await fs.unlink(planPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async updatePlan(plan: ProjectPlan): Promise<void> {
    plan.updatedAt = new Date();
    
    // Recalculate progress
    const completedSteps = plan.steps.filter(step => step.completed).length;
    plan.progress = {
      completedSteps,
      totalSteps: plan.steps.length,
      percentage: Math.round((completedSteps / plan.steps.length) * 100)
    };
    
    await this.savePlan(plan);
  }

  // Configuration operations
  async loadConfig(): Promise<PlannerConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(content) as PlannerConfig;
    } catch (error) {
      // Return default config if file doesn't exist
      return {
        defaultOutputDir: process.cwd(),
        maxPlans: 50
      };
    }
  }

  async saveConfig(config: PlannerConfig): Promise<void> {
    await this.ensureDirectories();
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  // Utility methods
  async findPlansByTitle(searchTerm: string): Promise<ProjectPlan[]> {
    const allPlans = await this.listPlans();
    return allPlans.filter(plan => 
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm.toLowerCase().includes(plan.title.toLowerCase().split(' ')[0])
    );
  }

  async getStorageStats(): Promise<{
    totalPlans: number;
    completedPlans: number;
    inProgressPlans: number;
    storageSize: string;
  }> {
    const plans = await this.listPlans();
    
    return {
      totalPlans: plans.length,
      completedPlans: plans.filter(p => p.status === 'completed').length,
      inProgressPlans: plans.filter(p => p.status === 'in-progress').length,
      storageSize: 'Calculating...' // Could implement actual size calculation
    };
  }
}
