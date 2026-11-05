import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Database,
  Settings as SettingsIcon,
  ScrollText
} from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import AuditTrailPanel from "@/components/settings/AuditTrailPanel"
import ProfileSettingsPanel from "@/components/settings/ProfileSettingsPanel"
import CompanySettingsPanel from "@/components/settings/CompanySettingsPanel"
import { DEFAULT_SETTINGS, loadUserSettings, saveUserSettings, type UserSettings } from "@/lib/userSettings"

export default function Settings() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const canViewAuditTrail = ["executive", "hr_manager", "corporate_hr", "it_power_user"].includes(
    user?.role ?? ""
  )
  const canEditSystem = ["executive", "hr_manager", "corporate_hr", "it_power_user"].includes(
    user?.role ?? ""
  )

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSettings(loadUserSettings(user?.id))
  }, [user?.id])

  const update = <K extends keyof UserSettings>(section: K, patch: Partial<UserSettings[K]>) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  }

  const handleSave = (label: string, next?: UserSettings) => {
    setLoading(true)
    try {
      const toStore = next ?? settings
      saveUserSettings(user?.id, toStore)
      toast({
        title: "Saved",
        description: `Your ${label.toLowerCase()} preferences have been updated.`
      })
    } catch {
      toast({
        title: "Could not save",
        description: "Your browser blocked saving these preferences.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your HR system configuration and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className={`grid w-full grid-cols-3 ${canViewAuditTrail ? "lg:grid-cols-7" : "lg:grid-cols-6"}`}>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system">
            <SettingsIcon className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          {canViewAuditTrail && (
            <TabsTrigger value="audit">
              <ScrollText className="h-4 w-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSettingsPanel />
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <CompanySettingsPanel />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: "email", label: "Email Notifications", hint: "Receive notifications via email" },
                  { key: "onboarding", label: "New Employee Onboarding", hint: "Notify when new employees join" },
                  { key: "leaveRequests", label: "Leave Requests", hint: "Notify about pending leave requests" },
                  { key: "payrollReminders", label: "Payroll Reminders", hint: "Remind about payroll deadlines" },
                  { key: "performanceReviews", label: "Performance Reviews", hint: "Notify about scheduled reviews" },
                  { key: "trainingReminders", label: "Training Reminders", hint: "Remind about upcoming training sessions" },
                ].map((row) => (
                  <div key={row.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{row.label}</Label>
                      <p className="text-sm text-muted-foreground">{row.hint}</p>
                    </div>
                    <Switch
                      checked={settings.notifications[row.key as keyof UserSettings["notifications"]]}
                      onCheckedChange={(v) => update("notifications", { [row.key]: v } as any)}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => handleSave("Notification")} disabled={loading}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage sign-in protection. To change your password, use the Profile tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Ask for a one-time code when you sign in</p>
                </div>
                <Switch
                  checked={settings.security.twoFactor}
                  onCheckedChange={(v) => update("security", { twoFactor: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                </div>
                <Select
                  value={settings.security.sessionTimeout}
                  onValueChange={(v) => update("security", { sessionTimeout: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSave("Security")} disabled={loading}>
                Update Security
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your HR system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(v) => {
                    update("appearance", { theme: v as UserSettings["appearance"]["theme"] })
                    setTheme(v)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.appearance.language}
                  onValueChange={(v) => update("appearance", { language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={settings.appearance.dateFormat}
                  onValueChange={(v) => update("appearance", { dateFormat: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={settings.appearance.currency}
                  onValueChange={(v) => update("appearance", { currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ngn">Nigerian Naira (₦)</SelectItem>
                    <SelectItem value="usd">US Dollar ($)</SelectItem>
                    <SelectItem value="eur">Euro (€)</SelectItem>
                    <SelectItem value="gbp">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => handleSave("Appearance")} disabled={loading}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Settings</CardTitle>
                <CardDescription>Configure payroll calculations and schedules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payroll Frequency</Label>
                  <Select
                    value={settings.system.payrollFrequency}
                    onValueChange={(v) => update("system", { payrollFrequency: v })}
                    disabled={!canEditSystem}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tax Year</Label>
                  <Select
                    value={settings.system.taxYear}
                    onValueChange={(v) => update("system", { taxYear: v })}
                    disabled={!canEditSystem}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-calculate Taxes</Label>
                    <p className="text-sm text-muted-foreground">Automatically calculate tax deductions</p>
                  </div>
                  <Switch
                    checked={settings.system.autoCalculateTaxes}
                    onCheckedChange={(v) => update("system", { autoCalculateTaxes: v })}
                    disabled={!canEditSystem}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>Configure leave policies and accruals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Annual Leave Days</Label>
                  <Input
                    type="number"
                    min={7}
                    max={18}
                    value={settings.system.annualLeaveDays}
                    onChange={(e) => update("system", { annualLeaveDays: Number(e.target.value) })}
                    disabled={!canEditSystem}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sick Leave Days</Label>
                  <Input
                    type="number"
                    value={settings.system.sickLeaveDays}
                    onChange={(e) => update("system", { sickLeaveDays: Number(e.target.value) })}
                    disabled={!canEditSystem}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Carry Forward Leave</Label>
                    <p className="text-sm text-muted-foreground">Allow unused leave to carry forward</p>
                  </div>
                  <Switch
                    checked={settings.system.carryForwardLeave}
                    onCheckedChange={(v) => update("system", { carryForwardLeave: v })}
                    disabled={!canEditSystem}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Management</CardTitle>
                <CardDescription>Configure review cycles and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Review Frequency</Label>
                  <Select
                    value={settings.system.reviewFrequency}
                    onValueChange={(v) => update("system", { reviewFrequency: v })}
                    disabled={!canEditSystem}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annual">Semi-Annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>360-Degree Reviews</Label>
                    <p className="text-sm text-muted-foreground">Enable peer and subordinate feedback</p>
                  </div>
                  <Switch
                    checked={settings.system.threeSixtyReviews}
                    onCheckedChange={(v) => update("system", { threeSixtyReviews: v })}
                    disabled={!canEditSystem}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & Backup</CardTitle>
                <CardDescription>Manage data retention and backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select
                    value={settings.system.dataRetention}
                    onValueChange={(v) => update("system", { dataRetention: v })}
                    disabled={!canEditSystem}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3years">3 Years</SelectItem>
                      <SelectItem value="5years">5 Years</SelectItem>
                      <SelectItem value="7years">7 Years</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                  </div>
                  <Switch
                    checked={settings.system.autoBackup}
                    onCheckedChange={(v) => update("system", { autoBackup: v })}
                    disabled={!canEditSystem}
                  />
                </div>
                <Button variant="outline" className="w-full" disabled>
                  <Database className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSave("System")} disabled={loading || !canEditSystem}>
              Save All System Settings
            </Button>
          </div>
        </TabsContent>

        {canViewAuditTrail && (
          <TabsContent value="audit" className="space-y-4">
            <AuditTrailPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
