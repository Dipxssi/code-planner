import { PlannerConfig } from '../types';
import { FileStorage } from '../storage/FileStorage';
import chalk from 'chalk';

export class ConfigManager {
  private storage: FileStorage;

  constructor() {
    this.storage = new FileStorage();
  }

  async loadConfig(): Promise<PlannerConfig> {
    return await this.storage.loadConfig();
  }

  async saveConfig(config: PlannerConfig): Promise<void> {
    await this.storage.saveConfig(config);
  }

  async ensureApiKey(): Promise<string> {
    const config = await this.loadConfig();
    
    if (!config.geminiApiKey) {
      console.log(chalk.yellow('\n⚠️  Gemini API key not found!'));
      console.log(chalk.gray('Get your free API key from: https://aistudio.google.com/app/apikey'));
      console.log(chalk.gray('Set it with: export GEMINI_API_KEY="your-key-here"'));
      console.log(chalk.gray('Or run: code-planner config --set-api-key\n'));
      
      // Check environment variable as fallback
      const envKey = process.env.GEMINI_API_KEY;
      if (envKey) {
        console.log(chalk.green('✓ Using API key from environment variable'));
        return envKey;
      }
      
      throw new Error('Gemini API key is required for AI-powered planning');
    }
    
    return config.geminiApiKey;
  }

  async setApiKey(apiKey: string): Promise<void> {
    const config = await this.loadConfig();
    config.geminiApiKey = apiKey;
    await this.saveConfig(config);
    console.log(chalk.green('✓ API key saved successfully!'));
  }

  async initConfig(): Promise<void> {
    const config = await this.loadConfig();
    
    // Set defaults if not present
    if (!config.defaultOutputDir) {
      config.defaultOutputDir = process.cwd();
    }
    
    if (!config.maxPlans) {
      config.maxPlans = 50;
    }
    
    await this.saveConfig(config);
  }
}
