import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

const DashboardSettingsNotificationsPage = () => (
  <div className="space-y-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-ak-text-primary">
        Notifications
      </h1>
      <p className="text-sm text-ak-text-secondary">
        Manage email and Slack notifications for job events.
      </p>
    </header>

    <Card className="space-y-4 bg-ak-surface">
      <div className="space-y-3">
        {[
          { label: 'Job completions', defaultChecked: true },
          { label: 'Job failures', defaultChecked: true },
          { label: 'Weekly summary', defaultChecked: false },
          { label: 'Product updates', defaultChecked: false },
        ].map((option) => (
          <label
            key={option.label}
            className="flex items-center justify-between rounded-xl bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-secondary"
          >
            <span>{option.label}</span>
            <input
              type="checkbox"
              defaultChecked={option.defaultChecked}
              className="h-4 w-4 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-ak-primary"
            />
          </label>
        ))}
      </div>
      <Button className="justify-center">Save preferences</Button>
    </Card>
  </div>
);

export default DashboardSettingsNotificationsPage;

