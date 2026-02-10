import { HttpClient } from '../../http/HttpClient.js';
import { atlassianOAuthService } from '../../atlassian/index.js';
import { getEnv } from '../../../config/env.js';

/**
 * ConfluenceMCPService - MCP client adapter for Confluence
 * Phase 10: Full MCP JSON-RPC 2.0 implementation
 * Provides high-level methods that internally use JSON-RPC 2.0 to Confluence MCP endpoint
 * 
 * Supports OAuth 2.0 (3LO) tokens via fromOAuth factory method
 */

export interface ConfluenceMCPServiceOptions {
  baseUrl: string;
  token?: string;
  httpClient?: HttpClient;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: unknown;
  id: string | number;
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

// =============================================================================
// Confluence Types
// =============================================================================

export interface ConfluencePage {
  id: string;
  title: string;
  spaceKey: string;
  content: string;
  version?: number;
  status?: 'current' | 'draft' | 'archived';
  url?: string;
  created?: string;
  updated?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ConfluenceSpace {
  key: string;
  name: string;
  description?: string;
  type: 'global' | 'personal';
}

export interface ConfluenceSearchResult {
  id: string;
  title: string;
  spaceKey: string;
  excerpt?: string;
  url?: string;
}

// =============================================================================
// ConfluenceMCPService Class
// =============================================================================

/**
 * Confluence MCP Service - adapter for Confluence MCP server
 * Used by Scribe agent for documentation
 */
export class ConfluenceMCPService {
  private baseUrl: string;
  private token?: string;
  private httpClient: HttpClient;
  private requestId: number = 1;

  constructor(opts: ConfluenceMCPServiceOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = opts.token;
    this.httpClient = opts.httpClient || new HttpClient();
  }

  /**
   * Factory method to create ConfluenceMCPService using Atlassian OAuth tokens
   * @param userId - AKIS user ID
   * @returns ConfluenceMCPService instance or null if OAuth is not available
   */
  static async fromOAuth(userId: string): Promise<ConfluenceMCPService | null> {
    const env = getEnv();
    
    if (!env.ATLASSIAN_MCP_BASE_URL) {
      return null;
    }

    const token = await atlassianOAuthService.getValidToken(userId);
    if (!token) {
      return null;
    }

    return new ConfluenceMCPService({
      baseUrl: env.ATLASSIAN_MCP_BASE_URL,
      token,
    });
  }

  /**
   * Make a JSON-RPC 2.0 call to the Confluence MCP server
   */
  private async callMcp<T>(method: string, params: unknown): Promise<T> {
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: `confluence/${method}`, // Namespaced method
      params,
      id: this.requestId++,
    };

    const response = await this.httpClient.post(this.baseUrl, payload, this.token);

    if (!response.ok) {
      throw new Error(`Confluence MCP Request failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as JsonRpcResponse<T>;

    if (json.error) {
      throw new Error(`Confluence MCP Error [${json.error.code}]: ${json.error.message}`);
    }

    return json.result as T;
  }

  /**
   * Get a Confluence page by ID
   * @param pageId - Page ID
   */
  async getPage(pageId: string): Promise<ConfluencePage> {
    return this.callMcp<ConfluencePage>('getPage', { pageId });
  }

  /**
   * Fetch a Confluence page by title and space key
   * @param spaceKey - Space key
   * @param title - Page title
   */
  async fetchConfluencePage(spaceKey: string, title: string): Promise<ConfluencePage | null> {
    try {
      return await this.callMcp<ConfluencePage>('getPageByTitle', { spaceKey, title });
    } catch (error) {
      // Return null if page not found
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a Confluence page
   * @param spaceKey - Space key
   * @param title - Page title
   * @param content - Page content (HTML or storage format)
   * @param parentId - Optional parent page ID
   */
  async createPage(
    spaceKey: string,
    title: string,
    content: string,
    parentId?: string
  ): Promise<{ id: string; url: string; version: number }> {
    return this.callMcp<{ id: string; url: string; version: number }>('createPage', {
      spaceKey,
      title,
      content,
      parentId,
    });
  }

  /**
   * Update a Confluence page
   * @param pageId - Page ID
   * @param content - Updated content
   * @param title - Optional new title
   * @param version - Current version number (for optimistic locking)
   */
  async updatePage(
    pageId: string,
    content: string,
    title?: string,
    version?: number
  ): Promise<{ id: string; version: number; url: string }> {
    return this.callMcp<{ id: string; version: number; url: string }>('updatePage', {
      pageId,
      content,
      title,
      version,
    });
  }

  /**
   * Delete a Confluence page
   * @param pageId - Page ID
   */
  async deletePage(pageId: string): Promise<{ success: boolean }> {
    return this.callMcp<{ success: boolean }>('deletePage', { pageId });
  }

  /**
   * Search for pages in Confluence
   * @param query - Search query (CQL)
   * @param options - Search options
   */
  async searchPages(
    query: string,
    options?: {
      spaceKey?: string;
      limit?: number;
      start?: number;
    }
  ): Promise<{ results: ConfluenceSearchResult[]; total: number }> {
    // Build CQL query
    let cql = query;
    if (options?.spaceKey) {
      cql = `space = "${options.spaceKey}" AND ${cql}`;
    }

    return this.callMcp<{ results: ConfluenceSearchResult[]; total: number }>('searchPages', {
      cql,
      limit: options?.limit || 25,
      start: options?.start || 0,
    });
  }

  /**
   * List pages in a space
   * @param spaceKey - Space key
   * @param options - List options
   */
  async listPagesInSpace(
    spaceKey: string,
    options?: {
      limit?: number;
      start?: number;
      depth?: 'all' | 'root';
    }
  ): Promise<{ pages: ConfluencePage[]; total: number }> {
    return this.callMcp<{ pages: ConfluencePage[]; total: number }>('listPages', {
      spaceKey,
      limit: options?.limit || 50,
      start: options?.start || 0,
      depth: options?.depth || 'all',
    });
  }

  /**
   * Get child pages of a parent page
   * @param parentId - Parent page ID
   */
  async getChildPages(parentId: string): Promise<{ pages: ConfluencePage[] }> {
    return this.callMcp<{ pages: ConfluencePage[] }>('getChildPages', { parentId });
  }

  /**
   * Get a space by key
   * @param spaceKey - Space key
   */
  async getSpace(spaceKey: string): Promise<ConfluenceSpace> {
    return this.callMcp<ConfluenceSpace>('getSpace', { spaceKey });
  }

  /**
   * List all accessible spaces
   */
  async listSpaces(): Promise<{ spaces: ConfluenceSpace[] }> {
    return this.callMcp<{ spaces: ConfluenceSpace[] }>('listSpaces', {});
  }

  /**
   * Add a label to a page
   * @param pageId - Page ID
   * @param label - Label to add
   */
  async addLabel(pageId: string, label: string): Promise<{ success: boolean }> {
    return this.callMcp<{ success: boolean }>('addLabel', { pageId, label });
  }

  /**
   * Get labels for a page
   * @param pageId - Page ID
   */
  async getLabels(pageId: string): Promise<{ labels: string[] }> {
    return this.callMcp<{ labels: string[] }>('getLabels', { pageId });
  }

  /**
   * Convert markdown to Confluence storage format
   * @param markdown - Markdown content
   */
  async convertMarkdown(markdown: string): Promise<{ storageFormat: string }> {
    return this.callMcp<{ storageFormat: string }>('convertMarkdown', { markdown });
  }
}
