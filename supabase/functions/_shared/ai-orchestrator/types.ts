// Types for AI Orchestrator
export interface LLMProvider {
  name: 'openai' | 'anthropic' | 'google';
  complete(input: string | DocumentInput, options?: LLMOptions): Promise<LLMResponse>;
  getCost(inputTokens: number, outputTokens: number): number;
}

export interface DocumentInput {
  type: 'pdf';
  data: ArrayBuffer;
  filename: string;
}

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  jsonSchema?: any;
  stopSequences?: string[];
}

export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface OrchestrationPolicy {
  type: 'single-source' | 'self-consistency' | 'cross-critique';
  providers?: ('openai' | 'anthropic' | 'google')[];
  runs?: number; // For self-consistency
  primaryProvider?: 'openai' | 'anthropic' | 'google';
}

export interface TaskInput {
  input: string | DocumentInput;
  schema?: any;
  context?: Record<string, any>;
  policy: OrchestrationPolicy;
  options?: LLMOptions;
}

export interface TaskOutput<T = any> {
  result: T;
  metadata: {
    policy: OrchestrationPolicy;
    runs: LLMRun[];
    totalCost: number;
    totalLatencyMs: number;
    cacheHit: boolean;
    qualityScore?: number;
  };
}

export interface LLMRun {
  id: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  success: boolean;
  error?: string;
  promptHash: string;
  cacheHit: boolean;
  createdAt: string;
}

export interface GuardrailsConfig {
  maxTokensPerTask: number;
  maxCostPerTask: number;
  maxCostPerProject: number;
  maxCostPerOrganization: number;
  timeoutMs: number;
  maxRetries: number;
}