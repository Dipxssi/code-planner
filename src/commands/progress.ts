import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { FileStorage } from '../storage/FileStorage';
import { ProjectPlan, PlanStep } from '../types';

export const progressCommand = new Command('progress')
  .description('Update step completion status for a plan')
  .argument('[planId]', 'ID or title of the plan to update (optional)')
  .option('-s, --step <stepNumber>', 'Step number to update (1, 2, 3, etc.)')
  .option('-c, --complete', 'Mark step as completed')
  .option ('-i, --incomplete', 'Mark step as incomplete')
  .option('--show', 'Show current progress without updating')
  .action(async (planId: string | undefined, options) => {
    
    const storage = new FileStorage();
    
    try {
      // Load all plans
      const availablePlans = await storage.listPlans();
      
      if (availablePlans.length === 0) {
        console.log(chalk.yellow('📝 No plans found'));
        console.log(chalk.gray('💡 Create your first plan with: code-planner create "your task"'));
        return;
      }
      
      let selectedPlanId = planId;
      
      // Plan selection logic (same as show command)
      if (!planId) {
        console.log(chalk.blue('🎯 Select a plan to update progress:'));
        
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
        // Fuzzy matching logic
        const exactMatch = availablePlans.find(plan => plan.id === planId);
        
        if (!exactMatch) {
          const titleMatches = await storage.findPlansByTitle(planId);
          
          if (titleMatches.length === 0) {
            console.log(chalk.red(`❌ Plan "${planId}" not found.`));
            console.log(chalk.yellow('\n📋 Available plans:'));
            availablePlans.forEach((plan, index) => {
              console.log(`   ${index + 1}. ${chalk.cyan(plan.id)} - ${plan.title}`);
            });
            return;
          }
          
          if (titleMatches.length === 1) {
            selectedPlanId = titleMatches[0].id;
            console.log(chalk.green(`✅ Found plan: "${titleMatches[0].title}"`));
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
      
      // Load the selected plan
      const plan = await storage.loadPlan(selectedPlanId!);
      if (!plan) {
        console.log(chalk.red('❌ Plan not found'));
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
        console.log(chalk.blue('\n📝 Select a step to update:'));
        
        const { selectedStep } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedStep',
            message: 'Choose a step:',
            choices: plan.steps.map(step => ({
              name: `${step.order}. ${step.completed ? '✅ Completed' : '⭕ Not completed'} - ${step.title}`,
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
        console.log(chalk.red(`❌ Step ${stepNumber} not found. Plan has ${plan.steps.length} steps.`));
        return;
      }
      
      // Determine what action to take
      let newStatus: boolean;
      if (options.complete && options.incomplete) {
        console.log(chalk.red('❌ Cannot use --complete and --incomplete together'));
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
              { name: '✅ Mark as completed', value: 'complete' },
              { name: '⭕ Mark as incomplete', value: 'incomplete' },
              { name: '🚫 Cancel', value: 'cancel' }
            ]
          }
        ]);
        
        if (action === 'cancel') {
          console.log(chalk.yellow('🚫 No changes made'));
          return;
        }
        
        newStatus = action === 'complete';
      }
      
      // Update the step
      const spinner = ora('🔄 Updating step status...').start();
      
      try {
        const oldStatus = step.completed;
        step.completed = newStatus;
        
        // Save updated plan
        await storage.updatePlan(plan);
        
        spinner.succeed('✅ Step updated successfully!');
        
        // Show the change
        const statusIcon = newStatus ? chalk.green('✅') : chalk.red('⭕');
        const actionText = newStatus ? chalk.green('completed') : chalk.yellow('incomplete');
        const changeText = oldStatus !== newStatus ? 
          ` (changed from ${oldStatus ? 'completed' : 'incomplete'})` : 
          ' (no change)';
        
        console.log(chalk.blue('\n🎯 Step Updated:'));
        console.log(`   ${statusIcon} Step ${stepNumber}: ${step.title}`);
        console.log(`   Status: ${actionText}${chalk.gray(changeText)}`);
        
        // Show updated progress
        const progressBar = createProgressBar(plan.progress.percentage);
        console.log(chalk.blue('\n📈 Updated Progress:'));
        console.log(`   ${progressBar} ${plan.progress.percentage}%`);
        console.log(`   ${chalk.gray('Completed:')} ${plan.progress.completedSteps}/${plan.progress.totalSteps} steps`);
        
        // Show next steps
        if (newStatus && stepIndex < plan.steps.length - 1) {
          const nextStep = plan.steps[stepIndex + 1];
          if (!nextStep.completed) {
            console.log(chalk.gray(`\n➡️  Next step: ${nextStep.title}`));
            console.log(chalk.gray(`   💡 Run: code-planner progress ${selectedPlanId} --step ${nextStep.order} --complete`));
          }
        }
        
        // Check if plan is complete
        if (plan.progress.completedSteps === plan.progress.totalSteps) {
          console.log(chalk.green('\n🎉 Congratulations! All steps completed!'));
          console.log(chalk.gray('   💡 Consider updating plan status to "completed"'));
        }
        
      } catch (error: unknown) {
        spinner.fail('❌ Failed to update step');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(chalk.red('❌ Error:'), errorMessage);
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(chalk.red('❌ Error:'), errorMessage);
      process.exit(1);
    }
  });

// Helper function to display current progress
function displayProgress(plan: ProjectPlan): void {
  const progressBar = createProgressBar(plan.progress.percentage);
  
  console.log(chalk.blue('\n📊 Current Progress:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`\n${chalk.white.bold('📌 ' + plan.title)}`);
  console.log(`${chalk.gray('📊 Status:')} ${getStatusBadge(plan.status)}`);
  console.log(`\n${progressBar} ${plan.progress.percentage}%`);
  console.log(`${chalk.gray('✅ Completed:')} ${plan.progress.completedSteps}/${plan.progress.totalSteps} steps\n`);
  
  plan.steps.forEach((step, index) => {
    const statusIcon = step.completed ? chalk.green('✅') : chalk.red('⭕');
    const stepTitle = step.completed ? chalk.gray(step.title) : chalk.white(step.title);
    console.log(`   ${index + 1}. ${statusIcon} ${stepTitle}`);
  });
  
  console.log(chalk.gray('\n─'.repeat(60)));
  console.log(chalk.gray('💡 Use --step <number> --complete to mark steps as done'));
}

// Helper functions (same as show command)
function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed': return chalk.bgGreen.black(' ✅ COMPLETED ');
    case 'in-progress': return chalk.bgBlue.black(' 🔄 IN PROGRESS ');
    case 'planning': return chalk.bgYellow.black(' 📋 PLANNING ');
    case 'paused': return chalk.bgRed.black(' ⏸️  PAUSED ');
    default: return chalk.bgGray.black(' ❓ UNKNOWN ');
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
