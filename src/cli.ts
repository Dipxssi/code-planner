#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createCommand } from './commands/create';
 import { listCommand } from './commands/list';
// import { showCommand } from './commands/show';
// import { progressCommand } from './commands/progress';

const program = new Command();

program
  .name('code-planner')
  .description('AI-powered planning layer for coding tasks')
  .version('1.0.0');

// Add commands
 program.addCommand(createCommand);
 program.addCommand(listCommand);
// program.addCommand(showCommand);
// program.addCommand(progressCommand);

// Custom help
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan('Examples:'));
  console.log('  $ code-planner create "Build a todo app with authentication"');
  console.log('  $ code-planner list');
  console.log('  $ code-planner show my-plan-id');
  console.log('  $ code-planner progress my-plan-id --step 1 --complete');
});

// Parse command line arguments
program.parse();
