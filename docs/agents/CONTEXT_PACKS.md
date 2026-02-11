# Context Packs — Architecture Decision Record

> ## Özet (TR)
> Bu belge bağlam paketleri (context packs) mimari kararını belgeler. RAG stratejisi olarak
> Şubat'ta statik dosya paketleri, Mart'ta pg_trgm arama seçilmiştir. Token/dosya limitleri,
> katman montajı, ajan başına özelleştirme ve hata ayıklama yaklaşımı tanımlanmıştır.
> Teknik detaylar aşağıda İngilizce olarak sunulmaktadır.

> **Task:** S0.5.2-RAG-1
> **Status:** LOCKED
> **Date:** 2026-02-09
> **Decision Owner:** AKIS Platform Team

---

## Decision

**February (S0.5):** Context packs — static, pre-assembled context bundles.
**March (M2):** Evaluate `pg_trgm` for lightweight retrieval if needed.

Research alignment:
- "Everything is Context" (Ref 4): packs are first-class auditable artifacts (`packId`, `packVersion`, `profile`, `selectedBy`).
- Token overflow strategy for S0.5 is `truncation`; re-ranking is deferred to M2.
- Contracts-first enforcement: invalid profile/schema is rejected (no silent fallback).

---

## Context

AKIS agents (Scribe, Trace, Proto) need repository and project context to produce high-quality outputs. The question is how to provide this context efficiently within the constraints of OCI Free Tier resources and the February pilot demo deadline.

### Options Considered

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Context Packs** (static bundles) | Zero infrastructure, deterministic, fast, no new deps | Limited to pre-assembled content, no dynamic search | **SELECTED for Feb** |
| **pg_trgm** (PostgreSQL trigram search) | Built into PG 16, no external deps, good for <10k chunks | Requires new table + migration, indexing overhead | **Deferred to March** |
| **Vector DB** (Pinecone, Weaviate, etc.) | Semantic search, best retrieval quality | External dependency, cost, OCI Free Tier limits | **REJECTED** |
| **OpenAI Embeddings + pgvector** | Good semantic search with PG | Requires pgvector extension, embedding API costs | **REJECTED** |

---

## Context Packs: How They Work

A "context pack" is a deterministic bundle of files and metadata that an agent receives as part of its input. The orchestrator assembles the pack before dispatching to the agent.

### Assembly Flow

```
User triggers agent
  → Orchestrator reads job payload (repo, branch, target)
  → Orchestrator selects pack profile + version from job input
  → Orchestrator fetches relevant files via MCP GitHub adapter
  → Files are bundled as a context pack (JSON array of {path, content})
  → Context pack is passed to agent as part of the prompt
  → Agent processes pack + user input → generates output
```

### Pack Structure

```typescript
interface ContextPack {
  files: Array<{
    path: string;       // e.g., "src/api/users.ts"
    content: string;    // file content (truncated if over limit)
    language: string;   // detected language for syntax hints
  }>;
  metadata: {
    repo: string;       // "owner/repo"
    branch: string;     // "main"
    totalFiles: number; // total files in pack
    truncated: boolean; // whether any files were truncated
    assembledAt: string; // ISO timestamp
    packId: string;      // deterministic audit id (cp_<hash>)
    packVersion: string; // e.g. "v1"
    profile: string;     // selected profile ("default", "docs", ...)
    selectedBy: string | null; // job id or null
  };
}
```

### Agent-Specific Pack Rules

| Agent | Pack Contents | Max Size |
|-------|--------------|----------|
| **Scribe** | Changed files from PR/branch diff, README, existing docs | 50 files or 200KB |
| **Trace** | Source files in target directory, existing test files, package.json | 30 files or 150KB |
| **Proto** | Specification doc, reference files if provided, package.json templates | 20 files or 100KB |

### Advantages for February Pilot

1. **No new infrastructure** — works with existing MCP GitHub adapter
2. **Deterministic** — same input always produces same context
3. **Debuggable** — context pack is logged with job, can be inspected
4. **Fast** — no search indexing, no embedding computation
5. **Token-efficient** — pre-selected files avoid irrelevant content

---

## March Evaluation: pg_trgm

If pilot feedback indicates that static context packs miss important files, we will evaluate `pg_trgm` for March (M2).

### Planned Schema

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_path TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_content_trgm
  ON knowledge_chunks USING gin (content gin_trgm_ops);
```

### Performance Expectations

- 1,000-10,000 chunks: <100ms query time on OCI Free Tier
- No external dependencies (pg_trgm ships with PostgreSQL)

### What We Will NOT Do

- External vector databases (Pinecone, Weaviate, Chroma, Qdrant)
- Heavy embedding models (sentence-transformers, OpenAI embeddings)
- Complex chunking strategies (semantic chunking, recursive splitting)
- RAG evaluation frameworks (RAGAS, etc.)

---

## Rationale

The February pilot demo needs reliability over sophistication. Context packs provide a working, debuggable mechanism that can be upgraded later. Adding pg_trgm in March gives us a natural feedback loop: pilot users tell us what's missing, and we add search only if needed.

This follows the project's principle: **ship the simplest correct thing first**.

---

*Related: [Research Brief](../planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | [Agent Contracts](AGENT_CONTRACTS_S0.5.md)*
