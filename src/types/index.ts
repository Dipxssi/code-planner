//individual task in our plan
export interface PlanStep {
  id: string;
  title: string;
  description: string;
  files: string[];
  dependencies: string[];
  completed: boolean;
  order: number;
}
//complete plan 
export interface ProjectPlan {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'planning' | 'in-progress' | 'completed' | 'paused';
  overview: {
    projectType: string;
    estimatedTime: string;
    complexity: 'low' | 'medium' | 'high';
  };
  fileStructure: {
    directories: string[];
    files: string[];
  };
  dependencies: {
    npm: string[];
    apis: string[];
    services: string[];
  };
  steps: PlanStep[];
  progress: {
    completedSteps: number;
    totalSteps: number;
    percentage: number;
  };
}

//settings for tool
export interface PlannerConfig {
  geminiApiKey?: string;
  defaultOutputDir: string;
  maxPlans: number;
}

//Options when creating a new plan
export interface CreatePlanOptions {
  task: string;
  projectType?: string;
  framework?: string;
  interactive?: boolean;
}
