import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { CreatePlanOptions, ProjectPlan } from '../types';
import { FileStorage } from '../storage/FileStorage';
import { GeminiPlanner } from '../ai/GeminiPlanner';
import { ConfigManager } from '../config/ConfigManager';

export const createCommand = new Command('create')
  .description('Create a new coding plan from task description')
  .argument('<task>', 'Description of the coding task')
  .option('-t, --type <type>', 'Project type (frontend/backend/fullstack)')
  .option('-f, --framework <framework>', 'Preferred framework')
  .option('-i, --interactive', 'Ask interactive questions')
  .option('--no-ai', 'Create basic plan without AI generation')
  
  .action(async (task: string, options: CreatePlanOptions & { noAi?: boolean }) => {
    console.log(chalk.blue('[*] Creating your coding plan...'));
    
    const storage = new FileStorage();
    const configManager = new ConfigManager();
    
    try {
      // Initialize config
      await configManager.initConfig();
      
      let plan: ProjectPlan; // Fixed: Initialize with type
      
      if (options.noAi) {
        // Create basic plan without AI
        const spinner = ora('Creating basic plan...').start();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        plan = await createBasicPlan(task, options); // Fixed: assign result
        spinner.succeed('Basic plan created!');
        console.log(chalk.yellow(' Created basic plan without AI assistance'));
      } else {
        // Use AI to generate plan
        const spinner = ora('AI analyzing your task...').start();
        
        try {
          const apiKey = await configManager.ensureApiKey();
          const geminiPlanner = new GeminiPlanner(apiKey);
          
          spinner.text = ' Generating intelligent plan...';
          plan = await geminiPlanner.generatePlan(task, options);
          
          spinner.succeed(' AI plan generated successfully!');
        } catch (error: unknown) {
          spinner.warn('AI generation failed, creating basic plan...');
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(chalk.yellow(` ${errorMessage}`));
          
          // Fallback to basic plan creation
          plan = await createBasicPlan(task, options);
        }
      }
      
      // Save the plan
      const saveSpinner = ora('Saving plan...').start();
      await storage.savePlan(plan);
      saveSpinner.succeed('Plan saved successfully!');
      
      // Display results
      console.log(chalk.green('\nPlan Created:'));
      console.log(chalk.white(` Title: ${plan.title}`));
      console.log(chalk.white(` Type: ${plan.overview.projectType}`));
      console.log(chalk.white(`Estimated: ${plan.overview.estimatedTime}`));
      console.log(chalk.white(` Complexity: ${plan.overview.complexity}`));
      console.log(chalk.white(`Steps: ${plan.steps.length} tasks planned`));
      
      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'viewPlan',
            message: 'Would you like to view the detailed plan now?',
            default: true
          }
        ]);
        
        if (answers.viewPlan) {
          console.log(chalk.blue('\n Plan Overview:'));
          plan.steps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${chalk.cyan(step.title)}`);
            console.log(`      ${chalk.gray(step.description)}`);
          });
        }
      }
      
      console.log(chalk.gray(`\n Plan ID: ${plan.id}`));
      console.log(chalk.gray('Use "code-planner list" to see all plans'));
      console.log(chalk.gray(` Use "code-planner show ${plan.id}" for details`));
      console.log(chalk.gray(` Use "code-planner progress ${plan.id}" to start`));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(chalk.red(' Error creating plan:'), errorMessage);
      process.exit(1);
    }
  });

// Helper function for basic plan creation (fallback)
async function createBasicPlan(task: string, options: CreatePlanOptions): Promise<ProjectPlan> {
  const { generatePlanId, generateStepId } = await import('../utils/idGenerator');
  
  const planId = generatePlanId(task);
  const now = new Date();
  
  const basicSteps = [
    {
      id: generateStepId(1),
      title: 'Project Planning & Setup',
      description: 'Plan the project structure and initialize the development environment',
      files: ['README.md', 'package.json'],
      dependencies: [],
      completed: false,
      order: 1
    },
    {
      id: generateStepId(2),
      title: 'Core Implementation',
      description: `Implement the main functionality for: ${task}`,
      files: ['src/index.js'],
      dependencies: [],
      completed: false,
      order: 2
    },
    {
      id: generateStepId(3),
      title: 'Testing & Refinement',
      description: 'Add tests and refine the implementation',
      files: ['tests/', 'src/'],
      dependencies: [],
      completed: false,
      order: 3
    }
  ];
  
  return {
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
      directories: ['src/', 'tests/'],
      files: ['package.json', 'README.md', 'src/index.js']
    },
    dependencies: {
      npm: [],
      apis: [],
      services: []
    },
    steps: basicSteps,
    progress: {
      completedSteps: 0,
      totalSteps: basicSteps.length,
      percentage: 0
    }
  };
}
