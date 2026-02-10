/**
 * AgentStateMachine - FSM for agent lifecycle management
 * States: pending → running → awaiting_approval → running → completed | failed
 * 
 * PR-1: Extended with awaiting_approval state for contract-first workflow
 * 
 * State Transitions:
 * - pending → running (start)
 * - running → awaiting_approval (awaitApproval)
 * - awaiting_approval → running (resume - after approval)
 * - awaiting_approval → failed (reject)
 * - running → completed (complete)
 * - pending/running/awaiting_approval → failed (fail)
 */

export type AgentState = 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval';

export class AgentStateMachine {
  private state: AgentState;

  constructor(initialState: AgentState = 'pending') {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Transition to running state
   * Only valid from pending or awaiting_approval
   */
  start(): void {
    if (this.state !== 'pending') {
      throw new Error(`Cannot start: agent is in ${this.state} state`);
    }
    this.state = 'running';
  }

  /**
   * PR-1: Transition to awaiting_approval state
   * Only valid from running (after plan generation)
   */
  awaitApproval(): void {
    if (this.state !== 'running') {
      throw new Error(`Cannot await approval: agent is in ${this.state} state`);
    }
    this.state = 'awaiting_approval';
  }

  /**
   * PR-1: Resume running from awaiting_approval (after approval)
   * Only valid from awaiting_approval
   */
  resume(): void {
    if (this.state !== 'awaiting_approval') {
      throw new Error(`Cannot resume: agent is in ${this.state} state`);
    }
    this.state = 'running';
  }

  /**
   * Transition to completed state
   * Only valid from running
   */
  complete(): void {
    if (this.state !== 'running') {
      throw new Error(`Cannot complete: agent is in ${this.state} state`);
    }
    this.state = 'completed';
  }

  /**
   * Transition to failed state
   * Valid from pending, running, or awaiting_approval
   */
  fail(): void {
    if (this.state !== 'pending' && this.state !== 'running' && this.state !== 'awaiting_approval') {
      throw new Error(`Cannot fail: agent is in ${this.state} state`);
    }
    this.state = 'failed';
  }

  /**
   * Check if agent is in terminal state
   */
  isTerminal(): boolean {
    return this.state === 'completed' || this.state === 'failed';
  }

  /**
   * PR-1: Check if agent is awaiting approval
   */
  isAwaitingApproval(): boolean {
    return this.state === 'awaiting_approval';
  }
}

