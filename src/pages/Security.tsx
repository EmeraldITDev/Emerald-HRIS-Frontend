import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, Edit, Trash2, Shield, Eye, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AccessLevel = "Power User" | "Leadership" | "Staff";

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  accessLevel: AccessLevel;
  lastLogin: string;
  status: "Active" | "Inactive";
}

const initialUsers: User[] = [
  {
    id: "1",
    name: "John Administrator",
    email: "john.admin@company.com",
    department: "IT",
    accessLevel: "Power User",
    lastLogin: "2024-01-15 09:30",
    status: "Active"
  },
  {
    id: "2", 
    name: "Sarah Manager",
    email: "sarah.manager@company.com",
    department: "HR",
    accessLevel: "Leadership",
    lastLogin: "2024-01-15 08:45",
    status: "Active"
  },
  {
    id: "3",
    name: "Mike Employee",
    email: "mike.employee@company.com", 
    department: "Finance",
    accessLevel: "Staff",
    lastLogin: "2024-01-14 17:20",
    status: "Active"
  }
];

const Security = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccessLevelColor = (level: AccessLevel) => {
    switch (level) {
      case "Power User":
        return "destructive";
      case "Leadership":
        return "default";
      case "Staff":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getAccessLevelIcon = (level: AccessLevel) => {
    switch (level) {
      case "Power User":
        return <Settings className="h-4 w-4" />;
      case "Leadership":
        return <Shield className="h-4 w-4" />;
      case "Staff":
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const handleSaveUser = (userData: Partial<User>) => {
    if (isEditMode && selectedUser) {
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, ...userData }
          : user
      ));
      toast({
        title: "Access Level Updated",
        description: `${selectedUser.name}'s access level has been updated to ${userData.accessLevel}`,
      });
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || "",
        email: userData.email || "",
        department: userData.department || "",
        accessLevel: userData.accessLevel || "Staff",
        lastLogin: "Never",
        status: "Active"
      };
      setUsers(prev => [...prev, newUser]);
      toast({
        title: "User Added",
        description: `${newUser.name} has been added with ${newUser.accessLevel} access`,
      });
    }
    setIsDialogOpen(false);
    setSelectedUser(null);
    setIsEditMode(false);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(user => user.id !== userId));
    toast({
      title: "User Removed",
      description: `${user?.name} has been removed from the system`,
      variant: "destructive"
    });
  };

  const accessLevelDescriptions = {
    "Power User": "Full administrative access to all system features and data",
    "Leadership": "Access to manage team members and view departmental information", 
    "Staff": "View-only access to personal information and basic features"
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security & Administration</h1>
          <p className="text-muted-foreground">
            Manage user access levels and system permissions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setIsEditMode(false); setSelectedUser(null); }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <UserDialog 
            user={selectedUser}
            isEditMode={isEditMode}
            onSave={handleSaveUser}
            onClose={() => setIsDialogOpen(false)}
          />
        </Dialog>
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
                Manage user access levels and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 opacity-70" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Badge variant={getAccessLevelColor(user.accessLevel)} className="flex items-center gap-1 w-fit">
                          {getAccessLevelIcon(user.accessLevel)}
                          {user.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  <p className="text-sm text-muted-foreground mb-4">{description}</p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Permissions:</h4>
                    <ul className="text-sm space-y-1">
                      {level === "Power User" && (
                        <>
                          <li>• Full system administration</li>
                          <li>• User management</li>
                          <li>• All employee data access</li>
                          <li>• System configuration</li>
                          <li>• Reports and analytics</li>
                        </>
                      )}
                      {level === "Leadership" && (
                        <>
                          <li>• Team member data access</li>
                          <li>• Departmental reports</li>
                          <li>• Performance reviews</li>
                          <li>• Limited user management</li>
                        </>
                      )}
                      {level === "Staff" && (
                        <>
                          <li>• Personal information view</li>
                          <li>• Own attendance records</li>
                          <li>• Personal payroll information</li>
                          <li>• No editing capabilities</li>
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
    </div>
  );
};

interface UserDialogProps {
  user: User | null;
  isEditMode: boolean;
  onSave: (userData: Partial<User>) => void;
  onClose: () => void;
}

const UserDialog = ({ user, isEditMode, onSave, onClose }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
    accessLevel: user?.accessLevel || "Staff" as AccessLevel
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit User Access" : "Add New User"}</DialogTitle>
        <DialogDescription>
          {isEditMode ? "Update user access level and information" : "Add a new user to the system"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessLevel">Access Level</Label>
            <Select 
              value={formData.accessLevel} 
              onValueChange={(value: AccessLevel) => setFormData(prev => ({ ...prev, accessLevel: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Staff">Staff - View Only</SelectItem>
                <SelectItem value="Leadership">Leadership - Team Management</SelectItem>
                <SelectItem value="Power User">Power User - Full Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditMode ? "Update" : "Add"} User
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default Security;