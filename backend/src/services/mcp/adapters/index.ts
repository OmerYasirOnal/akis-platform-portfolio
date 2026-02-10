/**
 * MCP Adapters - Barrel export
 * Phase 10: Full MCP client implementations for GitHub, Jira, Confluence
 */

import type { GitHubMCPService } from './GitHubMCPService.js';
import type { JiraMCPService } from './JiraMCPService.js';
import type { ConfluenceMCPService } from './ConfluenceMCPService.js';

// Service exports
export { GitHubMCPService } from './GitHubMCPService.js';
export { JiraMCPService } from './JiraMCPService.js';
export { ConfluenceMCPService } from './ConfluenceMCPService.js';

// Error exports
export { McpError, McpConnectionError, McpErrorCode } from './GitHubMCPService.js';

// Options exports
export type { GitHubMCPServiceOptions } from './GitHubMCPService.js';
export type { JiraMCPServiceOptions, JiraIssue, JiraIssueCreateFields, JiraComment } from './JiraMCPService.js';
export type { ConfluenceMCPServiceOptions, ConfluencePage, ConfluenceSpace, ConfluenceSearchResult } from './ConfluenceMCPService.js';

/**
 * MCPTools - Typed bag of MCP adapters for injection into agents
 * Orchestrator provides this to agents at runtime
 */
export interface MCPTools {
  githubMCP?: GitHubMCPService;
  jiraMCP?: JiraMCPService;
  confluenceMCP?: ConfluenceMCPService;
}
