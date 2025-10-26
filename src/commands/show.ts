import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { FileStorage } from '../storage/FileStorage';
import { ProjectPlan } from '../types';

export const showCommand = new Command('show')
  .description('Show detailed information about a specific plan')
  .argument('[planId]', 'ID or title of the plan to display (optional)')
  .option('-s, --steps', 'Show detailed steps breakdown')
  .option('-f, --files', 'Show file structure details')
  .option('-d, --dependencies', 'Show dependencies information')
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
      
      // If no planId provided, show interactive selection
      if (!planId) {
        console.log(chalk.blue('🔍 Select a plan to view:'));
        
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
          const titleMatches = await storage.findPlansByTitle(planId);
          
          if (titleMatches.length === 0) {
            console.log(chalk.red(`❌ Plan "${planId}" not found.`));
            console.log(chalk.yellow('\n📋 Available plans:'));
            availablePlans.forEach((plan, index) => {
              console.log(`   ${index + 1}. ${chalk.cyan(plan.id)} - ${plan.title}`);
            });
            console.log(chalk.gray('\n💡 Try: code-planner show <plan-id>'));
            console.log(chalk.gray('🔄 Or run: code-planner show (for interactive selection)'));
            return;
          }
          
          if (titleMatches.length === 1) {
            selectedPlanId = titleMatches[0].id;
            console.log(chalk.green(`✅ Found plan: "${titleMatches[0].title}"`));
          } else {
            console.log(chalk.yellow(`🔍 Multiple plans match "${planId}":`));
            
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
      
      console.log(chalk.blue(`📖 Loading plan: ${selectedPlanId}...`));
      
      const spinner = ora('Fetching plan details...').start();
      
      // Load the specific plan
      const plan = await storage.loadPlan(selectedPlanId!);
      
      if (!plan) {
        spinner.fail('Plan not found');
        console.log(chalk.red('❌ Plan could not be loaded'));
        return;
      }
      
      spinner.succeed('Plan loaded successfully!');
      
      // Display plan details
      displayPlanDetails(plan, options);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(chalk.red('❌ Error loading plan:'), errorMessage);
      process.exit(1);
    }
  });

function displayPlanDetails(plan: ProjectPlan, options: any): void {
  // Display plan header
  console.log(chalk.green('\n📋 Plan Details:'));
  console.log(chalk.gray('─'.repeat(70)));
  
  console.log(`\n${chalk.white.bold('📌 ' + plan.title)}`);
  console.log(chalk.gray(`💭 ${plan.description}`));
  console.log(`\n${chalk.gray('🆔 ID:')} ${chalk.cyan(plan.id)}`);
  console.log(`${chalk.gray('📊 Status:')} ${getStatusBadge(plan.status)}`);
  console.log(`${chalk.gray('📅 Created:')} ${plan.createdAt.toLocaleDateString()}`);
  console.log(`${chalk.gray('🔄 Updated:')} ${plan.updatedAt.toLocaleDateString()}`);
  
  // Overview section
  console.log(chalk.yellow('\n🎯 Overview:'));
  console.log(`   ${chalk.gray('Type:')} ${plan.overview.projectType}`);
  console.log(`   ${chalk.gray('Estimated Time:')} ${plan.overview.estimatedTime}`);
  console.log(`   ${chalk.gray('Complexity:')} ${getComplexityBadge(plan.overview.complexity)}`);
  
  // Progress section
  const progressBar = createProgressBar(plan.progress.percentage);
  console.log(chalk.yellow('\n📈 Progress:'));
  console.log(`   ${progressBar} ${plan.progress.percentage}%`);
  console.log(`   ${chalk.gray('Completed:')} ${plan.progress.completedSteps}/${plan.progress.totalSteps} steps`);
  
  // Steps section (always show, but detailed if --steps flag)
  console.log(chalk.yellow('\n📝 Steps:'));
  plan.steps.forEach((step, index) => {
    const statusIcon = step.completed ? chalk.green('✅') : chalk.red('⭕');
    const stepTitle = step.completed ? chalk.gray(step.title) : chalk.white(step.title);
    
    console.log(`   ${index + 1}. ${statusIcon} ${stepTitle}`);
    
    if (options.steps) {
      console.log(`      ${chalk.gray('📄 ' + step.description)}`);
      console.log(`      ${chalk.gray('📁 Files:')} ${step.files.join(', ')}`);
      console.log(`      ${chalk.gray('📦 Dependencies:')} ${step.dependencies.join(', ')}\n`);
    }
  });
  
  // File structure (if --files flag)
  if (options.files) {
    console.log(chalk.yellow('\n📁 File Structure:'));
    console.log(chalk.gray('   📂 Directories:'));
    plan.fileStructure.directories.forEach(dir => {
      console.log(`      📂 ${dir}`);
    });
    console.log(chalk.gray('   📄 Files:'));
    plan.fileStructure.files.forEach(file => {
      console.log(`      📄 ${file}`);
    });
  }
  
  // Dependencies (if --dependencies flag)
  if (options.dependencies) {
    console.log(chalk.yellow('\n📦 Dependencies:'));
    console.log(chalk.gray('   📦 NPM Packages:'));
    plan.dependencies.npm.forEach(pkg => {
      console.log(`      📦 ${pkg}`);
    });
    console.log(chalk.gray('   🌐 APIs:'));
    plan.dependencies.apis.forEach(api => {
      console.log(`      🌐 ${api}`);
    });
    console.log(chalk.gray('   ☁️  Services:'));
    plan.dependencies.services.forEach(service => {
      console.log(`      ☁️  ${service}`);
    });
  }
  
  // Footer with helpful commands
  console.log(chalk.gray('\n─'.repeat(70)));
  console.log(chalk.gray('💡 Next steps:'));
  console.log(chalk.gray(`   ▶️  code-planner progress ${plan.id} --step 1 --complete`));
  console.log(chalk.gray(`   📖 code-planner show ${plan.id} --steps --files --dependencies`));
  console.log(chalk.gray(`   📋 code-planner list --status ${plan.status}`));
}

// Helper functions
function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.bgGreen.black(' ✅ COMPLETED ');
    case 'in-progress':
      return chalk.bgBlue.black(' 🔄 IN PROGRESS ');
    case 'planning':
      return chalk.bgYellow.black(' 📋 PLANNING ');
    case 'paused':
      return chalk.bgRed.black(' ⏸️  PAUSED ');
    default:
      return chalk.bgGray.black(' ❓ UNKNOWN ');
  }
}

function getComplexityBadge(complexity: string): string {
  switch (complexity) {
    case 'low':
      return chalk.green('🟢 LOW');
    case 'medium':
      return chalk.yellow('🟡 MEDIUM');
    case 'high':
      return chalk.red('🔴 HIGH');
    default:
      return chalk.gray('⚪ UNKNOWN');
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
