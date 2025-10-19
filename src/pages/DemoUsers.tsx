import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, LogIn, Users2, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Demo users organized by department
const demoUsersByDepartment = {
  'Executive': [
    { email: 'bunmi.babajide@emeraldcfze.com', name: 'Bunmi Babajide', role: 'Executive', password: 'password123' },
    { email: 'laa@emeraldcfze.com', name: 'LAA Executive', role: 'Executive', password: 'password123' },
  ],
  'Human Resources': [
    { email: 'austin.nwachwukwu@emeraldcfze.com', name: 'Austin Nwachwukwu', role: 'HR Manager', password: 'password123' },
    { email: 'oluwapelumi.adeyefa@emeraldcfze.com', name: 'Oluwapelumi Adeyefa', role: 'Corporate HR', password: 'password123' },
  ],
  'Technical Operations': [
    { email: 'henry.marcus@emeraldcfze.com', name: 'Henry Marcus', role: 'Line Manager', password: 'password123' },
    { email: 'chidi.okonkwo@emeraldcfze.com', name: 'Chidi Okonkwo', role: 'Employee', password: 'password123' },
    { email: 'contractor@emeraldcfze.com', name: 'Samson Contractor', role: 'Contract Staff', password: 'password123' },
  ],
  'Business Development': [
    { email: 'aisha.bello@emeraldcfze.com', name: 'Aisha Bello', role: 'Line Manager', password: 'password123' },
    { email: 'kunle.adeyemi@emeraldcfze.com', name: 'Kunle Adeyemi', role: 'Employee', password: 'password123' },
  ],
  'Finance': [
    { email: 'temitope.lawal@emeraldcfze.com', name: 'Temitope Lawal', role: 'Line Manager', password: 'password123' },
    { email: 'rachael.daniel@emeraldcfze.com', name: 'Rachael Daniel', role: 'Finance Staff', password: 'password123' },
    { email: 'adeniyi.bamigbade@emeraldcfze.com', name: 'Adeniyi Bamigbade', role: 'Finance Staff', password: 'password123' },
  ],
  'IT': [
    { email: 'it@emeraldcfze.com', name: 'Ibrahim Suleiman', role: 'IT Line Manager', password: 'password123' },
    { email: 'chioma.nwosu@emeraldcfze.com', name: 'Chioma Nwosu', role: 'IT Power User', password: 'password123' },
  ],
  'Operations': [
    { email: 'folake.williams@emeraldcfze.com', name: 'Folake Williams', role: 'Line Manager', password: 'password123' },
    { email: 'yusuf.mohammed@emeraldcfze.com', name: 'Yusuf Mohammed', role: 'Employee', password: 'password123' },
  ],
  'Marketing': [
    { email: 'ngozi.eze@emeraldcfze.com', name: 'Ngozi Eze', role: 'Line Manager', password: 'password123' },
    { email: 'segun.oladipo@emeraldcfze.com', name: 'Segun Oladipo', role: 'Employee', password: 'password123' },
  ],
  'Sales': [
    { email: 'amina.yusuf@emeraldcfze.com', name: 'Amina Yusuf', role: 'Line Manager', password: 'password123' },
    { email: 'tunde.akinola@emeraldcfze.com', name: 'Tunde Akinola', role: 'Employee', password: 'password123' },
  ],
  'Customer Service': [
    { email: 'blessing.okoro@emeraldcfze.com', name: 'Blessing Okoro', role: 'Line Manager', password: 'password123' },
    { email: 'daniel.agu@emeraldcfze.com', name: 'Daniel Agu', role: 'Employee', password: 'password123' },
  ],
  'Procurement': [
    { email: 'fatima.abdullahi@emeraldcfze.com', name: 'Fatima Abdullahi', role: 'Line Manager', password: 'password123' },
    { email: 'emeka.okeke@emeraldcfze.com', name: 'Emeka Okeke', role: 'Employee', password: 'password123' },
  ],
};

const getRoleBadgeColor = (role: string) => {
  if (role.includes('Executive')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
  if (role.includes('Manager') || role.includes('HR')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  if (role.includes('Finance')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
  if (role.includes('IT')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
  if (role.includes('Contract')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
};

export default function DemoUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleQuickLogin = async (email: string, password: string, name: string) => {
    const success = await login(email, password);
    if (success) {
      toast({
        title: "Logged in successfully!",
        description: `Welcome back, ${name}`,
      });
      navigate('/');
    } else {
      toast({
        title: "Login failed",
        description: "Unable to log in with these credentials.",
        variant: "destructive"
      });
    }
  };

  // Filter departments and users based on search
  const filteredDepartments = Object.entries(demoUsersByDepartment).reduce((acc, [dept, users]) => {
    const filteredUsers = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredUsers.length > 0) {
      acc[dept] = filteredUsers;
    }
    return acc;
  }, {} as typeof demoUsersByDepartment);

  const totalUsers = Object.values(demoUsersByDepartment).flat().length;
  const totalDepartments = Object.keys(demoUsersByDepartment).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">HRIS Demo Users</h1>
                <p className="text-sm text-muted-foreground">
                  Click any user to instantly log in and explore their view
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalDepartments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Levels</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">5+</div>
              <p className="text-xs text-muted-foreground">Role types</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, role, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Department Cards */}
        <div className="space-y-6">
          {Object.entries(filteredDepartments).map(([department, users]) => (
            <Card key={department}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle>{department}</CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {users.length} {users.length === 1 ? 'User' : 'Users'}
                  </Badge>
                </div>
                <CardDescription>
                  Department hierarchy with line managers and employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {users.map((user) => (
                    <Card
                      key={user.email}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleQuickLogin(user.email, user.password, user.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{user.name}</h4>
                            <p className="text-xs text-muted-foreground truncate mb-2">
                              {user.email}
                            </p>
                          </div>
                          <LogIn className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(filteredDepartments).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No users found matching your search.</p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">About Department Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Executive & HR Managers:</strong> Full system access, can view and manage all departments
            </p>
            <p>
              <strong>Line Managers:</strong> Department-specific access, can only view and manage employees within their department
            </p>
            <p>
              <strong>Employees:</strong> Self-service access, can view their own information and department data
            </p>
            <p className="pt-2 text-xs">
              All demo accounts use password: <code className="bg-background px-1 py-0.5 rounded">password123</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
