import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trash2, Shield, Eye, Settings, RefreshCw, UserX, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";

type AccessLevel = "Power User" | "Leadership" | "Line Manager" | "Staff";

interface SystemUser {
  id: number | string;
  name: string;
  email: string;
  department: string;
  role: string;
  accessLevel: AccessLevel;
  lastLogin: string;
  status: "Active" | "Inactive";
}

const LEADERSHIP_ROLES = ["executive", "hr_manager"];
const POWER_ROLES = ["it_power_user", "it_admin"];

const prettyRole = (role: string) =>
  String(role || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "General Employee";

const toAccessLevel = (role: string): AccessLevel => {
  const r = String(role || "").toLowerCase();
  if (POWER_ROLES.includes(r)) return "Power User";
  if (LEADERSHIP_ROLES.includes(r)) return "Leadership";
  if (r === "line_manager") return "Line Manager";
  return "Staff";
};

const normalizeUser = (raw: any): SystemUser => {
  const role = raw?.role ?? raw?.user_role ?? raw?.roles?.[0] ?? "";
  const name =
    raw?.name ??
    [raw?.first_name, raw?.last_name].filter(Boolean).join(" ") ??
    raw?.employee?.full_name ??
    "";
  const active =
    raw?.is_active ?? raw?.active ?? (raw?.status ? String(raw.status).toLowerCase() === "active" : true);
  const last = raw?.last_login_at ?? raw?.last_login ?? raw?.last_seen_at;
  return {
    id: raw?.id ?? raw?.user_id,
    name: name || raw?.email || "Unnamed user",
    email: raw?.email ?? "—",
    department: raw?.department ?? raw?.employee?.department ?? "—",
    role: String(role || ""),
    accessLevel: toAccessLevel(String(role || "")),
    lastLogin: last ? new Date(last).toLocaleString() : "Never",
    status: active ? "Active" : "Inactive",
  };
};

const getAccessLevelColor = (level: AccessLevel) => {
  switch (level) {
    case "Power User":
      return "destructive" as const;
    case "Leadership":
      return "default" as const;
    default:
      return "secondary" as const;
  }
};

const getAccessLevelIcon = (level: AccessLevel) => {
  switch (level) {
    case "Power User":
      return <Settings className="h-4 w-4" />;
    case "Leadership":
      return <Shield className="h-4 w-4" />;
    case "Line Manager":
      return <Users className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
};

const accessLevelDescriptions: Record<AccessLevel, string> = {
  "Power User": "IT administrators with full system access and troubleshooting capabilities",
  Leadership: "Executives and HR Manager with full management access",
  "Line Manager": "Department managers with team oversight and approval capabilities",
  Staff: "General employees including Corporate HR and contract staff with personal information access",
};

const Security = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SystemUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await apiService.getSystemUsers({ per_page: 200 });
      const list =
        (Array.isArray(res) && res) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.data?.data) && res.data.data) ||
        (Array.isArray(res?.users) && res.users) ||
        [];
      setUsers((list as any[]).map(normalizeUser).filter((u) => u.id !== undefined));
    } catch (e: any) {
      setLoadError(e?.data?.message || e?.message || "We couldn't load the user list.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.department, prettyRole(u.role)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [users, searchTerm]);

  const handleDeactivate = async (user: SystemUser) => {
    setBusyId(String(user.id));
    try {
      await apiService.deactivateSystemUser(user.id);
      toast({ title: "Access suspended", description: `${user.name} can no longer sign in.` });
      await load();
    } catch (e: any) {
      toast({
        title: "Could not suspend access",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const user = pendingDelete;
    setBusyId(String(user.id));
    try {
      await apiService.deleteSystemUser(user.id);
      setPendingDelete(null);
      toast({ title: "User removed", description: `${user.name} has been removed from the system.` });
      await load();
    } catch (e: any) {
      toast({
        title: "Could not remove user",
        description: e?.data?.message || e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security &amp; Administration</h1>
          <p className="text-muted-foreground">Manage who can sign in and what they can reach</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2 w-fit">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="permissions">Access Levels</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Access Management</CardTitle>
              <CardDescription>
                Accounts come from employee records. Suspend access or remove an account permanently.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, department or role"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : loadError ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{loadError}</p>
                  <Button variant="outline" onClick={load}>
                    Try again
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {users.length === 0 ? "No user accounts yet." : "No users match your search."}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Access Level</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={String(user.id)}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>{prettyRole(user.role)}</TableCell>
                          <TableCell>
                            <Badge variant={getAccessLevelColor(user.accessLevel)} className="flex w-fit items-center gap-1">
                              {getAccessLevelIcon(user.accessLevel)}
                              {user.accessLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{user.lastLogin}</TableCell>
                          <TableCell>
                            <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === String(user.id) || user.status === "Inactive"}
                                onClick={() => handleDeactivate(user)}
                                title="Suspend sign-in access"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busyId === String(user.id)}
                                onClick={() => setPendingDelete(user)}
                                title="Remove account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.entries(accessLevelDescriptions) as [AccessLevel, string][]).map(([level, description]) => (
              <Card key={level}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getAccessLevelIcon(level)}
                    {level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">{description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Permissions:</h4>
                    <ul className="space-y-1 text-sm">
                      {level === "Power User" && (
                        <>
                          <li>• Full system administration</li>
                          <li>• System troubleshooting</li>
                          <li>• Override system controls</li>
                          <li>• Technical configuration</li>
                        </>
                      )}
                      {level === "Leadership" && (
                        <>
                          <li>• All employee data access</li>
                          <li>• Full payroll management</li>
                          <li>• Financial reporting</li>
                          <li>• Approvals and reviews</li>
                        </>
                      )}
                      {level === "Line Manager" && (
                        <>
                          <li>• Team member data access</li>
                          <li>• Leave approvals</li>
                          <li>• Performance reviews</li>
                          <li>• Departmental oversight</li>
                        </>
                      )}
                      {level === "Staff" && (
                        <>
                          <li>• Personal information view</li>
                          <li>• Own payroll information</li>
                          <li>• Benefits and leave requests</li>
                          <li>• Training access</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their account and sign-in access. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove user</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Security;
