import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import AgentRuntimeSettingsDrawer from '../../../components/agents/AgentRuntimeSettingsDrawer';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import { agentsApi, type AgentType, type JobDetail, type RunningJob, type RuntimeOverride } from '../../../services/api/agents';
import { agentConfigsApi, type ScribeConfig } from '../../../services/api/agent-configs';
import {
  conversationsApi,
  type ConversationMessage,
  type ConversationThread,
  type PlanCandidate as ApiPlanCandidate,
} from '../../../services/api/conversations';
import { githubDiscoveryApi, type GitHubRepo, type GitHubBranch } from '../../../services/api/github-discovery';
import { smartAutomationsApi } from '../../../services/api/smart-automations';
import { integrationsApi } from '../../../services/api/integrations';
import { getMultiProviderStatus, type AIKeyProvider } from '../../../services/api/ai-keys';
import { toast } from '../../../components/ui/Toast';
import { useI18n } from '../../../i18n/useI18n';
import { cn } from '../../../utils/cn';

interface AgentDefinition {
  id: AgentType | 'smart-automations';
  name: string;
  description: string;
  icon: React.ReactNode;
  capabilities: string[];
  status: 'available' | 'coming_soon';
  color: string;
  requiresInput: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
}

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'agent';
  content: string;
  phase?: string;
  timestamp: number;
  isError?: boolean;
  isSuccess?: boolean;
  jobId?: string;
  automationId?: string;
  automationRunId?: string;
  artifact?: { path: string; type: string };
}

type SessionKind = 'scribe' | 'trace' | 'proto' | 'automation';

interface ChatSession {
  id: string;
  agentId: AgentDefinition['id'];
  kind: SessionKind;
  typeLabel: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessagePreview: string;
  jobId?: string;
  automationId?: string;
  automationRunId?: string;
  messages: ChatMessage[];
}

type SteerQueueReason = 'user_message' | 'build_selected';

interface SteerQueueItem {
  id: string;
  content: string;
  createdAt: number;
  candidateId?: string;
  reason: SteerQueueReason;
}

type PlanCandidateStatus = 'unbuilt' | 'queued' | 'building' | 'built' | 'failed';

interface PlanCandidate {
  id: string;
  title: string;
  summary: string;
  sourceMessage: string;
  status: PlanCandidateStatus;
  selected: boolean;
  createdAt: number;
}

interface SteerQuestionOption {
  id: string;
  label: string;
  description: string;
}

interface SteerQuestion {
  id: string;
  title: string;
  options: SteerQuestionOption[];
}

const SESSION_STORAGE_KEY = 'akis:agents-hub:chat-sessions:v1';
const MAX_CHAT_SESSIONS = 40;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Provider-specific fallback models
const FALLBACK_MODELS = {
  openrouter: [
    { id: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4 (Recommended)', tier: 'standard' },
    { id: 'anthropic/claude-3.5-haiku', label: 'Anthropic Claude 3.5 Haiku', tier: 'budget' },
    { id: 'meta-llama/llama-4-maverick', label: 'Meta Llama 4 Maverick', tier: 'budget' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)', tier: 'standard' },
    { id: 'gpt-4o', label: 'GPT-4o', tier: 'standard' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tier: 'budget' },
  ],
};

// Default fallback for unknown provider
const FALLBACK_MODEL_OPTIONS = FALLBACK_MODELS.openrouter;

interface SupportedModel {
  id: string;
  name: string;
  provider: string;
  recommended: boolean;
}

const ScribeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const TraceIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ProtoIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const AutomationIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
  </svg>
);

const SendIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const SteerIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.25v13.5m0-13.5L8.25 9m3.75-3.75L15.75 9M5.25 12h13.5m-13.5 0L9 8.25m-3.75 3.75L9 15.75M18.75 12L15 8.25m3.75 3.75L15 15.75" />
  </svg>
);

const builtInAgents: AgentDefinition[] = [
  {
    id: 'scribe',
    name: 'Scribe',
    description: 'Generate docs, changelogs, and release notes from code.',
    icon: <ScribeIcon />,
    capabilities: ['Analyzes commits and PRs', 'Generates Markdown docs', 'Creates PR with changes', 'Multiple doc targets'],
    status: 'available',
    color: 'ak-primary',
    requiresInput: false,
    inputPlaceholder: 'Additional instructions for documentation...',
    inputLabel: 'Extra instructions (optional)',
  },
  {
    id: 'trace',
    name: 'Trace',
    description: 'Generate test plans and coverage from specifications.',
    icon: <TraceIcon />,
    capabilities: ['Parses acceptance criteria', 'Generates test scaffolds', 'Risk-based prioritization', 'Coverage analysis'],
    status: 'available',
    color: 'blue-400',
    requiresInput: true,
    inputPlaceholder: 'Paste your test specification or acceptance criteria here...',
    inputLabel: 'Test Specification',
  },
  {
    id: 'proto',
    name: 'Proto',
    description: 'Bootstrap MVP scaffolds from requirements.',
    icon: <ProtoIcon />,
    capabilities: ['Full-stack scaffolding', 'Built-in testing', 'Deploy-ready configs', 'Iterative refinement'],
    status: 'available',
    color: 'purple-400',
    requiresInput: true,
    inputPlaceholder: 'Describe what you want to build...\n\nExample: "A REST API with user auth, PostgreSQL, and Docker setup"',
    inputLabel: 'Requirements',
  },
  {
    id: 'smart-automations',
    name: 'Akıllı Otomasyonlar',
    description: 'RSS kaynaklarından günlük LinkedIn içeriği oluşturun.',
    icon: <AutomationIcon />,
    capabilities: ['RSS kaynak takibi', 'AI ile özetleme', 'LinkedIn taslağı', 'Slack bildirimi'],
    status: 'available',
    color: 'cyan-400',
    requiresInput: false,
  },
];

const PHASE_LABELS: Record<string, { icon: string; label: string }> = {
  thinking: { icon: '...', label: 'Thinking' },
  discovery: { icon: '?', label: 'Discovery' },
  reading: { icon: '>', label: 'Reading' },
  creating: { icon: '+', label: 'Creating' },
  reviewing: { icon: '~', label: 'Reviewing' },
  publishing: { icon: '^', label: 'Publishing' },
  done: { icon: 'ok', label: 'Done' },
  error: { icon: '!', label: 'Error' },
};

function getAgentColor(id: string) {
  switch (id) {
    case 'scribe': return { bg: 'bg-ak-primary/10', text: 'text-ak-primary' };
    case 'trace': return { bg: 'bg-blue-500/10', text: 'text-blue-400' };
    case 'proto': return { bg: 'bg-purple-500/10', text: 'text-purple-400' };
    case 'smart-automations': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400' };
    default: return { bg: 'bg-ak-primary/10', text: 'text-ak-primary' };
  }
}

function getSessionKind(agentId: AgentDefinition['id']): SessionKind {
  if (agentId === 'smart-automations') return 'automation';
  return agentId;
}

function getSessionTypeLabel(kind: SessionKind): string {
  if (kind === 'automation') return 'AUTOMATION';
  return kind.toUpperCase();
}

function safeLoadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && Array.isArray(s.messages)).slice(0, MAX_CHAT_SESSIONS);
  } catch {
    return [];
  }
}

function safeSaveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_CHAT_SESSIONS)));
  } catch {
    // ignore quota/storage errors
  }
}

function getSessionIcon(kind: SessionKind) {
  if (kind === 'automation') return <AutomationIcon />;
  if (kind === 'trace') return <TraceIcon />;
  if (kind === 'proto') return <ProtoIcon />;
  return <ScribeIcon />;
}

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function toSessionFromThread(thread: ConversationThread): ChatSession {
  const kind = getSessionKind(thread.agentType as AgentDefinition['id']);
  return {
    id: thread.id,
    agentId: thread.agentType as AgentDefinition['id'],
    kind,
    typeLabel: getSessionTypeLabel(kind),
    title: thread.title,
    createdAt: new Date(thread.createdAt).getTime(),
    updatedAt: new Date(thread.updatedAt).getTime(),
    lastMessagePreview: thread.lastMessagePreview ?? '',
    messages: [],
  };
}

