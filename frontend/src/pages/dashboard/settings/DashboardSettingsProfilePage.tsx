import { useState, useEffect } from 'react';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { settingsApi, type UserProfile } from '../../../services/api/settings';

// Check icon
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Warning icon
const WarningIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

export default function DashboardSettingsProfilePage() {
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await settingsApi.getProfile();
        setProfile(data);
        setName(data.name);
      } catch (err) {
        setError('Failed to load profile. Please try again.');
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  // Handle profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!name.trim()) {
      setProfileError('Name is required');
      return;
    }

    setSavingProfile(true);
    try {
      await settingsApi.updateProfile({ name: name.trim() });
      setProfileSuccess('Profile updated successfully!');
      // Update local profile state
      if (profile) {
        setProfile({ ...profile, name: name.trim() });
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await settingsApi.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully!');
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
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
          <h1 className="text-2xl font-semibold text-ak-text-primary">Profile Settings</h1>
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
        <h1 className="text-2xl font-semibold text-ak-text-primary">Profile Settings</h1>
        <p className="text-sm text-ak-text-secondary">
          Manage your personal information and account credentials.
        </p>
      </header>

      {/* Profile Information */}
      <Card className="bg-ak-surface">
        <h2 className="text-lg font-semibold text-ak-text-primary mb-4">Profile Information</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            value={profile?.email || ''}
            disabled
            description="Email cannot be changed. Contact support if you need to update your email."
          />
          <div className="flex items-center gap-2 text-sm">
            {profile?.emailVerified ? (
              <span className="flex items-center gap-1 text-green-400">
                <CheckIcon /> Email verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-400">
                <WarningIcon /> Email not verified
              </span>
            )}
          </div>

          {profileError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {profileSuccess}
            </div>
          )}

          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </Card>

      {/* Change Password */}
      <Card className="bg-ak-surface">
        <h2 className="text-lg font-semibold text-ak-text-primary mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            description="Must be at least 8 characters with uppercase, lowercase, and number"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />

          {passwordError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {passwordSuccess}
            </div>
          )}

          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </form>
      </Card>

      {/* Account Info */}
      <Card className="bg-ak-surface">
        <h2 className="text-lg font-semibold text-ak-text-primary mb-4">Account Information</h2>
        <div className="space-y-2 text-sm text-ak-text-secondary">
          <p><span className="text-ak-text-primary">Account ID:</span> {profile?.id.slice(0, 8)}...</p>
          <p><span className="text-ak-text-primary">Status:</span> {profile?.status}</p>
          <p><span className="text-ak-text-primary">Member since:</span> {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </Card>
    </div>
  );
}
