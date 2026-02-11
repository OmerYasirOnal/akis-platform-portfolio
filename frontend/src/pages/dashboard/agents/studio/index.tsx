import { useMemo, useState } from 'react';
import Button from '../../../../components/common/Button';
import { toast } from '../../../../components/ui/Toast';

const FILES = [
  'src/main.tsx',
  'src/App.tsx',
  'src/components/agents/AgentRuntimeSettingsDrawer.tsx',
  'backend/src/api/agents.ts',
  'backend/src/core/orchestrator/AgentOrchestrator.ts',
  'docs/NEXT.md',
];

const COMMANDS = [
  { key: 'git_status', label: 'git status' },
  { key: 'lint', label: 'pnpm lint' },
  { key: 'typecheck', label: 'pnpm typecheck' },
  { key: 'test', label: 'pnpm test' },
  { key: 'build', label: 'pnpm build' },
] as const;

const PREVIEW_CODE = `// AKIS Studio (MVP scaffold)
export const studioReady = true;

export function runCommand(commandKey: string) {
  return { commandKey, status: 'queued' };
}
`;

export default function DashboardAgentStudioPage() {
  const [selectedFile, setSelectedFile] = useState(FILES[0]);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '[studio] Workspace initialized.',
    '[studio] Waiting for command...',
  ]);

  const breadcrumbs = useMemo(() => selectedFile.split('/'), [selectedFile]);

  const runAllowedCommand = (commandLabel: string) => {
    const now = new Date().toLocaleTimeString();
    setTerminalLines((prev) => [
      ...prev,
      `[${now}] $ ${commandLabel}`,
      `[${now}] queued (allowlist policy)`
    ]);
    toast(`Command queued: ${commandLabel}`, 'info');
  };

  return (
    <div className="h-full bg-ak-bg text-ak-text-primary">
      <div className="border-b border-ak-border bg-ak-surface px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">AKIS Studio</h1>
            <p className="text-xs text-ak-text-secondary">File tree + terminal + AI panel (MVP surface)</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-ak-border bg-ak-surface-2 px-2 py-1 text-ak-text-secondary">Push-to-talk: Ready</span>
            <span className="rounded-full border border-ak-border bg-ak-surface-2 px-2 py-1 text-ak-text-secondary">Patch mode: Review first</span>
          </div>
        </div>
      </div>

      <div className="grid h-[calc(100%-61px)] grid-cols-12 gap-0">
        <aside className="col-span-12 border-b border-ak-border bg-ak-surface-2 p-3 md:col-span-3 md:border-b-0 md:border-r">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">Workspace</p>
          <div className="space-y-1">
            {FILES.map((file) => (
              <button
                key={file}
                onClick={() => setSelectedFile(file)}
                className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  selectedFile === file
                    ? 'bg-ak-primary/15 text-ak-primary'
                    : 'text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary'
                }`}
              >
                {file}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-ak-border bg-ak-surface p-2">
            <p className="mb-2 text-[11px] font-medium text-ak-text-secondary">Allowlist Commands</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.key}
                  onClick={() => runAllowedCommand(cmd.label)}
                  className="rounded border border-ak-border px-2 py-1 text-[11px] text-ak-text-secondary hover:border-ak-primary/40 hover:text-ak-text-primary"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="col-span-12 flex flex-col border-b border-ak-border bg-ak-bg md:col-span-6 md:border-b-0 md:border-r">
          <div className="border-b border-ak-border bg-ak-surface px-3 py-2 text-xs text-ak-text-secondary">
            {breadcrumbs.join(' / ')}
          </div>
          <div className="flex-1 overflow-auto p-3">
            <pre className="min-h-full rounded-lg border border-ak-border bg-ak-surface-2 p-3 text-xs text-ak-text-primary">
              {PREVIEW_CODE}
            </pre>
          </div>
          <div className="border-t border-ak-border bg-ak-surface p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">Terminal</p>
            <div className="h-36 overflow-auto rounded-lg border border-ak-border bg-black/40 p-2 font-mono text-[11px] text-emerald-300">
              {terminalLines.map((line, idx) => (
                <div key={`${line}-${idx}`}>{line}</div>
              ))}
            </div>
          </div>
        </main>

        <aside className="col-span-12 flex flex-col bg-ak-surface p-3 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ak-text-secondary">AI Assistant</p>
          <div className="mt-2 flex-1 rounded-lg border border-ak-border bg-ak-surface-2 p-3 text-xs text-ak-text-secondary">
            <p className="text-ak-text-primary">Conversation-ready agent panel.</p>
            <p className="mt-2">- Ask for patches</p>
            <p>- Review plan candidates</p>
            <p>- Approve selected files</p>
            <p>- Publish as Draft PR</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secondary"
              className="!px-2.5 !py-1.5 !text-xs"
              onClick={() => toast('Voice capture fallback is ready (text mode).', 'info')}
            >
              Push to Talk
            </Button>
            <Button
              className="!px-2.5 !py-1.5 !text-xs"
              onClick={() => toast('Draft PR flow prepared for applied patches.', 'success')}
            >
              Publish Draft
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
