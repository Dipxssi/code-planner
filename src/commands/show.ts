import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

export const showCommand = new Command('show')
  .description('Show detailed information about a specific plan')
  .argument('[planId]', 'ID or title of the plan to display (optional)')
  .option('-s, --steps', 'Show detailed steps breakdown')
  .option('-f, --files', 'Show file structure details')
  .option('-d, --dependencies', 'Show dependencies information')
  .action(async (planId: string | undefined, options) => {
    
    // Mock available plans (later we'll load from files)
    const availablePlans = [
      {
        id: 'todo-app-' + Date.now(),
        title: 'Build a Todo App with Authentication',
        status: 'in-progress'
      },
      {
        id: 'rest-api-' + (Date.now() - 100000),
        title: 'Build a REST API for Blog',
        status: 'completed'
      },
      {
        id: 'react-dashboard-' + (Date.now() - 200000),
        title: 'Build a React Dashboard',
        status: 'planning'
      }
    ];
    
    let selectedPlanId = planId;
    
    // If no planId provided, show interactive selection
    if (!planId) {
      console.log(chalk.blue(' Select a plan to view:'));
      
      const { selectedPlan } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedPlan',
          message: 'Choose a plan:',
          choices: availablePlans.map(plan => ({
            name: `${plan.title} (${plan.status})`,
            value: plan.id,
            short: plan.title
          }))
        }
      ]);
      
      selectedPlanId = selectedPlan;
    } 
    // If planId provided but doesn't exist, try fuzzy matching
    else {
      const exactMatch = availablePlans.find(plan => plan.id === planId);
      
      if (!exactMatch) {
        // Try to find by partial title match
        const titleMatches = availablePlans.filter(plan => 
          plan.title.toLowerCase().includes(planId.toLowerCase()) ||
          planId.toLowerCase().includes(plan.title.toLowerCase().split(' ')[0])
        );
        
        if (titleMatches.length === 0) {
          console.log(chalk.red(`Plan "${planId}" not found.`));
          console.log(chalk.yellow('\n Available plans:'));
          availablePlans.forEach((plan, index) => {
            console.log(`   ${index + 1}. ${chalk.cyan(plan.id)} - ${plan.title}`);
          });
          console.log(chalk.gray('\n Try: code-planner show <plan-id>'));
          console.log(chalk.gray(' Or run: code-planner show (for interactive selection)'));
          return;
        }
        
        if (titleMatches.length === 1) {
          selectedPlanId = titleMatches[0].id;
          console.log(chalk.green(`Found plan: "${titleMatches[0].title}"`));
        } else {
          console.log(chalk.yellow(`Multiple plans match "${planId}":`));
          
          const { selectedPlan } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedPlan',
              message: 'Which plan did you mean?',
              choices: titleMatches.map(plan => ({
                name: `${plan.title} (${plan.status})`,
                value: plan.id,
                short: plan.title
              }))
            }
          ]);
          
          selectedPlanId = selectedPlan;
        }
      }
    }
    
    console.log(chalk.blue(`Loading plan: ${selectedPlanId}...`));
    
    const spinner = ora('Fetching plan details...').start();
    
    try {
      // Simulate loading plan details
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock plan data (later we'll load from files)
      const mockPlan = {
        id: selectedPlanId,
        title: 'Build a Todo App with Authentication',
        description: 'Create a full-stack todo application with user authentication, CRUD operations, and responsive design.',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'in-progress',
        overview: {
          projectType: 'fullstack',
          estimatedTime: '2-3 weeks',
          complexity: 'medium'
        },
        fileStructure: {
          directories: [
            'src/',
            'src/components/',
            'src/pages/',
            'src/hooks/',
            'src/utils/',
            'src/types/',
            'server/',
            'server/routes/',
            'server/models/',
            'server/middleware/'
          ],
          files: [
            'package.json',
            'README.md',
            'src/App.tsx',
            'src/index.tsx',
            'src/components/TodoList.tsx',
            'src/components/TodoItem.tsx',
            'src/components/AuthForm.tsx',
            'src/pages/Dashboard.tsx',
            'src/pages/Login.tsx',
            'server/index.js',
            'server/routes/auth.js',
            'server/routes/todos.js',
            'server/models/User.js',
            'server/models/Todo.js'
          ]
        },
        dependencies: {
          npm: [
            'react',
            'react-dom',
            'react-router-dom',
            'axios',
            'express',
            'mongoose',
            'bcryptjs',
            'jsonwebtoken',
            'cors'
          ],
          apis: ['MongoDB Atlas', 'JWT Authentication'],
          services: ['Vercel (frontend)', 'Railway (backend)']
        },
        steps: [
          {
            id: 'step-1',
            title: 'Project Setup & Dependencies',
            description: 'Initialize React app, install dependencies, set up folder structure',
            files: ['package.json', 'src/index.tsx', 'src/App.tsx'],
            dependencies: ['react', 'react-dom', 'react-router-dom'],
            completed: true,
            order: 1
          },
          {
            id: 'step-2',
            title: 'Backend API Setup',
            description: 'Create Express server with MongoDB connection and basic routes',
            files: ['server/index.js', 'server/models/User.js', 'server/models/Todo.js'],
            dependencies: ['express', 'mongoose', 'cors'],
            completed: true,
            order: 2
          },
          {
            id: 'step-3',
            title: 'Authentication System',
            description: 'Implement user registration, login, and JWT token management',
            files: ['server/routes/auth.js', 'server/middleware/auth.js', 'src/components/AuthForm.tsx'],
            dependencies: ['bcryptjs', 'jsonwebtoken'],
            completed: true,
            order: 3
          },
          {
            id: 'step-4',
            title: 'Todo CRUD Operations',
            description: 'Create, read, update, delete functionality for todos',
            files: ['server/routes/todos.js', 'src/components/TodoList.tsx', 'src/components/TodoItem.tsx'],
            dependencies: ['axios'],
            completed: false,
            order: 4
          },
          {
            id: 'step-5',
            title: 'Frontend UI & Styling',
            description: 'Build responsive UI components and add styling',
            files: ['src/pages/Dashboard.tsx', 'src/pages/Login.tsx', 'src/styles/'],
            dependencies: ['tailwindcss'],
            completed: false,
            order: 5
          }
        ],
        progress: {
          completedSteps: 3,
          totalSteps: 5,
          percentage: 60
        }
      };
      
      spinner.succeed('Plan loaded successfully!');
      
      // Display plan header
      console.log(chalk.green('\nPlan Details:'));
      console.log(chalk.gray('─'.repeat(70)));
      
      console.log(`\n${chalk.white.bold('Title:' + mockPlan.title)}`);
      console.log(chalk.gray(`Desc: ${mockPlan.description}`));
      console.log(`\n${chalk.gray('ID:')} ${chalk.cyan(mockPlan.id)}`);
      console.log(`${chalk.gray('Status:')} ${getStatusBadge(mockPlan.status)}`);
      console.log(`${chalk.gray('Created:')} ${mockPlan.createdAt.toLocaleDateString()}`);
      console.log(`${chalk.gray('Updated:')} ${mockPlan.updatedAt.toLocaleDateString()}`);
      
      // Overview section
      console.log(chalk.yellow('\n Overview:'));
      console.log(`   ${chalk.gray('Type:')} ${mockPlan.overview.projectType}`);
      console.log(`   ${chalk.gray('Estimated Time:')} ${mockPlan.overview.estimatedTime}`);
      console.log(`   ${chalk.gray('Complexity:')} ${getComplexityBadge(mockPlan.overview.complexity)}`);
      
      // Progress section
      const progressBar = createProgressBar(mockPlan.progress.percentage);
      console.log(chalk.yellow('\nProgress:'));
      console.log(`   ${progressBar} ${mockPlan.progress.percentage}%`);
      console.log(`   ${chalk.gray('Completed:')} ${mockPlan.progress.completedSteps}/${mockPlan.progress.totalSteps} steps`);
      
      // Steps section (always show, but detailed if --steps flag)
      console.log(chalk.yellow('\nSteps:'));
      mockPlan.steps.forEach((step, index) => {
        const statusIcon = step.completed ? chalk.green('COmpleted') : chalk.red('Not Completed');
        const stepTitle = step.completed ? chalk.gray(step.title) : chalk.white(step.title);
        
        console.log(`   ${index + 1}. ${statusIcon} ${stepTitle}`);
        
        if (options.steps) {
          console.log(`      ${chalk.gray(step.description)}`);
          console.log(`      ${chalk.gray('Files:')} ${step.files.join(', ')}`);
          console.log(`      ${chalk.gray('Dependencies:')} ${step.dependencies.join(', ')}\n`);
        }
      });
      
      // File structure (if --files flag)
      if (options.files) {
        console.log(chalk.yellow('\n File Structure:'));
        console.log(chalk.gray('   Directories:'));
        mockPlan.fileStructure.directories.forEach(dir => {
          console.log(`      ${dir}`);
        });
        console.log(chalk.gray('   Files:'));
        mockPlan.fileStructure.files.forEach(file => {
          console.log(`      ${file}`);
        });
      }
      
      // Dependencies (if --dependencies flag)
      if (options.dependencies) {
        console.log(chalk.yellow('\n Dependencies:'));
        console.log(chalk.gray('   NPM Packages:'));
        mockPlan.dependencies.npm.forEach(pkg => {
          console.log(`      ${pkg}`);
        });
        console.log(chalk.gray('   APIs:'));
        mockPlan.dependencies.apis.forEach(api => {
          console.log(`      ${api}`);
        });
        console.log(chalk.gray('   Services:'));
        mockPlan.dependencies.services.forEach(service => {
          console.log(`      ${service}`);
        });
      }
      
      // Footer with helpful commands
      console.log(chalk.gray('\n─'.repeat(70)));
      console.log(chalk.gray(' Next steps:'));
      console.log(chalk.gray(`   • code-planner progress ${selectedPlanId} --step 4 --complete`));
      console.log(chalk.gray(`   • code-planner show ${selectedPlanId} --steps --files --dependencies`));
      
    } catch (error) {
      spinner.fail('Failed to load plan');
      console.error(chalk.red(' Error:'), error);
    }
  });

// Helper functions
function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.bgGreen.black(' COMPLETED ');
    case 'in-progress':
      return chalk.bgBlue.black(' IN PROGRESS ');
    case 'planning':
      return chalk.bgYellow.black(' PLANNING ');
    case 'paused':
      return chalk.bgRed.black(' PAUSED ');
    default:
      return chalk.bgGray.black(' UNKNOWN ');
  }
}

function getComplexityBadge(complexity: string): string {
  switch (complexity) {
    case 'low':
      return chalk.green('LOW');
    case 'medium':
      return chalk.yellow('MEDIUM');
    case 'high':
      return chalk.red('HIGH');
    default:
      return chalk.gray('UNKNOWN');
  }
}

function createProgressBar(percentage: number): string {
  const barLength = 30;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  
  return chalk.green(filled) + chalk.gray(empty);
}
