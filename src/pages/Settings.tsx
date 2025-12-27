import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Settings, User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SettingState {
  pushNotifications: boolean;
  emailNotifications: boolean;
  studyReminders: boolean;
  darkMode: boolean;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: SettingState = {
  pushNotifications: true,
  emailNotifications: false,
  studyReminders: true,
  darkMode: true,
  compactMode: false,
};

/**
 * Settings - App configuration and preferences
 */
const SettingsPage = () => {
  const { signOut } = useAuth();

  // Initialize state from localStorage or defaults
  const [settings, setSettings] = useState<SettingState>(() => {
    const saved = localStorage.getItem('app-settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Persist settings and apply themes
  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));

    // Apply Dark Mode (Default is dark, so if !darkMode, add light-mode)
    if (!settings.darkMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }

    // Apply Compact Mode
    if (settings.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
  }, [settings]);

  const handleToggle = (key: keyof SettingState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Settings updated');
  };

  const handleLinkClick = (label: string) => {
    toast.info(`${label} coming soon!`, {
      description: "This feature is currently under development."
    });
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: User,
      settings: [
        { label: 'Edit Profile', description: 'Update your personal information', type: 'link' },
        { label: 'Change Password', description: 'Update your account password', type: 'link' },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          label: 'Push Notifications',
          description: 'Receive push notifications',
          type: 'toggle',
          key: 'pushNotifications' as keyof SettingState
        },
        {
          label: 'Email Notifications',
          description: 'Get updates via email',
          type: 'toggle',
          key: 'emailNotifications' as keyof SettingState
        },
        {
          label: 'Study Reminders',
          description: 'Daily study session reminders',
          type: 'toggle',
          key: 'studyReminders' as keyof SettingState
        },
      ]
    },
    {
      title: 'Privacy',
      icon: Shield,
      settings: [
        { label: 'Profile Visibility', description: 'Control who can see your profile', type: 'link' },
        { label: 'Data & Privacy', description: 'Manage your data preferences', type: 'link' },
      ]
    },
    {
      title: 'Appearance',
      icon: Palette,
      settings: [
        {
          label: 'Dark Mode',
          description: 'Enable dark theme',
          type: 'toggle',
          key: 'darkMode' as keyof SettingState
        },
        {
          label: 'Compact Mode',
          description: 'Reduce spacing and padding',
          type: 'toggle',
          key: 'compactMode' as keyof SettingState
        },
      ]
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/#/auth';
  };

  return (
    <PageLayout>
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Customize your KLE CONNECT experience"
        gradient="linear-gradient(135deg, hsl(217 20% 50% / 0.3), hsl(217 20% 50% / 0.1))"
      />

      <div className="space-y-6">
        {/* API Configuration for Live Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-primary/20 bg-primary/5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground font-display">Live Demo Configuration</h2>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Google Gemini API Key</label>
            <p className="text-xs text-muted-foreground mb-2">Required for AI Tutor to function in this live demo. Saved locally.</p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIza..."
                className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                defaultValue={localStorage.getItem('google-gemini-key') || ''}
                onChange={(e) => {
                  localStorage.setItem('google-gemini-key', e.target.value);
                  if (!e.target.value) localStorage.removeItem('google-gemini-key');
                }}
              />
            </div>
          </div>
        </motion.div>
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground font-display">{section.title}</h2>
            </div>

            <div className="space-y-4">
              {section.settings.map((setting) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-foreground font-medium">{setting.label}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  {setting.type === 'toggle' && setting.key && (
                    <Switch
                      checked={settings[setting.key]}
                      onCheckedChange={() => handleToggle(setting.key!)}
                    />
                  )}
                  {setting.type === 'link' && (
                    <span
                      className="text-sm text-primary cursor-pointer hover:underline"
                      onClick={() => handleLinkClick(setting.label)}
                    >
                      Edit →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="glass rounded-2xl p-6 hover:bg-red-500/10 transition-colors cursor-pointer group"
          onClick={handleSignOut}
        >
          <button className="flex items-center gap-3 text-destructive group-hover:text-red-500 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log Out</span>
          </button>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;
