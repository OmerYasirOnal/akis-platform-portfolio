import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const DashboardSettingsAiProvidersPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">AI Providers</h1>
      <p className="text-sm text-ak-text-secondary">
        Choose how Scribe accesses AI models. Phase 1 is UI-only and does not store keys.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ak-text-primary">Server Default Provider</h2>
          <p className="text-sm text-ak-text-secondary">
            Use the platform-managed provider configured via server environment variables.
          </p>
        </div>
        <span className="rounded-full border border-ak-border bg-ak-surface-2 px-3 py-1 text-xs font-semibold text-ak-text-secondary">
          Default
        </span>
      </div>
      <Button variant="outline" disabled className="justify-center">
        Using server defaults
      </Button>
    </Card>

    <Card className="space-y-4 bg-ak-surface">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-ak-text-primary">Bring Your Own Key</h2>
        <p className="text-sm text-ak-text-secondary">
          Connect your own OpenRouter or OpenAI key. Coming soon, no keys are stored yet.
        </p>
      </div>
      <Input
        label="Provider API Key"
        placeholder="sk-..."
        disabled
        description="Coming soon. Keys are not stored in Phase 1."
      />
      <Button disabled className="justify-center">
        Save key (coming soon)
      </Button>
    </Card>

    <Card className="space-y-4 bg-ak-surface">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-ak-text-primary">Platform-managed Keys</h2>
        <p className="text-sm text-ak-text-secondary">
          Paid plans will include platform-managed keys with usage controls.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-ak-border bg-ak-surface-2 px-4 py-3 text-xs text-ak-text-secondary">
        TODO: Enable plan upgrades and managed key allocation.
      </div>
    </Card>
  </div>
);

export default DashboardSettingsAiProvidersPage;
