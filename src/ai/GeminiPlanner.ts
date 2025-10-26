import { GoogleGenerativeAI } from '@google/generative-ai';
import { ProjectPlan, PlanStep, CreatePlanOptions } from '../types';
import { generatePlanId, generateStepId } from '../utils/idGenerator';

export class GeminiPlanner {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async generatePlan(task: string, options: CreatePlanOptions): Promise<ProjectPlan> {
    const prompt = this.buildPrompt(task, options);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the AI response and convert to our ProjectPlan format
      const aiPlan = this.parseAIResponse(text, task, options);
      
      return aiPlan;
    } catch (error: unknown) {
      // Fallback to a basic plan if AI fails
      console.warn('AI generation failed, creating basic plan...', error);
      return this.createFallbackPlan(task, options);
    }
  }

  private buildPrompt(task: string, options: CreatePlanOptions): string {
    return `
You are an expert software development planner. Create a detailed development plan for the following task:

Task: "${task}"
${options.projectType ? `Project Type: ${options.projectType}` : ''}
${options.framework ? `Framework: ${options.framework}` : ''}

Please provide a structured response in the following JSON format:

{
  "title": "Project title (concise)",
  "description": "Brief project description",
  "overview": {
    "projectType": "frontend|backend|fullstack",
    "estimatedTime": "time estimate (e.g., '2-3 weeks')",
    "complexity": "low|medium|high"
  },
  "fileStructure": {
    "directories": ["array of directory paths"],
    "files": ["array of important file paths"]
  },
  "dependencies": {
    "npm": ["array of npm packages needed"],
    "apis": ["array of external APIs"],
    "services": ["array of deployment/hosting services"]
  },
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed description of what to do",
      "files": ["files that will be created/modified"],
      "dependencies": ["specific dependencies for this step"],
      "order": 1
    }
  ]
}

Requirements:
- Create 4-7 logical development steps
- Include realistic file structures
- Suggest appropriate dependencies
- Provide clear, actionable step descriptions
- Consider best practices for the chosen technology stack

Respond only with valid JSON, no additional text.
    `;
  }

  private parseAIResponse(text: string, task: string, options: CreatePlanOptions): ProjectPlan {
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const aiResponse = JSON.parse(jsonMatch[0]);
      
      const planId = generatePlanId(aiResponse.title || task);
      const now = new Date();

      // Convert AI steps to our PlanStep format
      const steps: PlanStep[] = aiResponse.steps.map((step: any, index: number) => ({
        id: generateStepId(index + 1),
        title: step.title,
        description: step.description,
        files: step.files || [],
        dependencies: step.dependencies || [],
        completed: false,
        order: index + 1
      }));

      const plan: ProjectPlan = {
        id: planId,
        title: aiResponse.title || task,
        description: aiResponse.description || `Development plan for: ${task}`,
        createdAt: now,
        updatedAt: now,
        status: 'planning',
        overview: {
          projectType: aiResponse.overview?.projectType || options.projectType || 'fullstack',
          estimatedTime: aiResponse.overview?.estimatedTime || 'TBD',
          complexity: aiResponse.overview?.complexity || 'medium'
        },
        fileStructure: {
          directories: aiResponse.fileStructure?.directories || [],
          files: aiResponse.fileStructure?.files || []
        },
        dependencies: {
          npm: aiResponse.dependencies?.npm || [],
          apis: aiResponse.dependencies?.apis || [],
          services: aiResponse.dependencies?.services || []
        },
        steps,
        progress: {
          completedSteps: 0,
          totalSteps: steps.length,
          percentage: 0
        }
      };

      return plan;
    } catch (error: unknown) {
      console.warn('Failed to parse AI response:', error);
      return this.createFallbackPlan(task, options);
    }
  }

  private createFallbackPlan(task: string, options: CreatePlanOptions): ProjectPlan {
    const planId = generatePlanId(task);
    const now = new Date();

    // Create basic steps based on project type
    const steps: PlanStep[] = this.getDefaultSteps(options.projectType || 'fullstack');

    const plan: ProjectPlan = {
      id: planId,
      title: task,
      description: `Development plan for: ${task}`,
      createdAt: now,
      updatedAt: now,
      status: 'planning',
      overview: {
        projectType: options.projectType || 'fullstack',
        estimatedTime: 'TBD',
        complexity: 'medium'
      },
      fileStructure: {
        directories: ['src/', 'src/components/', 'src/utils/'],
        files: ['package.json', 'README.md', 'src/index.js']
      },
      dependencies: {
        npm: this.getDefaultDependencies(options.framework),
        apis: [],
        services: []
      },
      steps,
      progress: {
        completedSteps: 0,
        totalSteps: steps.length,
        percentage: 0
      }
    };

    return plan;
  }

  private getDefaultSteps(projectType: string): PlanStep[] {
    const commonSteps: PlanStep[] = [
      {
        id: generateStepId(1),
        title: 'Project Setup',
        description: 'Initialize project structure and install dependencies',
        files: ['package.json', 'README.md'],
        dependencies: ['npm init', 'dependency installation'],
        completed: false,
        order: 1
      },
      {
        id: generateStepId(2),
        title: 'Core Implementation',
        description: 'Build the main functionality',
        files: ['src/index.js', 'src/main.js'],
        dependencies: [],
        completed: false,
        order: 2
      },
      {
        id: generateStepId(3),
        title: 'Testing & Documentation',
        description: 'Add tests and update documentation',
        files: ['tests/', 'README.md'],
        dependencies: ['testing framework'],
        completed: false,
        order: 3
      }
    ];

    if (projectType === 'fullstack') {
      commonSteps.splice(1, 0, {
        id: generateStepId(2),
        title: 'Backend Setup',
        description: 'Set up server and database connections',
        files: ['server/index.js', 'server/models/'],
        dependencies: ['express', 'database driver'],
        completed: false,
        order: 2
      });
      
      commonSteps.push({
        id: generateStepId(4),
        title: 'Frontend Integration',
        description: 'Connect frontend to backend APIs',
        files: ['src/services/', 'src/components/'],
        dependencies: ['axios', 'frontend framework'],
        completed: false,
        order: 4
      });
    }

    return commonSteps;
  }

  private getDefaultDependencies(framework?: string): string[] {
    const deps = ['express'];
    
    if (framework) {
      switch (framework.toLowerCase()) {
        case 'react':
          deps.push('react', 'react-dom');
          break;
        case 'vue':
          deps.push('vue');
          break;
        case 'angular':
          deps.push('@angular/core');
          break;
        case 'next':
          deps.push('next', 'react');
          break;
      }
    }
    
    return deps;
  }

  async suggestNextSteps(plan: ProjectPlan): Promise<string[]> {
    const completedSteps = plan.steps.filter(step => step.completed);
    const nextStep = plan.steps.find(step => !step.completed);
    
    if (!nextStep) {
      return ['All steps completed! Consider deployment or additional features.'];
    }

    const prompt = `
Given this development plan progress:
- Project: ${plan.title}
- Completed steps: ${completedSteps.map(s => s.title).join(', ')}
- Next step: ${nextStep.title}

Suggest 3-5 specific actionable items for the next step "${nextStep.title}".
Respond with a simple array of strings, no additional formatting.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse suggestions from response - Fixed TypeScript error
      const suggestions = text
        .split('\n')
        .filter((line: string) => line.trim()) // Added type annotation
        .slice(0, 5);
        
      return suggestions.length > 0 ? suggestions : [
        `Work on: ${nextStep.description}`,
        `Create files: ${nextStep.files.join(', ')}`,
        `Install dependencies: ${nextStep.dependencies.join(', ')}`
      ];
    } catch (error: unknown) {
      return [
        `Work on: ${nextStep.description}`,
        `Create files: ${nextStep.files.join(', ')}`,
        `Install dependencies: ${nextStep.dependencies.join(', ')}`
      ];
    }
  }
}
