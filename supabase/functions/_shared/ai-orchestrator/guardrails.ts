import { GuardrailsConfig, LLMRun } from './types.ts';

export class Guardrails {
  private config: GuardrailsConfig;
  private taskCosts = new Map<string, number>();
  private projectCosts = new Map<string, number>();
  private orgCosts = new Map<string, number>();

  constructor(config: GuardrailsConfig) {
    // Apply higher default limits for PDF processing if not specified
    this.config = {
      maxTokensPerTask: config.maxTokensPerTask || 150000, // Increased for PDF processing
      maxCostPerTask: config.maxCostPerTask || 5.0, // Increased for complex AI analysis
      maxCostPerProject: config.maxCostPerProject || 50.0,
      maxCostPerOrganization: config.maxCostPerOrganization || 500.0,
      timeoutMs: config.timeoutMs || 120000, // Increased timeout for PDF processing
      maxRetries: config.maxRetries || 3,
    };
  }

  async checkPreExecution(
    taskId: string,
    projectId?: string,
    organizationId?: string,
    estimatedTokens?: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    
    // Check token limits
    if (estimatedTokens && estimatedTokens > this.config.maxTokensPerTask) {
      return {
        allowed: false,
        reason: `Estimated tokens (${estimatedTokens}) exceed task limit (${this.config.maxTokensPerTask})`
      };
    }

    // Check cost limits
    const estimatedCost = estimatedTokens ? (estimatedTokens / 1000) * 0.03 : 0;
    
    if (estimatedCost > this.config.maxCostPerTask) {
      return {
        allowed: false,
        reason: `Estimated cost ($${estimatedCost.toFixed(4)}) exceeds task limit ($${this.config.maxCostPerTask})`
      };
    }

    if (projectId) {
      const projectCost = this.projectCosts.get(projectId) || 0;
      if (projectCost + estimatedCost > this.config.maxCostPerProject) {
        return {
          allowed: false,
          reason: `Project cost would exceed limit ($${this.config.maxCostPerProject})`
        };
      }
    }

    if (organizationId) {
      const orgCost = this.orgCosts.get(organizationId) || 0;
      if (orgCost + estimatedCost > this.config.maxCostPerOrganization) {
        return {
          allowed: false,
          reason: `Organization cost would exceed limit ($${this.config.maxCostPerOrganization})`
        };
      }
    }

    return { allowed: true };
  }

  updateCosts(
    taskId: string,
    cost: number,
    projectId?: string,
    organizationId?: string
  ): void {
    // Update task cost
    this.taskCosts.set(taskId, (this.taskCosts.get(taskId) || 0) + cost);

    // Update project cost
    if (projectId) {
      this.projectCosts.set(projectId, (this.projectCosts.get(projectId) || 0) + cost);
    }

    // Update organization cost
    if (organizationId) {
      this.orgCosts.set(organizationId, (this.orgCosts.get(organizationId) || 0) + cost);
    }
  }

  getCosts(): {
    tasks: Record<string, number>;
    projects: Record<string, number>;
    organizations: Record<string, number>;
  } {
    return {
      tasks: Object.fromEntries(this.taskCosts),
      projects: Object.fromEntries(this.projectCosts),
      organizations: Object.fromEntries(this.orgCosts)
    };
  }

  async withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs || this.config.timeoutMs;
    
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      )
    ]);
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    delay = 1000
  ): Promise<T> {
    const retries = maxRetries || this.config.maxRetries;
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          throw lastError;
        }

        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    throw lastError!;
  }

  // Circuit breaker pattern
  private circuitBreakers = new Map<string, {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
  }>();

  async withCircuitBreaker<T>(
    provider: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(provider) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const
    };

    const now = Date.now();
    const cooldownPeriod = 60000; // 1 minute
    const failureThreshold = 5;

    // Check circuit breaker state
    if (breaker.state === 'open') {
      if (now - breaker.lastFailure > cooldownPeriod) {
        breaker.state = 'half-open';
      } else {
        throw new Error(`Circuit breaker open for provider ${provider}`);
      }
    }

    try {
      const result = await operation();
      
      // Reset on success
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        breaker.failures = 0;
      }
      
      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailure = now;

      if (breaker.failures >= failureThreshold) {
        breaker.state = 'open';
      }

      this.circuitBreakers.set(provider, breaker);
      throw error;
    }
  }
}