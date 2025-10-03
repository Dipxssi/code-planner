import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { CreatePlanOptions } from '../types';

export const createCommand = new Command('create')
  .description('Create a new coding plan from task description')
  .argument('<task>', 'Description of the coding task')
  .option('-t, --type <type>', 'Project type (frontend/backend/fullstack)')
  .option('-f, --framework <framework>', 'Preferred framework')
  .option('-i, --interactive', 'Ask interactive questions')

  .action(async (task: string, options: CreatePlanOptions) => {
    console.log(chalk.blue('Creating your coding plan...'));
    
    const spinner = ora('Analyzing your task...').start();
    
    try {
      // Simulate AI processing for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      spinner.succeed('Task analyzed successfully!');
      
      console.log(chalk.green('\n Plan Created:'));
      console.log(chalk.white(` Task: ${task}`));
      
      if (options.projectType) {
        console.log(chalk.white(` Type: ${options.projectType}`));
      }
      
      if (options.framework) {
        console.log(chalk.white(` Framework: ${options.framework}`));
      }
      
      if (options.interactive) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addDetails',
            message: 'Would you like to add more project details?',
            default: false
          }
        ]);
        
        if (answers.addDetails) {
          console.log(chalk.yellow(' Interactive mode coming soon!'));
        }
      }
      
      console.log(chalk.gray('\n Plan saved as: plan-' + Date.now()));
      console.log(chalk.gray(' Use "code-planner list" to see all plans'));
      
    } catch (error) {
      spinner.fail('Failed to create plan');
      console.error(chalk.red('Error:'), error);
    }
  });
