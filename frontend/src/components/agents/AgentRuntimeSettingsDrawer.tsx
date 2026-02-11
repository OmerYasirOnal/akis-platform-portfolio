import { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';
import {
  agentConfigsApi,
  type AgentType,
  type CommandLevel,
  type RuntimeProfile,
} from '../../services/api/agent-configs';

interface RuntimeState {
  runtimeProfile: RuntimeProfile;
  temperatureValue: number | null;
  commandLevel: CommandLevel;
  allowCommandExecution: boolean;
  settingsVersion: number;
}

interface AgentRuntimeSettingsDrawerProps {
  open: boolean;
  agentType: AgentType;
  onClose: () => void;
  onSaved?: (next: RuntimeState) => void;
}

const DEFAULT_STATE: RuntimeState = {
  runtimeProfile: 'deterministic',
  temperatureValue: null,
  commandLevel: 2,
  allowCommandExecution: false,
  settingsVersion: 1,
};

const COMMAND_LEVEL_LABELS: Record<CommandLevel, string> = {
  1: 'L1 Silent',
  2: 'L2 Suggest',
  3: 'L3 Guided',
  4: 'L4 Assisted Auto',
  5: 'L5 High Auto',
};
const COMMAND_LEVEL_VALUES: CommandLevel[] = [1, 2, 3, 4, 5];

function deriveAllowCommandExecution(level: CommandLevel): boolean {
  return level >= 3;
}

function normalizeRuntime(payload: Record<string, unknown> | null | undefined): RuntimeState {
  if (!payload) return DEFAULT_STATE;
  const profile = (payload.runtimeProfile as RuntimeProfile | undefined) ?? DEFAULT_STATE.runtimeProfile;
  const level = (payload.commandLevel as CommandLevel | undefined) ?? DEFAULT_STATE.commandLevel;
  const rawTemp = payload.temperatureValue;
  const temp = typeof rawTemp === 'number' ? rawTemp : rawTemp === null ? null : DEFAULT_STATE.temperatureValue;
  return {
    runtimeProfile: profile,
    temperatureValue: profile === 'custom' ? temp ?? 0.4 : null,
    commandLevel: level,
    allowCommandExecution:
      typeof payload.allowCommandExecution === 'boolean'
        ? payload.allowCommandExecution
        : deriveAllowCommandExecution(level),
    settingsVersion:
      typeof payload.settingsVersion === 'number' ? payload.settingsVersion : DEFAULT_STATE.settingsVersion,
  };
}

export default function AgentRuntimeSettingsDrawer({
  open,
  agentType,
  onClose,
  onSaved,
}: AgentRuntimeSettingsDrawerProps) {
  const [state, setState] = useState<RuntimeState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await agentConfigsApi.getConfig(agentType);
        if (!active) return;
        setState(normalizeRuntime(response.config as Record<string, unknown> | null));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load agent settings');
        setState(DEFAULT_STATE);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [open, agentType]);

  const commandBehaviorText = useMemo(() => {
    if (state.commandLevel <= 2) {
      return 'Agent command execution is blocked for this level.';
    }
    if (state.commandLevel === 3) {
      return 'Agent can suggest and run commands one-by-one with approval.';
    }
    if (state.commandLevel === 4) {
      return 'Allowlist commands auto-run. You can still stop running work.';
    }
    return 'High auto mode on. Publish actions still require manual approval.';
  }, [state.commandLevel]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        runtimeProfile: state.runtimeProfile,
        temperatureValue: state.runtimeProfile === 'custom' ? state.temperatureValue : null,
        commandLevel: state.commandLevel,
      };
      const response = await agentConfigsApi.updateConfig(agentType, payload);
      const next = normalizeRuntime(response.config as unknown as Record<string, unknown>);
      setState(next);
      onSaved?.(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save runtime settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setState(DEFAULT_STATE);
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close settings drawer"
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-ak-border bg-ak-surface shadow-2xl">
        <div className="flex h-full flex-col">
          <header className="border-b border-ak-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ak-text-primary">{agentType.toUpperCase()} Settings</h2>
                <p className="mt-1 text-xs text-ak-text-secondary">Runtime profile, temperature and command controls.</p>
              </div>
              <button
                type="button"
                className="rounded-md p-1.5 text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M11.06 10l4.47-4.47a.75.75 0 10-1.06-1.06L10 8.94 5.53 4.47a.75.75 0 00-1.06 1.06L8.94 10l-4.47 4.47a.75.75 0 001.06 1.06L10 11.06l4.47 4.47a.75.75 0 001.06-1.06L11.06 10z" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {loading ? (
              <div className="rounded-lg border border-ak-border bg-ak-surface-2 p-4 text-sm text-ak-text-secondary">
                Loading settings...
              </div>
            ) : (
              <>
                <section className="space-y-2">
                  <label className="text-sm font-medium text-ak-text-primary" htmlFor="runtime-profile">
                    Runtime Profile
                  </label>
                  <select
                    id="runtime-profile"
                    value={state.runtimeProfile}
                    onChange={(event) =>
                      setState((prev) => {
                        const runtimeProfile = event.target.value as RuntimeProfile;
                        return {
                          ...prev,
                          runtimeProfile,
                          temperatureValue:
                            runtimeProfile === 'custom' ? prev.temperatureValue ?? 0.4 : null,
                        };
                      })
                    }
                    className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary"
                  >
                    <option value="deterministic">Deterministic</option>
                    <option value="balanced">Balanced</option>
                    <option value="creative">Creative</option>
                    <option value="custom">Custom</option>
                  </select>
                </section>

                {state.runtimeProfile === 'custom' && (
                  <section className="space-y-2">
                    <label className="text-sm font-medium text-ak-text-primary" htmlFor="temperature-slider">
                      Temperature ({(state.temperatureValue ?? 0).toFixed(2)})
                    </label>
                    <input
                      id="temperature-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.temperatureValue ?? 0.4}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, temperatureValue: Number(event.target.value) }))
                      }
                      className="w-full accent-ak-primary"
                    />
                    <p className="text-xs text-ak-text-secondary">
                      Higher values make output more exploratory; lower values keep outputs stable.
                    </p>
                  </section>
                )}

                <section className="space-y-2">
                  <label className="text-sm font-medium text-ak-text-primary" htmlFor="command-level">
                    Command Level
                  </label>
                  <select
                    id="command-level"
                    value={state.commandLevel}
                    onChange={(event) =>
                      setState((prev) => {
                        const commandLevel = Number(event.target.value) as CommandLevel;
                        return {
                          ...prev,
                          commandLevel,
                          allowCommandExecution: deriveAllowCommandExecution(commandLevel),
                        };
                      })
                    }
                    className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary"
                  >
                    {COMMAND_LEVEL_VALUES.map((level) => (
                      <option key={String(level)} value={level}>
                        {COMMAND_LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ak-text-secondary">{commandBehaviorText}</p>
                </section>

                <section className="rounded-lg border border-ak-border bg-ak-surface-2 p-3 text-xs text-ak-text-secondary">
                  <p>Allow command execution: <span className="font-medium text-ak-text-primary">{state.allowCommandExecution ? 'ON' : 'OFF'}</span></p>
                  <p className="mt-1">Settings version: <span className="font-medium text-ak-text-primary">{state.settingsVersion}</span></p>
                </section>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-ak-border px-5 py-4">
            <Button variant="ghost" onClick={handleReset} disabled={saving || loading}>
              Reset
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </footer>
        </div>
      </aside>
    </>
  );
}
