import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiService } from '@/lib/api';
import { AlertCircle } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onPasswordChanged: () => void;
  onDismiss?: () => void; // Add optional dismiss handler
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ 
  isOpen, 
  onPasswordChanged,
  onDismiss 
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (response.message) {
        onPasswordChanged();
      }
    } catch (err) {
      setError('Failed to change password');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && onDismiss) {
        onDismiss();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Your Password</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            For security, please change your temporary password
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>New Password (min 8 characters)</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Change Password
            </Button>
            {onDismiss && (
              <Button type="button" variant="outline" onClick={onDismiss}>
                Later
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
