import { z } from 'zod';

/**
 * AgentContract - Input/output schema expectations for agents
 * Uses Zod for runtime validation
 */

export abstract class AgentContract<TInput = unknown, TOutput = unknown> {
  /**
   * Input schema validation
   */
  abstract inputSchema: z.ZodSchema<TInput>;

  /**
   * Output schema validation
   */
  abstract outputSchema: z.ZodSchema<TOutput>;

  /**
   * Validate input against contract
   */
  validateInput(input: unknown): TInput {
    return this.inputSchema.parse(input);
  }

  /**
   * Validate output against contract
   */
  validateOutput(output: unknown): TOutput {
    return this.outputSchema.parse(output);
  }
}

