import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { FileStorage } from '../storage/FileStorage';

export const listCommand = new Command('list')
  .description('List all saved coding plans')
  .option('-s, --status <status>', 'Filter by status (planning/in-progress/completed/paused)')
  .option('-l, --limit <number>', 'Maximum number of plans to show', '10')
  .action(async (options) => {
    console.log(chalk.blue('📚 Loading your plans...'));
    
    const storage = new FileStorage();
    const spinner = ora('Fetching plans...').start();
    
    try {
      // Load real plans from storage
      let plans = await storage.listPlans();
      
      spinner.succeed('Plans loaded!');
      
      // Filter by status if provided
      if (options.status) {
        plans = plans.filter(plan => plan.status === options.status);
      }
      
      // Limit results
      const limit = parseInt(options.limit);
      plans = plans.slice(0, limit);
      
      if (plans.length === 0) {
        console.log(chalk.yellow('\n📝 No plans found'));
        if (options.status) {
          console.log(chalk.gray(`   No plans with status: ${options.status}`));
        }
        console.log(chalk.gray('💡 Create your first plan with: code-planner create "your task"'));
        return;
      }
      
      console.log(chalk.green(`\n📋 Found ${plans.length} plan(s):`));
      console.log(chalk.gray('─'.repeat(70)));
      
      plans.forEach((plan, index) => {
        const statusColor = getStatusColor(plan.status);
        const progressBar = createProgressBar(plan.progress.percentage);
        
        console.log(`\n${index + 1}. ${chalk.white.bold(plan.title)}`);
        console.log(`   ${chalk.gray('ID:')} ${chalk.cyan(plan.id)}`);
        console.log(`   ${chalk.gray('Status:')} ${statusColor(plan.status.toUpperCase())}`);
        console.log(`   ${chalk.gray('Created:')} ${plan.createdAt.toLocaleDateString()}`);
        console.log(`   ${chalk.gray('Progress:')} ${progressBar} ${plan.progress.percentage}% (${plan.progress.completedSteps}/${plan.progress.totalSteps})`);
      });
      
      console.log(chalk.gray('\n─'.repeat(70)));
      console.log(chalk.gray('💡 Use "code-planner show <plan-id>" to view details'));
      console.log(chalk.gray('⚡ Use "code-planner progress <plan-id>" to update progress'));
      
    } catch (error: unknown) { // Fixed TypeScript error
      spinner.fail('Failed to load plans');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(chalk.red('❌ Error:'), errorMessage);
      process.exit(1);
    }
  });

// Helper functions (same as before)
function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return chalk.green;
    case 'in-progress': return chalk.blue;
    case 'planning': return chalk.yellow;
    case 'paused': return chalk.red;
    default: return chalk.gray;
  }
}

function createProgressBar(percentage: number): string {
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  
  return chalk.green(filled) + chalk.gray(empty);
}
