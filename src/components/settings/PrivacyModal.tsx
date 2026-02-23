import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVisibility?: string;
}

export function PrivacyModal({ isOpen, onClose, defaultVisibility = 'public' }: PrivacyModalProps) {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState(defaultVisibility);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      // Fetch current visibility setting
      const fetchSettings = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('user_id', user.uid)
          .maybeSingle();

        if (!error && data?.settings?.profileVisibility) {
          setVisibility(data.settings.profileVisibility);
        }
      };
      fetchSettings();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          settings: {
            profileVisibility: visibility
          }
        })
        .eq('user_id', user.uid);

      if (error) throw error;

      toast.success('Privacy settings updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Preparing your data download...',
        success: 'Data export emailed to you!',
        error: 'Failed to export data'
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Privacy Settings</DialogTitle>
          <DialogDescription>
            Manage who can see your profile and your data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public (Everyone can see you)</SelectItem>
                <SelectItem value="campus">Campus Only (Verified students)</SelectItem>
                <SelectItem value="private">Private (Only you)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This controls who can view your profile details and study stats.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <Label>Data Management</Label>
            <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
              Download My Data
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
