import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";

export default function ProfileSettingsPanel() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: any = await apiService.getMyProfile();
        if (!cancelled) setProfile(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Your details could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const changePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: "Fill in both password fields", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "New password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "The new passwords do not match", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Use your new password next time you sign in." });
    } catch (e: any) {
      toast({
        title: "Password not changed",
        description: e?.data?.message || e?.message || "Please check your current password and try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, value: any) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value ? String(value) : "—"} readOnly className="bg-muted/50" />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your record as held by HR. Ask HR to correct anything that is out of date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {field("Employee ID", profile?.employee_code || profile?.employee_id)}
              {field("First Name", profile?.first_name)}
              {field("Middle Name", profile?.middle_name)}
              {field("Last Name", profile?.last_name)}
              {field("Email Address", profile?.email)}
              {field("Phone Number", profile?.phone || profile?.phone_number)}
              {field("Job Title", profile?.job_title || profile?.position)}
              {field("Department", profile?.department)}
              {field("Location", profile?.location)}
              {field("Employment Type", profile?.employment_type)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Set a new password for signing in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button onClick={changePassword} disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
