import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Settings, User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

/**
 * Settings - App configuration and preferences
 */
const SettingsPage = () => {
  const { signOut } = useAuth();

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
        { label: 'Push Notifications', description: 'Receive push notifications', type: 'toggle', enabled: true },
        { label: 'Email Notifications', description: 'Get updates via email', type: 'toggle', enabled: false },
        { label: 'Study Reminders', description: 'Daily study session reminders', type: 'toggle', enabled: true },
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
        { label: 'Dark Mode', description: 'Enable dark theme', type: 'toggle', enabled: true },
        { label: 'Compact Mode', description: 'Reduce spacing and padding', type: 'toggle', enabled: false },
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
                  {setting.type === 'toggle' && (
                    <Switch defaultChecked={setting.enabled} />
                  )}
                  {setting.type === 'link' && (
                    <span className="text-sm text-primary cursor-pointer hover:underline">Edit →</span>
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
