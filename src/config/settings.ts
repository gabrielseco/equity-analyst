import { existsSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import type { Config } from '../models/types';

const CONFIG_FILENAME = '.equity-analyst.config.json';

/**
 * Get the config file path. Checks project root first, then home directory.
 */
export function getConfigPath(): string {
  const projectConfig = join(process.cwd(), CONFIG_FILENAME);
  if (existsSync(projectConfig)) {
    return projectConfig;
  }
  return join(homedir(), CONFIG_FILENAME);
}

/**
 * Load config from file, returns empty object if not found
 */
export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();

  try {
    if (existsSync(configPath)) {
      const file = Bun.file(configPath);
      const content = await file.text();
      return JSON.parse(content) as Config;
    }
  } catch (error) {
    console.warn(
      `Warning: Failed to load config from ${configPath}:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  return {};
}

/**
 * Save config to file
 */
export async function saveConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();

  try {
    await Bun.write(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(
      `Failed to save config to ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Update config with partial changes
 */
export async function updateConfig(updates: Partial<Config>): Promise<Config> {
  const config = await loadConfig();
  const newConfig = { ...config, ...updates };

  await saveConfig(newConfig);
  return newConfig;
}

/**
 * Get API keys from environment variables
 */
export async function getApiKeys(): Promise<{
  anthropic: string;
  alphaVantage: string;
}> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!anthropicKey) {
    throw new Error(
      'Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.'
    );
  }

  if (!alphaVantageKey) {
    throw new Error(
      'Alpha Vantage API key not found. Set ALPHA_VANTAGE_API_KEY environment variable.'
    );
  }

  return {
    anthropic: anthropicKey,
    alphaVantage: alphaVantageKey,
  };
}

/**
 * Resolve path, expanding ~ to home directory
 */
function resolvePath(path: string): string {
  if (path.startsWith('~/')) {
    return join(homedir(), path.slice(2));
  }
  return resolve(path);
}

/**
 * Get default reports directory
 */
export async function getDefaultReportsDir(): Promise<string> {
  const config = await loadConfig();
  const defaultPath = config.defaultReportsDir || './reports';
  return resolvePath(defaultPath);
}

/**
 * Get default AI model
 */
export async function getDefaultModel(): Promise<'haiku' | 'sonnet' | 'opus'> {
  const config = await loadConfig();
  return config.defaultModel || 'sonnet';
}

/**
 * Get Alpha Vantage API delay in milliseconds
 */
export async function getAlphaVantageApiDelay(): Promise<number> {
  const config = await loadConfig();
  return config.alphaVantageApiDelayMs || 12000; // Default: 12 seconds (5 calls per minute)
}
