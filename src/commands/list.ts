import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

export const listCommand = new Command('list')
  .description('List all saved coding plans')
  .option('-s, --status <status>', 'Filter by status (planning/in-progress/completed/paused)')
  .option('-l, --limit <number>', 'Maximum number of plans to show', '10')
  .action(async (options) => {
    console.log(chalk.blue(' Loading your plans...'));
    
    const spinner = ora('Fetching plans...').start();
    
    try {
      // Simulate loading plans for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      spinner.succeed('Plans loaded!');
      
      // Mock data for now (later we'll load from files)
      const mockPlans = [
        {
          id: 'todo-app-' + Date.now(),
          title: 'Build a todo app',
          status: 'in-progress',
          createdAt: new Date(),
          progress: { percentage: 60, completedSteps: 3, totalSteps: 5 }
        },
        {
          id: 'rest-api-' + (Date.now() - 100000),
          title: 'Build a REST API',
          status: 'completed',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          progress: { percentage: 100, completedSteps: 4, totalSteps: 4 }
        },
        {
          id: 'react-dashboard-' + (Date.now() - 200000),
          title: 'Build a React dashboard',
          status: 'planning',
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          progress: { percentage: 0, completedSteps: 0, totalSteps: 6 }
        }
      ];
      
      // Filter by status if provided
      let filteredPlans = mockPlans;
      if (options.status) {
        filteredPlans = mockPlans.filter(plan => plan.status === options.status);
      }
      
      // Limit results
      const limit = parseInt(options.limit);
      filteredPlans = filteredPlans.slice(0, limit);
      
      if (filteredPlans.length === 0) {
        console.log(chalk.yellow('\n No plans found'));
        console.log(chalk.gray(' Create your first plan with: code-planner create "your task"'));
        return;
      }
      
      console.log(chalk.green(`\n Found ${filteredPlans.length} plan(s):`));
      console.log(chalk.gray('─'.repeat(60)));
      
      filteredPlans.forEach((plan, index) => {
        const statusColor = getStatusColor(plan.status);
        const progressBar = createProgressBar(plan.progress.percentage);
        
        console.log(`\n${index + 1}. ${chalk.white.bold(plan.title)}`);
        console.log(`   ${chalk.gray('ID:')} ${chalk.cyan(plan.id)}`);
        console.log(`   ${chalk.gray('Status:')} ${statusColor(plan.status.toUpperCase())}`);
        console.log(`   ${chalk.gray('Created:')} ${plan.createdAt.toLocaleDateString()}`);
        console.log(`   ${chalk.gray('Progress:')} ${progressBar} ${plan.progress.percentage}% (${plan.progress.completedSteps}/${plan.progress.totalSteps})`);
      });
      
      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(chalk.gray(' Use "code-planner show <plan-id>" to view details'));
      
    } catch (error) {
      spinner.fail('Failed to load plans');
      console.error(chalk.red('Error:'), error);
    }
  });

// Helper function to get status colors
function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return chalk.green;
    case 'in-progress': return chalk.blue;
    case 'planning': return chalk.yellow;
    case 'paused': return chalk.red;
    default: return chalk.gray;
  }
}

// Helper function to create progress bar
function createProgressBar(percentage: number): string {
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  
  return chalk.green(filled) + chalk.gray(empty);
}
