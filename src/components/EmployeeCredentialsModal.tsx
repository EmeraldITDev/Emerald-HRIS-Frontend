import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployeeCredentialsModalProps {
  isOpen: boolean;
  credentials: {
    email: string;
    temporary_password: string;
    role: string;
    /** True when the backend queued a "set your password" email to this address. */
    setup_email_sent?: boolean;
  } | null;
  employeeName: string;
  onClose: () => void;
}

export const EmployeeCredentialsModal: React.FC<EmployeeCredentialsModalProps> = ({
  isOpen,
  credentials,
  employeeName,
  onClose,
}) => {
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'email') {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } else {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
      }
      toast({
        title: "Copied!",
        description: `${type === 'email' ? 'Email' : 'Password'} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  if (!credentials) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Employee Account Created
          </DialogTitle>
          <DialogDescription>
            Login credentials for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Important Security Notice</p>
              <p>This password will only be shown once. Please copy and securely share with the employee. They must change it on first login.</p>
            </div>
          </div>
        </div>

        {credentials.setup_email_sent && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4 text-sm text-green-800 dark:text-green-200">
            We also emailed {credentials.email} a link to choose their own password. Share the temporary password only if the email doesn't arrive.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email / Username</Label>
            <div className="flex gap-2">
              <Input 
                value={credentials.email} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials.email, 'email')}
              >
                {emailCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <div className="flex gap-2">
              <Input 
                value={credentials.temporary_password} 
                readOnly 
                className="font-mono text-lg font-bold bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials.temporary_password, 'password')}
                className="border-yellow-300 dark:border-yellow-700"
              >
                {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role Assigned</Label>
            <Input 
              value={credentials.role.replace('_', ' ').toUpperCase()} 
              readOnly 
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="text-xs text-muted-foreground flex-1 text-left">
            Employee will be required to change password on first login
          </div>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