function toChatMessage(message: ConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.createdAt).getTime(),
    phase: typeof message.metadata.phase === 'string' ? message.metadata.phase : undefined,
    isError: Boolean(message.metadata.isError),
    isSuccess: Boolean(message.metadata.isSuccess),
    jobId: typeof message.metadata.jobId === 'string' ? message.metadata.jobId : undefined,
    automationId: typeof message.metadata.automationId === 'string' ? message.metadata.automationId : undefined,
    automationRunId: typeof message.metadata.automationRunId === 'string' ? message.metadata.automationRunId : undefined,
    artifact:
      message.metadata && typeof message.metadata === 'object' && typeof message.metadata.artifactPath === 'string'
        ? {
            path: message.metadata.artifactPath,
            type: typeof message.metadata.artifactType === 'string' ? message.metadata.artifactType : 'file',
          }
        : undefined,
  };
}

function toLocalPlanCandidate(candidate: ApiPlanCandidate): PlanCandidate {
  return {
    id: candidate.id,
    title: candidate.title,
    summary: candidate.summary,
    sourceMessage: candidate.sourcePrompt,
    status: candidate.status,
    selected: candidate.selected,
    createdAt: new Date(candidate.createdAt).getTime(),
  };
}

export default function AgentsHubPage() {
  const { t } = useI18n();
  const tx = useCallback((key: string) => t(key as never), [t]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition>(builtInAgents[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const didAutoSelectInitialSession = useRef(false);

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchStrategy, setBranchStrategy] = useState<'manual' | 'auto'>('auto');
  const [activeProvider, setActiveProvider] = useState<AIKeyProvider | null>(null);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4');
  const [modelOptions, setModelOptions] = useState(FALLBACK_MODEL_OPTIONS);
  const [modelsLoading, setModelsLoading] = useState(false);

  const [currentJob, setCurrentJob] = useState<JobDetail | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [runningJobs, setRunningJobs] = useState<RunningJob[]>([]);
  const [userConfigs, setUserConfigs] = useState<ScribeConfig[]>([]);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => safeLoadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [animatedSessionId, setAnimatedSessionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showConfig, setShowConfig] = useState(true);
  const [showSteerMenu, setShowSteerMenu] = useState(false);
  const [steerQueueBySession, setSteerQueueBySession] = useState<Record<string, SteerQueueItem[]>>({});
  const [planCandidatesBySession, setPlanCandidatesBySession] = useState<Record<string, PlanCandidate[]>>({});
  const [buildingCandidateId, setBuildingCandidateId] = useState<string | null>(null);
  const [showQuestionPrompt, setShowQuestionPrompt] = useState(false);
  const [questionStep, setQuestionStep] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [runtimeOverride, setRuntimeOverride] = useState<RuntimeOverride | undefined>(undefined);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const handleRunAgentRef = useRef<(extraInput?: string) => Promise<void>>(async () => {});

  const upsertSession = useCallback((sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setChatSessions((prev) =>
      prev
        .map((session) => (session.id === sessionId ? updater(session) : session))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_CHAT_SESSIONS)
    );
  }, []);

  const appendMessageToSession = useCallback((sessionId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const now = Date.now();
    const entry: ChatMessage = {
      ...msg,
      id: `msg-${now}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
    };
    upsertSession(sessionId, (session) => ({
      ...session,
      updatedAt: now,
      lastMessagePreview: entry.content.slice(0, 120),
      messages: [...session.messages, entry],
    }));

    if (isUuid(sessionId)) {
      void conversationsApi
        .createMessage(sessionId, {
          role: msg.role,
          content: msg.content,
          agentType: selectedAgent.id,
          metadata: {
            phase: msg.phase,
            isError: msg.isError ?? false,
            isSuccess: msg.isSuccess ?? false,
            jobId: msg.jobId ?? null,
            automationId: msg.automationId ?? null,
            automationRunId: msg.automationRunId ?? null,
            artifactPath: msg.artifact?.path ?? null,
            artifactType: msg.artifact?.type ?? null,
          },
        })
        .catch(() => {
          // Keep local continuity even if backend persistence fails.
        });
    }
  }, [selectedAgent.id, upsertSession]);

  const generateSessionTitle = useCallback((agentName: string, input?: string) => {
    const clean = input?.replace(/\s+/g, ' ').trim();
    if (clean) {
      const words = clean.split(' ').slice(0, 5).join(' ');
      return words.length > 48 ? `${words.slice(0, 48).trim()}…` : words;
    }
    if (selectedRepo && selectedBranch) return `${agentName} • ${selectedRepo}/${selectedBranch}`;
    return `${agentName} Session`;
  }, [selectedRepo, selectedBranch]);

  const createSession = useCallback((agent: AgentDefinition, seedText?: string) => {
    const now = Date.now();
    const kind = getSessionKind(agent.id);
    const sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `session-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const resolvedTitle = generateSessionTitle(agent.name, seedText);
    const session: ChatSession = {
      id: sessionId,
      agentId: agent.id,
      kind,
      typeLabel: getSessionTypeLabel(kind),
      title: resolvedTitle,
      createdAt: now,
      updatedAt: now,
      lastMessagePreview: '',
      messages: [],
    };

    setChatSessions((prev) => [session, ...prev].slice(0, MAX_CHAT_SESSIONS));
    setActiveSessionId(sessionId);
    setAnimatedSessionId(sessionId);
    setTimeout(() => setAnimatedSessionId((current) => (current === sessionId ? null : current)), 1200);

    if (isUuid(sessionId)) {
      void conversationsApi
        .createThread({
          id: sessionId,
          title: resolvedTitle,
          agentType: agent.id,
        })
        .catch(() => {
          // Keep local-only thread when API is unavailable.
        });
    }

    appendMessageToSession(sessionId, {
      role: 'system',
      content: `${getSessionTypeLabel(kind)} · ${resolvedTitle}`,
      phase: 'thinking',
    });

    return sessionId;
  }, [appendMessageToSession, generateSessionTitle]);

  const activeSession = useMemo(
    () => (activeSessionId ? chatSessions.find((session) => session.id === activeSessionId) ?? null : null),
    [chatSessions, activeSessionId]
  );

  const chatMessages = useMemo(
    () => activeSession?.messages ?? [],
    [activeSession]
  );

  const activeQueue = useMemo(
    () => (activeSessionId ? steerQueueBySession[activeSessionId] ?? [] : []),
    [activeSessionId, steerQueueBySession]
  );

  const activePlanCandidates = useMemo(
    () => (activeSessionId ? planCandidatesBySession[activeSessionId] ?? [] : []),
    [activeSessionId, planCandidatesBySession]
  );

  const unbuiltCandidates = useMemo(
    () => activePlanCandidates.filter((candidate) => candidate.status === 'unbuilt'),
    [activePlanCandidates]
  );

  const selectedUnbuiltCandidates = useMemo(
    () => unbuiltCandidates.filter((candidate) => candidate.selected),
    [unbuiltCandidates]
  );

  const steerQuestions = useMemo<SteerQuestion[]>(
    () => [
      {
        id: 'plan_count',
        title: tx('agentsHub.steer.planCountTitle'),
        options: [
          { id: 'recommended', label: tx('agentsHub.steer.planCount.recommended'), description: tx('agentsHub.steer.planCount.recommendedDesc') },
          { id: 'always_three', label: tx('agentsHub.steer.planCount.alwaysThree'), description: tx('agentsHub.steer.planCount.alwaysThreeDesc') },
          { id: 'dynamic', label: tx('agentsHub.steer.planCount.dynamic'), description: tx('agentsHub.steer.planCount.dynamicDesc') },
        ],
      },
      {
        id: 'delivery_mode',
        title: tx('agentsHub.steer.deliveryTitle'),
        options: [
          { id: 'queue', label: tx('agentsHub.steer.delivery.queue'), description: tx('agentsHub.steer.delivery.queueDesc') },
          { id: 'interrupt', label: tx('agentsHub.steer.delivery.interrupt'), description: tx('agentsHub.steer.delivery.interruptDesc') },
        ],
      },
    ],
    [tx]
  );

  const notifyUser = useCallback((message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    toast(message, variant);
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        // Browser-level notification for long-running agent feedback.
        new Notification('AKIS', { body: message });
      } catch {
        // Ignore notification errors in unsupported contexts.
      }
      return;
    }
    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  const updateQueue = useCallback((sessionId: string, updater: (prev: SteerQueueItem[]) => SteerQueueItem[]) => {
    setSteerQueueBySession((prev) => ({
      ...prev,
      [sessionId]: updater(prev[sessionId] ?? []),
    }));
  }, []);

  const setCandidateStatus = useCallback((sessionId: string, candidateId: string, status: PlanCandidateStatus) => {
    setPlanCandidatesBySession((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] ?? []).map((candidate) =>
        candidate.id === candidateId ? { ...candidate, status, selected: status === 'built' ? false : candidate.selected } : candidate
      ),
    }));
  }, []);

  const createPlanCandidates = useCallback((sessionId: string, prompt: string, count: number): PlanCandidate[] => {
    const now = Date.now();
    const variants = [
      tx('agentsHub.planVariant.balanced'),
      tx('agentsHub.planVariant.speed'),
      tx('agentsHub.planVariant.safety'),
    ];
    const nextCandidates: PlanCandidate[] = Array.from({ length: count }).map((_, index) => {
      const variant = variants[index] || `${tx('agentsHub.planVariant.alt')} ${index + 1}`;
      return {
        id: `candidate-${now}-${index}`,
        title: `${tx('agentsHub.planTitle')} ${index + 1}`,
        summary: variant,
        sourceMessage: `${prompt.trim()}\n\n${tx('agentsHub.planConstraintPrefix')}: ${variant}`,
        status: 'unbuilt',
        selected: index === 0,
        createdAt: now + index,
      };
    });

    setPlanCandidatesBySession((prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] ?? []), ...nextCandidates],
    }));

    if (isUuid(sessionId)) {
      void conversationsApi
        .generatePlans(sessionId, { prompt: prompt.trim(), count })
        .then((response) => {
          setPlanCandidatesBySession((prev) => ({
            ...prev,
            [sessionId]: response.candidates.map(toLocalPlanCandidate),
          }));
        })
        .catch(() => {
          // Keep local candidate set if backend generation fails.
        });
    }
    return nextCandidates;
  }, [tx]);

  // Load active provider and supported models (provider-aware)
  // Re-runs when provider changes
  useEffect(() => {
    const loadProviderAndModels = async () => {
      setModelsLoading(true);
      let currentProvider: AIKeyProvider | null = null;
      try {
        // 1. Get user's active provider
        try {
          const aiStatus = await getMultiProviderStatus();
          currentProvider = aiStatus.activeProvider;
          setActiveProvider(currentProvider);
        } catch {
          // Use default if not authenticated
          currentProvider = 'openrouter';
          setActiveProvider(currentProvider);
        }

        // 2. Fetch models for that provider
        const providerParam = currentProvider ? `?provider=${currentProvider}` : '';
        const response = await fetch(`/api/ai/supported-models${providerParam}`);
        
        if (response.ok) {
          const data = await response.json() as { provider?: string; models: SupportedModel[] };
          const responseProvider = data.provider as AIKeyProvider | undefined;
          
          const options = data.models.map((m) => ({
            id: m.id,
            label: m.name + (m.recommended ? ' (Recommended)' : ''),
            tier: m.recommended ? 'standard' : 'budget',
          }));
          
          if (options.length > 0) {
            setModelOptions(options);
            // Select recommended model or first in list
            const recommended = data.models.find(m => m.recommended);
            setSelectedModel(recommended?.id || options[0].id);
            
            // Update activeProvider from response if different
            if (responseProvider && responseProvider !== currentProvider) {
              setActiveProvider(responseProvider);
            }
          }
        } else {
          // API failed - use fallback based on provider
          const fallback = currentProvider && FALLBACK_MODELS[currentProvider] 
            ? FALLBACK_MODELS[currentProvider] 
            : FALLBACK_MODEL_OPTIONS;
          setModelOptions(fallback);
          setSelectedModel(fallback[0].id);
        }
      } catch (err) {
        console.warn('Failed to load supported models, using fallback:', err);
        // Use provider-specific fallback
        const fallback = currentProvider && FALLBACK_MODELS[currentProvider]
          ? FALLBACK_MODELS[currentProvider]
          : FALLBACK_MODEL_OPTIONS;
        setModelOptions(fallback);
        setSelectedModel(fallback[0].id);
      } finally {
        setModelsLoading(false);
      }
    };
    
    loadProviderAndModels();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    safeSaveSessions(chatSessions);
  }, [chatSessions]);

  useEffect(() => {
    let cancelled = false;
    const hydrateThreads = async () => {
      try {
        const response = await conversationsApi.listThreads();
        if (cancelled || response.threads.length === 0) return;

        const sessions = response.threads
          .map(toSessionFromThread)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, MAX_CHAT_SESSIONS);

        setChatSessions(sessions);
        setActiveSessionId((current) => {
          if (current && sessions.some((session) => session.id === current)) return current;
          return sessions[0]?.id ?? null;
        });
      } catch {
        // Fallback to local sessions only.
      }
    };

    void hydrateThreads();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeSessionId || !isUuid(activeSessionId)) return;
    const session = chatSessions.find((item) => item.id === activeSessionId);
    if (!session || session.messages.length > 0) return;

    let cancelled = false;
    const hydrateMessages = async () => {
      try {
        const response = await conversationsApi.listMessages(activeSessionId, { limit: 200 });
        if (cancelled) return;
        const mapped = response.messages.map(toChatMessage);
        upsertSession(activeSessionId, (prev) => ({
          ...prev,
          messages: mapped,
          lastMessagePreview: mapped[mapped.length - 1]?.content.slice(0, 120) ?? prev.lastMessagePreview,
          updatedAt: mapped[mapped.length - 1]?.timestamp ?? prev.updatedAt,
        }));
      } catch {
        // Keep local messages.
      }
    };

    void hydrateMessages();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, chatSessions, upsertSession]);

  useEffect(() => {
    if (!activeSessionId || !isUuid(activeSessionId)) return;
    let cancelled = false;
    const hydratePlans = async () => {
      try {
        const response = await conversationsApi.listPlans(activeSessionId);
        if (cancelled) return;
        setPlanCandidatesBySession((prev) => ({
          ...prev,
          [activeSessionId]: response.candidates.map(toLocalPlanCandidate),
        }));
      } catch {
        // Keep local plan candidates.
      }
    };

    void hydratePlans();
    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const node = event.target as Node | null;
      if (!node) return;
      if (inputAreaRef.current && !inputAreaRef.current.contains(node)) {
        setShowSteerMenu(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSteerMenu(false);
        setShowQuestionPrompt(false);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (didAutoSelectInitialSession.current) return;
    if (!activeSessionId && chatSessions.length > 0) {
      setActiveSessionId(chatSessions[0].id);
    }
    didAutoSelectInitialSession.current = true;
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    const checkGitHub = async () => {
      try {
        const status = await integrationsApi.getGitHubStatus();
        setGithubConnected(status.connected);
        if (status.connected && status.login) setGithubUser(status.login);
      } catch { setGithubConnected(false); }
    };
    checkGitHub();
  }, []);

  useEffect(() => {
    const fetchRunningJobs = async () => {
      try {
        const result = await agentsApi.getRunningJobs();
        setRunningJobs(result.jobs);
      } catch { /* silent */ }
    };
    if (githubConnected) fetchRunningJobs();
    const interval = setInterval(() => {
      if (githubConnected) fetchRunningJobs();
    }, 5000);
    return () => clearInterval(interval);
  }, [githubConnected]);

  useEffect(() => {
    if (!githubConnected || !githubUser) return;
    const loadRepos = async () => {
      setLoadingRepos(true);
      try {
        const result = await githubDiscoveryApi.getRepos(githubUser);
        setRepos(result.repos);
        if (result.repos.length > 0) setSelectedRepo(result.repos[0].name);
      } catch { setRepos([]); }
      finally { setLoadingRepos(false); }
    };
    loadRepos();
  }, [githubConnected, githubUser]);

  useEffect(() => {
    if (!githubConnected || !githubUser || !selectedRepo) return;
    const loadBranches = async () => {
      setLoadingBranches(true);
      try {
        const result = await githubDiscoveryApi.getBranches(githubUser, selectedRepo);
        setBranches(result.branches);
        setSelectedBranch(result.defaultBranch || 'main');
      } catch { setBranches([]); }
      finally { setLoadingBranches(false); }
    };
    loadBranches();
  }, [githubConnected, githubUser, selectedRepo]);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const response = await agentConfigsApi.listConfigs();
        if (response.configs?.length > 0) setUserConfigs(response.configs);
      } catch { /* no configs */ }
    };
    loadConfigs();
  }, []);

  useEffect(() => {
    if (!activeSessionId || !activeSession) return;
    const linkedAgent = builtInAgents.find((agent) => agent.id === activeSession.agentId);
    if (linkedAgent && linkedAgent.id !== selectedAgent.id) {
      setSelectedAgent(linkedAgent);
    }
  }, [activeSession, activeSessionId, selectedAgent.id]);

  useEffect(() => {
    setShowSteerMenu(false);
  }, [activeSessionId]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return builtInAgents;
    const query = searchQuery.toLowerCase();
    return builtInAgents.filter(
      (agent) => agent.name.toLowerCase().includes(query) || agent.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const repoOptions: SelectOption[] = repos.map((r) => ({
    value: r.name,
    label: r.name,
    description: r.private ? 'Private' : 'Public',
  }));

  const branchOptions: SelectOption[] = branches.map((b) => ({
    value: b.name,
    label: b.name,
    description: b.isDefault ? 'Default' : undefined,
  }));

  const mapTraceToPhase = (eventType: string): string => {
    if (eventType.includes('plan') || eventType === 'ai_call') return 'thinking';
    if (eventType.includes('doc_read') || eventType.includes('mcp_connect')) return 'discovery';
    if (eventType.includes('tool_call') || eventType.includes('reading')) return 'reading';
    if (eventType.includes('file_created') || eventType.includes('file_modified')) return 'creating';
    if (eventType.includes('mcp_call') || eventType.includes('commit') || eventType.includes('pr')) return 'publishing';
    if (eventType.includes('complete') || eventType.includes('done')) return 'done';
    if (eventType.includes('error') || eventType.includes('fail')) return 'error';
    return 'thinking';
  };

  const formatQualityStatus = (score?: number | null) => {
    if (typeof score !== 'number') return null;
    const gate = score >= 60 ? 'PASS' : 'FAIL';
    return `${Math.round(score)}/100 · ${gate}`;
  };

  const ensureSessionForRun = useCallback((seedText?: string) => {
    if (activeSession && activeSession.agentId === selectedAgent.id) {
      return activeSession.id;
    }
    return createSession(selectedAgent, seedText);
  }, [activeSession, createSession, selectedAgent]);

  const enqueueSteerMessage = useCallback((sessionId: string, content: string, reason: SteerQueueReason, candidateId?: string) => {
    const item: SteerQueueItem = {
      id: `queued-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      content,
      createdAt: Date.now(),
      candidateId,
      reason,
    };
    updateQueue(sessionId, (prev) => [...prev, item]);
    if (candidateId) {
      setCandidateStatus(sessionId, candidateId, 'queued');
    }
    notifyUser(tx('agentsHub.steer.queuedNotification'), 'info');
  }, [notifyUser, setCandidateStatus, tx, updateQueue]);

  const reorderQueue = useCallback((sessionId: string, itemId: string, direction: 'up' | 'down') => {
    updateQueue(sessionId, (prev) => {
      const index = prev.findIndex((item) => item.id === itemId);
      if (index < 0) return prev;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const clone = [...prev];
      const [item] = clone.splice(index, 1);
      clone.splice(nextIndex, 0, item);
      return clone;
    });
  }, [updateQueue]);

  const removeQueuedItem = useCallback((sessionId: string, itemId: string) => {
    updateQueue(sessionId, (prev) => {
      const target = prev.find((item) => item.id === itemId);
      if (target?.candidateId) {
        setCandidateStatus(sessionId, target.candidateId, 'unbuilt');
      }
      return prev.filter((item) => item.id !== itemId);
    });
    notifyUser(tx('agentsHub.steer.removedNotification'), 'warning');
  }, [notifyUser, setCandidateStatus, tx, updateQueue]);

  const finalizeCandidateBuild = useCallback((sessionId: string, success: boolean) => {
    if (!buildingCandidateId) return;
    setCandidateStatus(sessionId, buildingCandidateId, success ? 'built' : 'failed');
    setBuildingCandidateId(null);
  }, [buildingCandidateId, setCandidateStatus]);

  const runNextQueuedItem = useCallback((sessionId: string) => {
    setSteerQueueBySession((prev) => {
      const queue = prev[sessionId] ?? [];
      if (queue.length === 0) return prev;
      const [nextItem, ...rest] = queue;
      setTimeout(() => {
        setActiveSessionId(sessionId);
        const linkedSession = chatSessions.find((session) => session.id === sessionId);
        if (linkedSession) {
          const linkedAgent = builtInAgents.find((agent) => agent.id === linkedSession.agentId);
          if (linkedAgent) setSelectedAgent(linkedAgent);
        }
        if (nextItem.candidateId) {
          setBuildingCandidateId(nextItem.candidateId);
          setCandidateStatus(sessionId, nextItem.candidateId, 'building');
        }
        notifyUser(tx('agentsHub.steer.runningQueued'), 'info');
        void handleRunAgentRef.current(nextItem.content);
      }, 250);
      return { ...prev, [sessionId]: rest };
    });
  }, [chatSessions, notifyUser, setCandidateStatus, tx]);

  const handleRunAgent = async (extraInput?: string) => {
    if (!selectedAgent || selectedAgent.status !== 'available') return;
    const isAutomationAgent = selectedAgent.id === 'smart-automations';
    if (!isAutomationAgent && (!githubConnected || !selectedRepo || !selectedBranch)) return;

    if (selectedAgent.requiresInput && !extraInput?.trim()) {
      setJobError(
        selectedAgent.id === 'trace' ? 'Please provide a test specification' :
        'Please describe your requirements'
      );
      return;
    }

    setIsRunning(true);
    setJobError(null);
    setShowConfig(false);
    const sessionId = ensureSessionForRun(extraInput);

    upsertSession(sessionId, (session) => ({
      ...session,
      updatedAt: Date.now(),
    }));

    appendMessageToSession(sessionId, {
      role: 'user',
      content: extraInput?.trim()
        ? extraInput.trim()
        : isAutomationAgent
          ? `Run ${selectedAgent.name}`
          : `Run ${selectedAgent.name} on ${githubUser}/${selectedRepo} (${selectedBranch})`,
    });

    appendMessageToSession(sessionId, {
      role: 'agent',
      content: isAutomationAgent ? tx('agentsHub.automationStarting') : 'Starting agent...',
      phase: 'thinking',
    });

    try {
      if (isAutomationAgent) {
        const list = await smartAutomationsApi.list();
        const needle = extraInput?.trim().toLowerCase();
        const target = needle
          ? list.find((automation) =>
              automation.name.toLowerCase().includes(needle) ||
              automation.topics.some((topic) => topic.toLowerCase().includes(needle))
            ) ?? list.find((automation) => automation.enabled) ?? list[0]
          : list.find((automation) => automation.enabled) ?? list[0];

        if (!target) {
          throw new Error(tx('agentsHub.noAutomationFound'));
        }

        appendMessageToSession(sessionId, {
          role: 'agent',
          content: `${tx('agentsHub.automationSelected')}: ${target.name}`,
          phase: 'discovery',
        });

        const run = await smartAutomationsApi.runNow(target.id);
        if (!run.success) {
          throw new Error(run.error || 'Automation run failed');
        }

        appendMessageToSession(sessionId, {
          role: 'agent',
          content: `${tx('agentsHub.automationRunStarted')} (${run.runId.slice(0, 8)}) • ${target.name}`,
          phase: 'done',
          isSuccess: true,
          automationId: target.id,
          automationRunId: run.runId,
        });

        upsertSession(sessionId, (session) => ({
          ...session,
          automationId: target.id,
          automationRunId: run.runId,
          updatedAt: Date.now(),
        }));
        setIsRunning(false);
        notifyUser(tx('agentsHub.notification.completed'), 'success');
        finalizeCandidateBuild(sessionId, true);
        runNextQueuedItem(sessionId);
        return;
      }

      // Use the tracked activeProvider state instead of re-fetching
      // This ensures consistency between displayed models and submitted provider
      let aiProvider: AIKeyProvider | undefined = activeProvider || undefined;
      
      // Fallback: if no active provider cached, try to fetch
      if (!aiProvider) {
        try {
          const aiStatus = await getMultiProviderStatus();
          if (aiStatus.activeProvider) aiProvider = aiStatus.activeProvider;
          else if (aiStatus.providers.openai.configured) aiProvider = 'openai';
          else if (aiStatus.providers.openrouter.configured) aiProvider = 'openrouter';
        } catch { /* continue */ }
      }

      const payload: Record<string, unknown> = {
        owner: githubUser,
        repo: selectedRepo,
        baseBranch: selectedBranch,
        branchStrategy,
        dryRun: false,
        modelId: selectedModel, // This is now provider-specific
        ...(aiProvider && { aiProvider }),
      };
      
      console.log('[AgentsHubPage] Submitting job with:', { aiProvider, modelId: selectedModel });

      if (selectedAgent.id === 'trace' && extraInput) {
        payload.spec = extraInput.trim();
      } else if (selectedAgent.id === 'proto' && extraInput) {
        payload.requirements = extraInput.trim();
      } else if (selectedAgent.id === 'scribe' && extraInput?.trim()) {
        payload.taskDescription = extraInput.trim();
      }

      const response = await agentsApi.runAgent({
        type: selectedAgent.id as AgentType,
        payload,
        runtimeOverride,
      });

      upsertSession(sessionId, (session) => ({
        ...session,
        jobId: response.jobId,
        updatedAt: Date.now(),
      }));

      appendMessageToSession(sessionId, {
        role: 'agent',
        content: `Job created (${response.jobId.substring(0, 8)}). Initializing...`,
        phase: 'discovery',
        jobId: response.jobId,
      });

      let lastTraceCount = 0;
      const seenMessages = new Set<string>();

      const pollJob = async () => {
        try {
          const job = await agentsApi.getJob(response.jobId, { include: ['trace', 'artifacts'] });
          setCurrentJob(job);

          const traces = (job.trace as Array<{ title?: string; eventType?: string; detail?: string }>) || [];
          if (traces.length > lastTraceCount) {
            const newTraces = traces.slice(lastTraceCount);
            for (const trace of newTraces) {
              const content = trace.title || trace.eventType || 'Processing...';
              const msgKey = `${trace.eventType}-${content}`;
              if (!seenMessages.has(msgKey)) {
                seenMessages.add(msgKey);
                const phase = mapTraceToPhase(trace.eventType || '');
                appendMessageToSession(sessionId, {
                  role: 'agent',
                  content,
                  phase,
                });
              }
            }
            lastTraceCount = traces.length;
          }

          // Show artifacts as they appear
          const artifacts = (job.artifacts as Array<{ path?: string; artifactType?: string; preview?: string }>) || [];
          for (const artifact of artifacts) {
            if (artifact.path) {
              const artKey = `artifact-${artifact.path}`;
              if (!seenMessages.has(artKey)) {
                seenMessages.add(artKey);
                appendMessageToSession(sessionId, {
                  role: 'agent',
                  content: `File: ${artifact.path}${artifact.preview ? '\n' + artifact.preview.substring(0, 200) + (artifact.preview.length > 200 ? '...' : '') : ''}`,
                  phase: 'creating',
                  artifact: { path: artifact.path, type: artifact.artifactType || 'file' },
                });
              }
            }
          }

          if (job.state === 'completed') {
            setIsRunning(false);
            const quality = formatQualityStatus(job.qualityScore);
            appendMessageToSession(sessionId, {
              role: 'agent',
              content: quality
                ? `Agent completed successfully! Quality: ${quality}`
                : 'Agent completed successfully!',
              phase: 'done',
              isSuccess: true,
              jobId: response.jobId,
            });
            upsertSession(sessionId, (session) => ({
              ...session,
              updatedAt: Date.now(),
            }));
            notifyUser(tx('agentsHub.notification.completed'), 'success');
            finalizeCandidateBuild(sessionId, true);
            runNextQueuedItem(sessionId);
            return;
          }

          if (job.state === 'failed') {
            setIsRunning(false);
            const errMsg = job.errorMessage || job.error?.toString() || 'Job failed';
            setJobError(errMsg);
            appendMessageToSession(sessionId, {
              role: 'agent',
              content: `Failed: ${errMsg}`,
              phase: 'error',
              isError: true,
              jobId: response.jobId,
            });
            upsertSession(sessionId, (session) => ({
              ...session,
              updatedAt: Date.now(),
            }));
            notifyUser(tx('agentsHub.notification.failed'), 'error');
            finalizeCandidateBuild(sessionId, false);
            runNextQueuedItem(sessionId);
            return;
          }

          setTimeout(pollJob, 2000);
        } catch {
          setTimeout(pollJob, 4000);
        }
      };
      pollJob();
    } catch (error) {
      setIsRunning(false);
      const errMsg = error instanceof Error ? error.message : 'Failed to run agent';
      setJobError(errMsg);
      appendMessageToSession(sessionId, {
        role: 'agent',
        content: `Error: ${errMsg}`,
        phase: 'error',
        isError: true,
      });
      upsertSession(sessionId, (session) => ({
        ...session,
        updatedAt: Date.now(),
      }));
      notifyUser(tx('agentsHub.notification.failed'), 'error');
      finalizeCandidateBuild(sessionId, false);
      runNextQueuedItem(sessionId);
    }
  };

  handleRunAgentRef.current = handleRunAgent;

  const handleSend = () => {
    if (!userInput.trim()) return;
    if (isRunning) {
      const sessionId = ensureSessionForRun(userInput.trim());
      enqueueSteerMessage(sessionId, userInput.trim(), 'user_message');
      appendMessageToSession(sessionId, {
        role: 'agent',
        content: tx('agentsHub.steer.queuedInChat'),
        phase: 'discovery',
      });
      setUserInput('');
      setShowSteerMenu(false);
      return;
    }
    handleRunAgent(userInput.trim());
    setUserInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleCandidateSelection = (candidateId: string) => {
    if (!activeSessionId) return;
    setPlanCandidatesBySession((prev) => ({
      ...prev,
      [activeSessionId]: (prev[activeSessionId] ?? []).map((candidate) =>
        candidate.id === candidateId ? { ...candidate, selected: !candidate.selected } : candidate
      ),
    }));
  };

  const buildFromCandidateIds = (candidateIds: string[]) => {
    if (!activeSessionId || candidateIds.length === 0) return;
    const candidates = (planCandidatesBySession[activeSessionId] ?? []).filter((candidate) => candidateIds.includes(candidate.id));
    if (candidates.length === 0) return;

    if (isRunning) {
      for (const queued of candidates) {
        enqueueSteerMessage(activeSessionId, queued.sourceMessage, 'build_selected', queued.id);
      }
      notifyUser(tx('agentsHub.notification.buildQueue'), 'info');
      return;
    }

    const [first, ...rest] = candidates;
    setBuildingCandidateId(first.id);
    setCandidateStatus(activeSessionId, first.id, 'building');
    if (isUuid(activeSessionId)) {
      void conversationsApi
        .buildPlan(activeSessionId, { planId: first.id })
        .then((response) => {
          setCandidateStatus(activeSessionId, first.id, response.status);
        })
        .catch(() => {
          // Keep local status transitions if backend build endpoint fails.
        });
    }
    for (const queued of rest) {
      enqueueSteerMessage(activeSessionId, queued.sourceMessage, 'build_selected', queued.id);
    }

    notifyUser(
      rest.length > 0
        ? tx('agentsHub.notification.buildQueue')
        : tx('agentsHub.notification.buildStart'),
      'success'
    );

    void handleRunAgent(first.sourceMessage);
  };

  const handleBuildSelected = () => {
    const ids = selectedUnbuiltCandidates.map((candidate) => candidate.id);
    if (ids.length === 0) return;
    buildFromCandidateIds(ids);
  };

  const handleOpenQuestionPrompt = () => {
    const initialAnswers: Record<string, string> = {};
    for (const question of steerQuestions) {
      initialAnswers[question.id] = question.options[0]?.id ?? '';
    }
    setQuestionAnswers(initialAnswers);
    setQuestionStep(0);
    setShowQuestionPrompt(true);
    setShowSteerMenu(false);
  };

  const resolvePlanCount = (mode: string, input: string): number => {
    if (mode === 'always_three') return 3;
    if (mode === 'dynamic') {
      const complexity = input.trim().split(/\s+/).length;
      return complexity >= 20 ? 3 : 2;
    }
    return 1;
  };

  const submitQuestionPrompt = () => {
    if (!userInput.trim()) {
      setShowQuestionPrompt(false);
      notifyUser(tx('agentsHub.notification.missingPrompt'), 'warning');
      return;
    }

    const sessionId = ensureSessionForRun(userInput.trim());
    const planCount = resolvePlanCount(questionAnswers.plan_count || 'recommended', userInput);
    const createdPlans = createPlanCandidates(sessionId, userInput, planCount);
    appendMessageToSession(sessionId, {
      role: 'agent',
      content: tx('agentsHub.steer.planCreated').replace('{count}', String(planCount)),
      phase: 'thinking',
    });

    if (questionAnswers.delivery_mode === 'queue') {
      enqueueSteerMessage(sessionId, userInput.trim(), 'user_message');
    } else if (!isRunning) {
      const firstPlan = createdPlans[0];
      if (firstPlan) {
        setBuildingCandidateId(firstPlan.id);
        setCandidateStatus(sessionId, firstPlan.id, 'building');
      }
      void handleRunAgent(userInput.trim());
    } else {
      enqueueSteerMessage(sessionId, userInput.trim(), 'user_message');
    }

    setShowQuestionPrompt(false);
    setUserInput('');
    notifyUser(tx('agentsHub.notification.planReady'), 'success');
  };

  const handleGenerateAlternatives = () => {
    if (!userInput.trim()) {
      notifyUser(tx('agentsHub.notification.missingPrompt'), 'warning');
      return;
    }
    const sessionId = ensureSessionForRun(userInput.trim());
    createPlanCandidates(sessionId, userInput, 3);
    appendMessageToSession(sessionId, {
      role: 'agent',
      content: tx('agentsHub.steer.planCreated').replace('{count}', '3'),
      phase: 'thinking',
    });
    notifyUser(tx('agentsHub.notification.planReady'), 'success');
    setShowSteerMenu(false);
  };

  const runQueuedItemNow = (sessionId: string, itemId: string) => {
    const currentQueue = steerQueueBySession[sessionId] ?? [];
    const pickedItem = currentQueue.find((item) => item.id === itemId) ?? null;
    if (!pickedItem) return;
    updateQueue(sessionId, (prev) => prev.filter((item) => item.id !== itemId));
    setActiveSessionId(sessionId);
    const linkedSession = chatSessions.find((session) => session.id === sessionId);
    if (linkedSession) {
      const linkedAgent = builtInAgents.find((agent) => agent.id === linkedSession.agentId);
      if (linkedAgent) setSelectedAgent(linkedAgent);
    }
    if (pickedItem.candidateId) {
      setBuildingCandidateId(pickedItem.candidateId);
      setCandidateStatus(sessionId, pickedItem.candidateId, 'building');
    }
    void handleRunAgent(pickedItem.content);
  };

  const existingRunningJob = runningJobs.find(
    (job) => job.payload?.owner === githubUser && job.payload?.repo === selectedRepo
  );

  const isAutomationSelected = selectedAgent.id === 'smart-automations';
  const hasRepoContext = githubConnected && Boolean(selectedRepo) && Boolean(selectedBranch);
  const canRun = selectedAgent.status === 'available' &&
                 !isRunning &&
                 (isAutomationSelected || hasRepoContext) &&
                 (isAutomationSelected || !existingRunningJob);
  const canSend = userInput.trim().length > 0 && (canRun || isRunning);

  const agentColor = getAgentColor(selectedAgent.id);
  const currentQuality = formatQualityStatus(currentJob?.qualityScore);
  const trustBars = useMemo(() => {
    const traceEvents = Array.isArray(currentJob?.trace)
      ? (currentJob?.trace as Array<{ eventType?: string; status?: string }>)
      : [];
    const totalEvents = traceEvents.length || 1;
    const errorEvents = traceEvents.filter((event) => {
      const type = event.eventType || '';
      const status = event.status || '';
      return type.includes('error') || type.includes('fail') || status === 'failed';
    }).length;
    const aiParseErrors = traceEvents.filter((event) => (event.eventType || '') === 'ai_parse_error').length;
    const toolCalls = traceEvents.filter((event) => {
      const type = event.eventType || '';
      return type === 'tool_call' || type === 'mcp_call';
    });
    const toolFailures = toolCalls.filter((event) => event.status === 'failed').length;
    const qualityScore = typeof currentJob?.qualityScore === 'number' ? currentJob.qualityScore : null;

    const reliability = Math.max(0, Math.min(100, Math.round(100 - (errorEvents / totalEvents) * 100)));
    const hallucinationRisk = Math.max(0, Math.min(100, Math.round(10 + (aiParseErrors / totalEvents) * 90)));
    const taskSuccess = qualityScore !== null
      ? Math.max(0, Math.min(100, Math.round(qualityScore)))
      : currentJob?.state === 'completed'
        ? 80
        : currentJob?.state === 'failed'
          ? 20
          : 50;
    const toolHealth = toolCalls.length === 0
      ? 70
      : Math.max(0, Math.min(100, Math.round(100 - (toolFailures / toolCalls.length) * 100)));

    return [
      { key: 'reliability', label: tx('agentsHub.metrics.reliability'), value: reliability },
      { key: 'hallucination', label: tx('agentsHub.metrics.hallucinationRisk'), value: hallucinationRisk, inverse: true },
      { key: 'taskSuccess', label: tx('agentsHub.metrics.taskSuccess'), value: taskSuccess },
      { key: 'toolHealth', label: tx('agentsHub.metrics.toolHealth'), value: toolHealth },
    ];
  }, [currentJob, tx]);

  return (
    <div className="flex h-full">
      {/* Left Panel - Agent List */}
      <div className="w-56 flex-shrink-0 flex flex-col border-r border-ak-border bg-ak-surface">
        <div className="p-3">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-ak-bg py-2 pl-3 pr-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-ak-primary/40 border border-ak-border"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <p className="mb-1.5 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">
            Agents
          </p>
          <div className="space-y-0.5">
            {filteredAgents.map((agent) => {
              const color = getAgentColor(agent.id);
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent);
                    const latestForAgent = chatSessions.find((session) => session.agentId === agent.id);
                    setActiveSessionId(latestForAgent?.id ?? null);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150',
                    selectedAgent?.id === agent.id
                      ? 'bg-ak-surface-2 text-ak-text-primary'
                      : 'text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary'
                  )}
                >
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    selectedAgent?.id === agent.id
                      ? `${color.bg} ${color.text}`
                      : 'bg-ak-bg text-ak-text-secondary'
                  )}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-[13px]">{agent.name}</span>
                    <p className="truncate text-[11px] text-ak-text-secondary/70 leading-tight">
                      {agent.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {userConfigs.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">
                Configurations
              </p>
              <div className="space-y-0.5">
                {userConfigs.map((config) => (
                  <Link
                    key={config.id}
                    to="/agents/scribe"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ak-bg text-ak-text-secondary">
                      <ScribeIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-[13px]">Scribe Config</span>
                      <p className="truncate text-[11px] text-ak-text-secondary/70">
                        {config.repositoryOwner}/{config.repositoryName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between px-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">
                {tx('agentsHub.conversations')}
              </p>
              <button
                onClick={() => {
                  createSession(selectedAgent, userInput);
                }}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary"
              >
                {tx('agentsHub.newConversation')}
              </button>
            </div>
            {chatSessions.length === 0 ? (
              <p className="px-2 text-[11px] text-ak-text-secondary/60">{tx('agentsHub.noConversations')}</p>
            ) : (
              <div className="space-y-0.5">
                {chatSessions.map((session) => {
                  const linkedAgent = builtInAgents.find((agent) => agent.id === session.agentId) ?? selectedAgent;
                  const isActive = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-all',
                        isActive
                          ? 'bg-ak-surface-2 text-ak-text-primary'
                          : 'text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary',
                        animatedSessionId === session.id && 'ring-1 ring-ak-primary/40 animate-pulse'
                      )}
                    >
                      <div className={cn('mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg', getAgentColor(linkedAgent.id).bg, getAgentColor(linkedAgent.id).text)}>
                        {getSessionIcon(session.kind)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-ak-surface px-1 py-0.5 text-[9px] font-semibold tracking-wide text-ak-text-secondary border border-ak-border">
                            {session.typeLabel}
                          </span>
                          {session.messages.some((m) => m.isError) && (
                            <span className="rounded bg-red-500/10 px-1 py-0.5 text-[9px] font-semibold text-red-400 border border-red-500/20">
                              !
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-[12px] font-medium">
                          {session.title}
                        </p>
                        <p className={cn(
                          'truncate text-[10px]',
                          session.lastMessagePreview?.startsWith('Error:') || session.lastMessagePreview?.startsWith('Failed:')
                            ? 'text-red-400/70'
                            : 'text-ak-text-secondary/60'
                        )}>
                          {session.lastMessagePreview || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Main Panel - Chat-like Run Experience */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ak-border bg-ak-bg">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl',
              agentColor.bg, agentColor.text
            )}>
              {activeSession ? getSessionIcon(activeSession.kind) : selectedAgent.icon}
            </div>
            <div>
              <h1 className="text-base font-semibold text-ak-text-primary">
                {activeSession ? `${activeSession.typeLabel} · ${activeSession.title}` : selectedAgent.name}
              </h1>
              <p className="text-xs text-ak-text-secondary">
                {selectedAgent.description}
              </p>
              {currentQuality && (
                <span className="mt-1 inline-flex rounded-md border border-ak-primary/30 bg-ak-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-ak-primary">
                  Quality {currentQuality}
                </span>
              )}
              <div className="mt-2 grid grid-cols-2 gap-1.5 max-w-[420px]">
                {trustBars.map((metric) => {
                  const normalized = metric.inverse ? 100 - metric.value : metric.value;
                  return (
                    <div key={metric.key} className="rounded-md border border-ak-border bg-ak-surface px-2 py-1">
                      <div className="flex items-center justify-between text-[10px] text-ak-text-secondary">
                        <span>{metric.label}</span>
                        <span>{metric.value}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-ak-bg overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            normalized >= 75 ? 'bg-emerald-400' : normalized >= 45 ? 'bg-amber-400' : 'bg-red-400'
                          )}
                          style={{ width: `${normalized}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Provider Badge + Model Selector */}
            <div className="flex items-center gap-2">
              {activeProvider && (
                <span className={cn(
                  'px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide',
                  activeProvider === 'openai' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                )}>
                  {activeProvider}
                </span>
              )}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={modelsLoading}
                className={cn(
                  'rounded-lg border border-ak-border bg-ak-surface px-2.5 py-1.5 text-xs text-ak-text-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/40',
                  modelsLoading && 'opacity-50 cursor-wait'
                )}
              >
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {selectedAgent.id === 'scribe' && (
              <Link
                to="/agents/scribe"
                className="text-xs font-medium text-ak-text-secondary hover:text-ak-primary transition-colors px-2 py-1 rounded hover:bg-ak-surface-2"
              >
                Advanced Console
              </Link>
            )}
            {selectedAgent.id !== 'smart-automations' && (
              <Button
                variant="secondary"
                className="!px-2.5 !py-1.5 !text-xs"
                onClick={() => setShowSettingsDrawer(true)}
              >
                Settings
              </Button>
            )}
            {currentJob && (
              <Link
                to={`/dashboard/jobs/${currentJob.id}`}
                className="flex items-center gap-1 text-xs font-medium text-ak-primary hover:text-ak-primary/80 transition-colors px-2.5 py-1.5 rounded-lg bg-ak-primary/10 hover:bg-ak-primary/15"
              >
                View Results
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Config Panel (collapsible) */}
          {showConfig && (
            <div className="rounded-xl border border-ak-border bg-ak-surface p-4 mb-4">
              {isAutomationSelected ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ak-text-primary">{tx('agentsHub.automationExecutionTitle')}</p>
                  <p className="text-xs text-ak-text-secondary">
                    {tx('agentsHub.automationExecutionHint')}
                  </p>
                  <p className="text-[11px] text-ak-text-secondary/70">
                    {tx('agentsHub.automationExecutionHint2')}
                  </p>
                </div>
              ) : !githubConnected ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                  <span className="text-amber-400 text-sm font-medium">!</span>
                  <div>
                    <p className="text-sm font-medium text-amber-300">GitHub not connected</p>
                    <p className="text-xs text-ak-text-secondary mt-0.5">
                      <Link to="/dashboard/integrations" className="text-ak-primary hover:underline">
                        Connect GitHub
                      </Link>{' '}to run agents on your repositories.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <SearchableSelect
                      label="Repository"
                      placeholder="Select repository"
                      options={repoOptions}
                      value={selectedRepo}
                      onChange={setSelectedRepo}
                      loading={loadingRepos}
                      emptyMessage="No repositories"
                      allowManualInput={false}
                    />
                    <SearchableSelect
                      label="Base Branch"
                      placeholder="Select branch"
                      options={branchOptions}
                      value={selectedBranch}
                      onChange={setSelectedBranch}
                      loading={loadingBranches}
                      emptyMessage="No branches"
                      disabled={!selectedRepo}
                      allowManualInput={false}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer text-ak-text-secondary">
                        <input
                          type="radio"
                          name="branchStrategy"
                          value="auto"
                          checked={branchStrategy === 'auto'}
                          onChange={() => setBranchStrategy('auto')}
                          className="w-3.5 h-3.5 text-ak-primary focus:ring-ak-primary/50"
                        />
                        Auto branch
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-ak-text-secondary">
                        <input
                          type="radio"
                          name="branchStrategy"
                          value="manual"
                          checked={branchStrategy === 'manual'}
                          onChange={() => setBranchStrategy('manual')}
                          className="w-3.5 h-3.5 text-ak-primary focus:ring-ak-primary/50"
                        />
                        Manual
                      </label>
                    </div>
                    {selectedRepo && selectedBranch && (
                      <span className="text-[11px] text-ak-text-secondary/60">
                        {githubUser}/{selectedRepo} · {selectedBranch}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!isAutomationSelected && existingRunningJob && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-300">Agent already running for this repo</span>
                  <Link
                    to={`/dashboard/jobs/${existingRunningJob.id}`}
                    className="ml-auto text-xs font-medium text-ak-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              )}
            </div>
          )}

          {activePlanCandidates.length > 0 && (
            <div className="rounded-xl border border-ak-border bg-ak-surface p-3 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ak-text-primary">{tx('agentsHub.planSection.title')}</p>
                  <p className="text-[11px] text-ak-text-secondary">{tx('agentsHub.planSection.subtitle')}</p>
                </div>
                {unbuiltCandidates.length === 1 ? (
                  <Button
                    size="sm"
                    disabled={isRunning}
                    onClick={() => buildFromCandidateIds([unbuiltCandidates[0].id])}
                  >
                    {tx('agentsHub.planSection.build')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={selectedUnbuiltCandidates.length === 0}
                    onClick={handleBuildSelected}
                  >
                    {tx('agentsHub.planSection.buildSelected')}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {activePlanCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={cn(
                      'rounded-lg border px-3 py-2 flex items-center gap-3',
                      candidate.status === 'failed'
                        ? 'border-red-500/30 bg-red-500/[0.06]'
                        : candidate.status === 'built'
                          ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                          : 'border-ak-border bg-ak-bg'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={candidate.selected}
                      disabled={candidate.status !== 'unbuilt'}
                      onChange={() => toggleCandidateSelection(candidate.id)}
                      className="h-4 w-4 rounded border-ak-border bg-ak-bg text-ak-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ak-text-primary truncate">{candidate.title}</p>
                      <p className="text-[11px] text-ak-text-secondary truncate">{candidate.summary}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-ak-text-secondary/70">{candidate.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeQueue.length > 0 && activeSessionId && (
            <div className="rounded-xl border border-ak-border bg-ak-surface p-3 space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ak-text-primary">{tx('agentsHub.steer.queueTitle')}</p>
                <span className="text-[11px] text-ak-text-secondary">{tx('agentsHub.steer.queueHint')}</span>
              </div>
              <div className="space-y-1.5">
                {activeQueue.map((item, idx) => (
                  <div key={item.id} className="rounded-lg border border-ak-border bg-ak-bg px-2.5 py-2 flex items-start gap-2">
                    <div className="text-xs text-ak-text-secondary/60 mt-0.5">{idx + 1}.</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ak-text-primary truncate">{item.content}</p>
                      <p className="text-[10px] text-ak-text-secondary/60">{item.reason === 'build_selected' ? tx('agentsHub.steer.reasonBuild') : tx('agentsHub.steer.reasonMessage')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => reorderQueue(activeSessionId, item.id, 'up')} className="rounded px-1.5 py-0.5 text-xs text-ak-text-secondary hover:bg-ak-surface-2">↑</button>
                      <button onClick={() => reorderQueue(activeSessionId, item.id, 'down')} className="rounded px-1.5 py-0.5 text-xs text-ak-text-secondary hover:bg-ak-surface-2">↓</button>
                      <button onClick={() => runQueuedItemNow(activeSessionId, item.id)} className="rounded px-1.5 py-0.5 text-xs text-ak-primary hover:bg-ak-primary/10">{tx('agentsHub.steer.runNow')}</button>
                      <button onClick={() => removeQueuedItem(activeSessionId, item.id)} className="rounded px-1.5 py-0.5 text-xs text-red-300 hover:bg-red-500/10">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'agent' && (
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-mono font-bold mt-0.5',
                  agentColor.bg, agentColor.text
                )}>
                  {msg.phase && PHASE_LABELS[msg.phase] ? PHASE_LABELS[msg.phase].icon : '>'}
                </div>
              )}
              <div className={cn(
                'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-ak-primary/15 text-ak-text-primary'
                  : msg.isError
                    ? 'bg-red-500/[0.08] border border-red-500/20 text-red-300'
                    : msg.isSuccess
                      ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-300'
                      : msg.artifact
                        ? 'bg-ak-surface border border-ak-border text-ak-text-primary font-mono text-xs'
                        : 'bg-ak-surface border border-ak-border text-ak-text-primary'
              )}>
                {msg.phase && PHASE_LABELS[msg.phase] && !msg.isError && !msg.isSuccess && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-ak-text-secondary/60 block mb-0.5">
                    {PHASE_LABELS[msg.phase].label}
                  </span>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.jobId && msg.isSuccess && (
                  <Link
                    to={`/dashboard/jobs/${msg.jobId}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-ak-primary hover:text-ak-primary/80 transition-colors"
                  >
                    View Full Results
                  </Link>
                )}
                {msg.automationId && msg.automationRunId && (
                  <Link
                    to={`/agents/smart-automations/${msg.automationId}?runId=${msg.automationRunId}`}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-ak-primary hover:text-ak-primary/80 transition-colors"
                  >
                    {tx('agentsHub.openAutomationRun')}
                  </Link>
                )}
                <span className="block mt-1 text-[10px] text-ak-text-secondary/40">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {chatMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className={cn(
                'h-16 w-16 rounded-2xl flex items-center justify-center mb-4',
                agentColor.bg, agentColor.text
              )}>
                <div className="scale-150">{selectedAgent.icon}</div>
              </div>
              <h3 className="text-lg font-semibold text-ak-text-primary mb-1">{selectedAgent.name}</h3>
              <p className="text-sm text-ak-text-secondary max-w-md mb-6">{selectedAgent.description}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedAgent.capabilities.map((cap) => (
                  <span key={cap} className="px-2.5 py-1 rounded-full border border-ak-border bg-ak-surface text-xs text-ak-text-secondary">
                    {cap}
                  </span>
                ))}
              </div>
              {!selectedAgent.requiresInput && (isAutomationSelected || (githubConnected && selectedRepo)) && (
                <Button
                  onClick={() => handleRunAgent()}
                  disabled={!canRun}
                  className="mt-6 gap-2"
                >
                  Run {selectedAgent.name}
                </Button>
              )}
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 py-2 text-xs text-ak-text-secondary/60">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-1.5 w-1.5 rounded-full bg-ak-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{activeSession?.title || selectedAgent.name} is working...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div ref={inputAreaRef} className="border-t border-ak-border bg-ak-bg p-3 relative">
          {jobError && (
            <div className="mb-2 flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-xs text-red-300">
              <span>{jobError}</span>
              <button
                onClick={() => setJobError(null)}
                className="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !isAutomationSelected && !githubConnected ? 'Connect GitHub first...' :
                  selectedAgent.inputPlaceholder || `Message ${selectedAgent.name}...`
                }
                rows={1}
                className="w-full resize-none rounded-xl border border-ak-border bg-ak-surface py-2.5 pl-3.5 pr-12 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-ak-primary/40 focus:border-ak-primary/40 disabled:opacity-40 min-h-[40px] max-h-[120px]"
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  'absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors',
                  canSend
                    ? 'text-ak-primary hover:bg-ak-primary/10'
                    : 'text-ak-text-secondary/30 cursor-not-allowed'
                )}
              >
                <SendIcon />
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowSteerMenu((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary hover:bg-ak-surface-2"
                title={tx('agentsHub.steer.tooltip')}
              >
                <SteerIcon />
                {tx('agentsHub.steer.button')}
              </button>
              {showSteerMenu && (
                <div className="absolute bottom-12 right-0 z-30 w-72 rounded-xl border border-ak-border bg-ak-surface shadow-xl">
                  <button
                    onClick={() => {
                      if (!userInput.trim()) {
                        notifyUser(tx('agentsHub.notification.missingPrompt'), 'warning');
                        return;
                      }
                      const sessionId = ensureSessionForRun(userInput.trim());
                      enqueueSteerMessage(sessionId, userInput.trim(), 'user_message');
                      setUserInput('');
                      setShowSteerMenu(false);
                    }}
                    className="w-full px-3 py-2.5 text-left text-sm text-ak-text-primary hover:bg-ak-surface-2 rounded-t-xl"
                  >
                    {tx('agentsHub.steer.menu.queue')}
                  </button>
                  <button
                    onClick={handleGenerateAlternatives}
                    className="w-full px-3 py-2.5 text-left text-sm text-ak-text-primary hover:bg-ak-surface-2"
                  >
                    {tx('agentsHub.steer.menu.generatePlans')}
                  </button>
                  <button
                    onClick={handleOpenQuestionPrompt}
                    className="w-full px-3 py-2.5 text-left text-sm text-ak-text-primary hover:bg-ak-surface-2 rounded-b-xl"
                  >
                    {tx('agentsHub.steer.menu.ask')}
                  </button>
                </div>
              )}
            </div>
            {!selectedAgent.requiresInput && (
              <Button
                onClick={() => handleRunAgent(userInput.trim() || undefined)}
                disabled={!canRun}
                className="gap-1.5 whitespace-nowrap"
                size="md"
              >
                Run {selectedAgent.name}
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-ak-text-secondary/50 hover:text-ak-text-secondary transition-colors"
            >
              {showConfig ? 'Hide' : 'Show'} configuration
            </button>
            <div className="flex items-center gap-3 text-[11px] text-ak-text-secondary/40">
              {!isAutomationSelected && selectedRepo && <span>{githubUser}/{selectedRepo}</span>}
              {isRunning && (
                <span className="rounded bg-ak-surface px-2 py-0.5 text-[10px] text-ak-text-secondary">
                  {tx('agentsHub.steer.runningHint')}
                </span>
              )}
              {isRunning && (
                <button
                  onClick={() => {
                    if (currentJob) {
                      agentsApi.cancelJob(currentJob.id).catch(() => {});
                    }
                    setIsRunning(false);
                    if (activeSessionId) {
                      finalizeCandidateBuild(activeSessionId, false);
                    }
                  }}
                  className="text-red-400/60 hover:text-red-400 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showQuestionPrompt && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-3xl border border-ak-border bg-[#15171b] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-ak-text-secondary">{tx('agentsHub.steer.asking')}</p>
              <p className="text-sm text-ak-text-secondary">{questionStep + 1} {tx('agentsHub.steer.of')} {steerQuestions.length}</p>
            </div>
            <h3 className="text-3xl font-semibold text-ak-text-primary mb-4">{steerQuestions[questionStep]?.title}</h3>
            <div className="space-y-2">
              {steerQuestions[questionStep]?.options.map((option, idx) => {
                const active = questionAnswers[steerQuestions[questionStep].id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      const question = steerQuestions[questionStep];
                      setQuestionAnswers((prev) => ({ ...prev, [question.id]: option.id }));
                    }}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                      active ? 'border-ak-primary bg-ak-primary/10 text-ak-text-primary' : 'border-ak-border bg-ak-surface text-ak-text-secondary hover:bg-ak-surface-2'
                    )}
                  >
                    <p className="text-lg font-medium">{idx + 1}. {option.label}</p>
                    <p className="text-sm text-ak-text-secondary mt-1">{option.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setShowQuestionPrompt(false)}
                className="text-sm text-ak-text-secondary hover:text-ak-text-primary"
              >
                {tx('agentsHub.steer.dismiss')}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuestionStep((prev) => Math.max(0, prev - 1))}
                  disabled={questionStep === 0}
                  className="rounded-lg border border-ak-border px-3 py-1.5 text-sm text-ak-text-secondary disabled:opacity-40"
                >
                  {tx('agentsHub.steer.prev')}
                </button>
                {questionStep < steerQuestions.length - 1 ? (
                  <button
                    onClick={() => setQuestionStep((prev) => Math.min(steerQuestions.length - 1, prev + 1))}
                    className="rounded-lg bg-ak-primary px-4 py-1.5 text-sm font-medium text-ak-bg"
                  >
                    {tx('agentsHub.steer.next')}
                  </button>
                ) : (
                  <button
                    onClick={submitQuestionPrompt}
                    className="rounded-lg bg-ak-primary px-4 py-1.5 text-sm font-medium text-ak-bg"
                  >
                    {tx('agentsHub.steer.continue')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedAgent.id !== 'smart-automations' && (
        <AgentRuntimeSettingsDrawer
          open={showSettingsDrawer}
          agentType={selectedAgent.id}
          onClose={() => setShowSettingsDrawer(false)}
          onSaved={(next) =>
            setRuntimeOverride({
              runtimeProfile: next.runtimeProfile,
              temperatureValue: next.temperatureValue,
              commandLevel: next.commandLevel,
            })
          }
        />
      )}
    </div>
  );
}
