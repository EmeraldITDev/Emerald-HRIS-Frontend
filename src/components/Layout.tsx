import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ReactNode, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, User, AlertCircle, X } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"
import { PasswordChangeModal } from "@/components/PasswordChangeModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile()
  const { user, logout } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      executive: 'Executive',
      hr_manager: 'HR Manager',
      corporate_hr: 'Corporate HR',
      line_manager: 'Line Manager',
      finance: 'Finance',
      it_admin: 'IT Admin',
      it_power_user: 'IT Power User',
      consulting_hr: 'Consulting HR',
      contract_hr: 'Contract HR',
      corporate_user: 'Corporate User',
      contract_staff: 'Contract Staff',
      contract_employee: 'Contract Employee',
      general_employee: 'Employee'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    if (['executive', 'hr_manager'].includes(role)) return 'default';
    if (['corporate_hr', 'line_manager', 'finance'].includes(role)) return 'secondary';
    if (role.includes('it_')) return 'outline';
    return 'secondary';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 md:h-16 border-b bg-card flex items-center px-3 md:px-6 shadow-sm sticky top-0 z-40">
            <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
              <SidebarTrigger className="h-8 w-8 md:h-10 md:w-10" />
              
              {/* Company Logo and Name */}
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <img 
                  src="/lovable-uploads/cbfc52d9-b5d8-4ea8-9ec0-98664ee4afad.png" 
                  alt="Emerald Industrial Co. Logo" 
                  className="h-8 md:h-10 w-auto object-contain flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm md:text-xl font-semibold text-primary truncate">
                    HRIS
                  </h1>
                  {!isMobile && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Human Resource Information System
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Welcome,</span>
                <span className="text-sm font-medium">{user?.firstName}</span>
                <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                  {getRoleDisplayName(user?.role || '')}
                </Badge>
              </div>
              
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    {!isMobile && <span className="text-sm">{user?.firstName}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Role: {getRoleDisplayName(user?.role || '')}
                    </div>
                    {user?.mustChangePassword && (
                      <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Password change required
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {user?.mustChangePassword && (
                    <>
                      <DropdownMenuItem onClick={() => setShowPasswordModal(true)}>
                        <AlertCircle className="mr-2 h-4 w-4 text-amber-600" />
                        Change Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isMobile && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          
          {/* Password Change Reminder Banner */}
          {user?.mustChangePassword && !bannerDismissed && (
            <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    For security reasons, please change your temporary password.
                  </span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-amber-900 dark:text-amber-100 underline p-0 h-auto"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change now
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={() => setBannerDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <main className="flex-1 p-3 md:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>

      <PasswordChangeModal 
        isOpen={showPasswordModal} 
        onPasswordChanged={() => {
          window.location.reload();
        }}
        onDismiss={() => setShowPasswordModal(false)}
      />
    </SidebarProvider>
  )
}