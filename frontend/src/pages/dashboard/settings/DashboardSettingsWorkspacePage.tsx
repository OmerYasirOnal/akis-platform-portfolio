import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { settingsApi, type Workspace } from '../../../services/api/settings';

// Warning icon
const WarningIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// Close icon
const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function DashboardSettingsWorkspacePage() {
  const navigate = useNavigate();

  // Workspace state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workspace form state
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load workspace on mount
  useEffect(() => {
    async function loadWorkspace() {
      try {
        const data = await settingsApi.getWorkspace();
        setWorkspace(data);
        setName(data.name);
      } catch (err) {
        setError('Failed to load workspace. Please try again.');
        console.error('Failed to load workspace:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, []);

  // Clear success message
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Handle workspace save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (!name.trim()) {
      setSaveError('Workspace name is required');
      return;
    }

    setSaving(true);
    try {
      await settingsApi.updateWorkspace({ name: name.trim() });
      setSaveSuccess('Workspace updated successfully!');
      if (workspace) {
        setWorkspace({ ...workspace, name: name.trim() });
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete account
  const handleDelete = async () => {
    setDeleteError(null);

    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setDeleting(true);
    try {
      await settingsApi.deleteWorkspace({
        confirmation: 'DELETE MY ACCOUNT',
        password: deletePassword || undefined,
      });
      // Redirect to login after deletion
      navigate('/login?deleted=true');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-ak-text-primary">Workspace Settings</h1>
        </header>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">Workspace Settings</h1>
        <p className="text-sm text-ak-text-secondary">
          Manage workspace metadata and lifecycle controls.
        </p>
      </header>

      {/* Workspace Info */}
      <Card className="bg-ak-surface">
        <h2 className="text-lg font-semibold text-ak-text-primary mb-4">Workspace Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Workspace Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
          />
          <Input
            label="Workspace ID"
            value={workspace?.id || ''}
            disabled
            description="Read-only identifier"
          />
          <Input
            label="Owner"
            value={workspace?.ownerEmail || ''}
            disabled
          />
          <div className="flex items-center gap-2 text-sm text-ak-text-secondary">
            <span className="rounded-full bg-ak-primary/10 px-2 py-0.5 text-xs font-medium text-ak-primary">
              {workspace?.plan?.toUpperCase() || 'FREE'} Plan
            </span>
            <span>•</span>
            <span>Created {workspace?.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>

          {saveError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {saveSuccess}
            </div>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Workspace'}
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-ak-surface">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-ak-text-secondary mb-4">
          Once you delete your account, there is no going back. All your data, integrations, and agent configurations will be permanently removed.
        </p>
        <Button
          variant="outline"
          onClick={() => setShowDeleteModal(true)}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          Delete Account
        </Button>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-ak-surface p-6 shadow-ak-lg">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-400">
                <WarningIcon />
                <h2 className="text-xl font-bold">Delete Account</h2>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="text-ak-text-secondary hover:text-ak-text-primary disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-sm text-ak-text-secondary">
                This action <strong className="text-red-400">cannot be undone</strong>. This will permanently delete your account and remove all associated data including:
              </p>
              <ul className="list-disc list-inside text-sm text-ak-text-secondary space-y-1">
                <li>All integration connections (GitHub, Jira, Confluence)</li>
                <li>Stored API keys</li>
                <li>Agent configurations</li>
                <li>Job history</li>
              </ul>

              <div className="space-y-3">
                <Input
                  label='Type "DELETE MY ACCOUNT" to confirm'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  disabled={deleting}
                />
                <Input
                  label="Enter your password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  description="Required for accounts with a password"
                  disabled={deleting}
                />
              </div>

              {deleteError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDelete}
                  disabled={deleting || deleteConfirmation !== 'DELETE MY ACCOUNT'}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
