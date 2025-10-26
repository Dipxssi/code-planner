import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/ConfigManager';

export const configCommand = new Command('config')
  .description('Manage codePlanner configuration')
  .option('--set-api-key', 'Set your Gemini API key interactively')
  .option('--show', 'Show current configuration')
  .option('--reset', 'Reset configuration to defaults')
  .action(async (options) => {
    
    const configManager = new ConfigManager();
    
    try {
      if (options.setApiKey) {
        await setApiKeyInteractive(configManager);
      } else if (options.show) {
        await showConfig(configManager);
      } else if (options.reset) {
        await resetConfig(configManager);
      } else {
        // Default: show setup guide
        await showSetupGuide(configManager);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(chalk.red('❌ Configuration error:'), errorMessage);
      process.exit(1);
    }
  });

async function setApiKeyInteractive(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('🔑 Setting up your Gemini API key...\n'));
  
  console.log(chalk.yellow('📋 To get your FREE API key:'));
  console.log(chalk.gray('   1. Visit: https://aistudio.google.com/app/apikey'));
  console.log(chalk.gray('   2. Sign in with your Google account'));
  console.log(chalk.gray('   3. Click "Create API Key"'));
  console.log(chalk.gray('   4. Copy the generated key\n'));
  
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your Gemini API key:',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'API key cannot be empty';
        }
        if (input.length < 20) {
          return 'API key seems too short. Please check and try again.';
        }
        return true;
      }
    }
  ]);
  
  const spinner = ora('💾 Saving API key...').start();
  
  try {
    await configManager.setApiKey(apiKey.trim());
    spinner.succeed('✅ API key saved successfully!');
    
    console.log(chalk.green('\n🎉 Configuration complete!'));
    console.log(chalk.gray('💡 You can now create AI-powered plans with: code-planner create "your task"'));
  } catch (error: unknown) {
    spinner.fail('❌ Failed to save API key');
    throw error;
  }
}

async function showConfig(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('⚙️  Current Configuration:\n'));
  
  const config = await configManager.loadConfig();
  
  console.log(`${chalk.gray('🔑 API Key:')} ${config.geminiApiKey ? 
    chalk.green('✅ Set (hidden)') : 
    chalk.red('❌ Not set')}`);
  console.log(`${chalk.gray('📁 Output Directory:')} ${config.defaultOutputDir}`);
  console.log(`${chalk.gray('📊 Max Plans:')} ${config.maxPlans}`);
  
  // Check environment variable fallback
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && !config.geminiApiKey) {
    console.log(`${chalk.gray('🌍 Environment API Key:')} ${chalk.blue('✅ Available')}`);
  }
  
  if (!config.geminiApiKey && !envKey) {
    console.log(chalk.yellow('\n⚠️  No API key configured!'));
    console.log(chalk.gray('💡 Run: code-planner config --set-api-key'));
  }
}

async function resetConfig(configManager: ConfigManager): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset all configuration?',
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('🚫 Configuration reset cancelled'));
    return;
  }
  
  const spinner = ora('🔄 Resetting configuration...').start();
  
  const defaultConfig = {
    defaultOutputDir: process.cwd(),
    maxPlans: 50
  };
  
  await configManager.saveConfig(defaultConfig);
  spinner.succeed('✅ Configuration reset to defaults');
}

async function showSetupGuide(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('🚀 codePlanner Configuration\n'));
  
  const config = await configManager.loadConfig();
  const hasApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  
  if (hasApiKey) {
    console.log(chalk.green('✅ You\'re all set up!\n'));
    console.log(chalk.gray('Available commands:'));
    console.log(chalk.gray('   code-planner create "build a todo app"'));
    console.log(chalk.gray('   code-planner list'));
    console.log(chalk.gray('   code-planner config --show'));
  } else {
    console.log(chalk.yellow('🔑 API Key Setup Required\n'));
    console.log(chalk.gray('To enable AI-powered planning:'));
    console.log(chalk.cyan('   code-planner config --set-api-key\n'));
    
    console.log(chalk.gray('Or set environment variable:'));
    console.log(chalk.cyan('   export GEMINI_API_KEY="your-api-key-here"\n'));
    
    console.log(chalk.gray('You can still use basic planning without API key:'));
    console.log(chalk.cyan('   code-planner create "your task" --no-ai'));
  }
  
  console.log(chalk.gray('\nFor help: code-planner --help'));
}
