import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

export const progressCommand = new Command('progress')
  .description('Update step completion status for a plan')
  .argument('[planId]', 'ID or title of the plan to update (optional)')
  .option('-s, --step <stepNumber>', 'Step number to update (1, 2, 3, etc.)')
  .option('-c, --complete', 'Mark step as completed')
  .option('-i, --incomplete', 'Mark step as incomplete')
  .option('--show', 'Show current progress without updating')
  .action(async (planId: string | undefined, options) => {
    
    // Mock available plans (later we'll load from files)
    const availablePlans = [
      {
        id: 'todo-app-' + Date.now(),
        title: 'Build a Todo App with Authentication',
        status: 'in-progress',
        steps: [
          { id: 'step-1', title: 'Project Setup & Dependencies', completed: true, order: 1 },
          { id: 'step-2', title: 'Backend API Setup', completed: true, order: 2 },
          { id: 'step-3', title: 'Authentication System', completed: true, order: 3 },
          { id: 'step-4', title: 'Todo CRUD Operations', completed: false, order: 4 },
          { id: 'step-5', title: 'Frontend UI & Styling', completed: false, order: 5 }
        ]
      },
      {
        id: 'rest-api-' + (Date.now() - 100000),
        title: 'Build a REST API for Blog',
        status: 'completed',
        steps: [
          { id: 'step-1', title: 'Express Server Setup', completed: true, order: 1 },
          { id: 'step-2', title: 'Database Models', completed: true, order: 2 },
          { id: 'step-3', title: 'API Routes', completed: true, order: 3 },
          { id: 'step-4', title: 'Authentication', completed: true, order: 4 }
        ]
      }
    ];
    
    let selectedPlanId = planId;
    
    // Plan selection logic (same as show command)
    if (!planId) {
      console.log(chalk.blue(' Select a plan to update progress:'));
      
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
    } else {
      // Fuzzy matching logic (same as show command)
      const exactMatch = availablePlans.find(plan => plan.id === planId);
      
      if (!exactMatch) {
        const titleMatches = availablePlans.filter(plan => 
          plan.title.toLowerCase().includes(planId.toLowerCase()) ||
          planId.toLowerCase().includes(plan.title.toLowerCase().split(' ')[0])
        );
        
        if (titleMatches.length === 0) {
          console.log(chalk.red(` Plan "${planId}" not found.`));
          console.log(chalk.yellow('\n Available plans:'));
          availablePlans.forEach((plan, index) => {
            console.log(`   ${index + 1}. ${chalk.cyan(plan.id)} - ${plan.title}`);
          });
          return;
        }
        
        if (titleMatches.length === 1) {
          selectedPlanId = titleMatches[0].id;
          console.log(chalk.green(` Found plan: "${titleMatches[0].title}"`));
        } else {
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
    
    // Find the selected plan
    const plan = availablePlans.find(p => p.id === selectedPlanId);
    if (!plan) {
      console.log(chalk.red(' Plan not found'));
      return;
    }
    
    // If --show flag, just display current progress
    if (options.show) {
      displayProgress(plan);
      return;
    }
    
    // If no step specified, show interactive step selection
    let stepNumber = options.step;
    if (!stepNumber) {
      console.log(chalk.blue('\n Select a step to update:'));
      
      const { selectedStep } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedStep',
          message: 'Choose a step:',
          choices: plan.steps.map(step => ({
            name: `${step.order}. ${step.completed ? 'Completed' : 'Not completed'} ${step.title}`,
            value: step.order.toString(),
            short: `Step ${step.order}`
          }))
        }
      ]);
      
      stepNumber = selectedStep;
    }
    
    const stepIndex = parseInt(stepNumber) - 1;
    const step = plan.steps[stepIndex];
    
    if (!step) {
      console.log(chalk.red(` Step ${stepNumber} not found. Plan has ${plan.steps.length} steps.`));
      return;
    }
    
    // Determine what action to take
    let newStatus: boolean;
    if (options.complete && options.incomplete) {
      console.log(chalk.red(' Cannot use --complete and --incomplete together'));
      return;
    } else if (options.complete) {
      newStatus = true;
    } else if (options.incomplete) {
      newStatus = false;
    } else {
      // Interactive choice
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: `Step ${stepNumber}: "${step.title}" is currently ${step.completed ? 'completed' : 'incomplete'}. What would you like to do?`,
          choices: [
            { name: 'Mark as completed ', value: 'complete' },
            { name: 'Mark as incomplete ', value: 'incomplete' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);
      
      if (action === 'cancel') {
        console.log(chalk.yellow(' No changes made'));
        return;
      }
      
      newStatus = action === 'complete';
    }
    
    // Update the step
    const spinner = ora('Updating step status...').start();
    
    try {
      // Simulate saving (later we'll write to file)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const oldStatus = step.completed;
      step.completed = newStatus;
      
      // Recalculate progress
      const completedSteps = plan.steps.filter(s => s.completed).length;
      const totalSteps = plan.steps.length;
      const percentage = Math.round((completedSteps / totalSteps) * 100);
      
      spinner.succeed('Step updated successfully!');
      
      // Show the change
      const statusIcon = newStatus ? chalk.green('✅') : chalk.red('');
      const actionText = newStatus ? chalk.green('completed') : chalk.yellow('incomplete');
      const changeText = oldStatus !== newStatus ? 
        ` (changed from ${oldStatus ? 'completed' : 'incomplete'})` : 
        ' (no change)';
      
      console.log(chalk.blue('\nStep Updated:'));
      console.log(`   ${statusIcon} Step ${stepNumber}: ${step.title}`);
      console.log(`   Status: ${actionText}${chalk.gray(changeText)}`);
      
      // Show updated progress
      const progressBar = createProgressBar(percentage);
      console.log(chalk.blue('\n Updated Progress:'));
      console.log(`   ${progressBar} ${percentage}%`);
      console.log(`   ${chalk.gray('Completed:')} ${completedSteps}/${totalSteps} steps`);
      
      // Show next steps
      if (newStatus && stepIndex < plan.steps.length - 1) {
        const nextStep = plan.steps[stepIndex + 1];
        if (!nextStep.completed) {
          console.log(chalk.gray(`\n Next step: ${nextStep.title}`));
          console.log(chalk.gray(`   Run: code-planner progress ${selectedPlanId} --step ${nextStep.order} --complete`));
        }
      }
      
      // Check if plan is complete
      if (completedSteps === totalSteps) {
        console.log(chalk.green('\n Congratulations! All steps completed!'));
        console.log(chalk.gray('   Consider updating plan status to "completed"'));
      }
      
    } catch (error) {
      spinner.fail('Failed to update step');
      console.error(chalk.red(' Error:'), error);
    }
  });

// Helper function to display current progress
function displayProgress(plan: any) {
  const completedSteps = plan.steps.filter((s: any) => s.completed).length;
  const totalSteps = plan.steps.length;
  const percentage = Math.round((completedSteps / totalSteps) * 100);
  const progressBar = createProgressBar(percentage);
  
  console.log(chalk.blue('\n Current Progress:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`\n${chalk.white.bold(plan.title)}`);
  console.log(`${chalk.gray('Status:')} ${getStatusBadge(plan.status)}`);
  console.log(`\n${progressBar} ${percentage}%`);
  console.log(`${chalk.gray('Completed:')} ${completedSteps}/${totalSteps} steps\n`);
  
  plan.steps.forEach((step: any, index: number) => {
    const statusIcon = step.completed ? chalk.green('✅') : chalk.red('');
    const stepTitle = step.completed ? chalk.gray(step.title) : chalk.white(step.title);
    console.log(`   ${index + 1}. ${statusIcon} ${stepTitle}`);
  });
  
  console.log(chalk.gray('\n─'.repeat(50)));
  console.log(chalk.gray(' Use --step <number> --complete to mark steps as done'));
}

// Helper functions (same as show command)
function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed': return chalk.bgGreen.black(' COMPLETED ');
    case 'in-progress': return chalk.bgBlue.black(' IN PROGRESS ');
    case 'planning': return chalk.bgYellow.black(' PLANNING ');
    case 'paused': return chalk.bgRed.black(' PAUSED ');
    default: return chalk.bgGray.black(' UNKNOWN ');
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
