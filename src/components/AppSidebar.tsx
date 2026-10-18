import { NavLink, useLocation } from "react-router-dom"
import {
  Users,
  Calendar,
  UserPlus,
  TrendingUp,
  Award,
  Heart,
  BarChart3,
  Shield,
  MessageSquare,
  Home,
  Clock,
  FileText,
  Settings,
  BookOpen,
  Bell,
  ShieldCheck,
  ClipboardCheck,
  Crown,
  Receipt
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import RoleBasedComponent from "./RoleBasedComponent"

// Custom Naira symbol component
const NairaIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3v18"/>
    <path d="M18 3v18"/>
    <path d="M6 9h12"/>
    <path d="M6 15h12"/>
    <path d="M9 3l6 18"/>
  </svg>
)

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { UserRole } from "@/contexts/AuthContext"

type NavItem = {
  title: string;
  url: string;
  icon: any;
  permission: string;
  roles?: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    title: "Chairman's View",
    url: "/executive",
    icon: Crown,
    permission: "*",
    roles: ['executive', 'hr_manager']
  },
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: Home,
    permission: "*"
  },
  { 
    title: "Employee Records", 
    url: "/employees", 
    icon: Users,
    permission: "employees.read",
    roles: ['executive', 'hr_manager', 'corporate_hr'] // Exclude line_manager
  },
  { 
    title: "Attendance & Leave", 
    url: "/attendance", 
    icon: Calendar,
    permission: "*"
  },
  { 
    title: "Payroll", 
    url: "/payroll", 
    icon: NairaIcon,
    permission: "*",
    roles: ['hr_manager', 'corporate_hr']
  },
  { 
    title: "Performance", 
    url: "/performance", 
    icon: TrendingUp,
    permission: "*"
  },
  { 
    title: "Training", 
    url: "/training", 
    icon: Award,
    permission: "*"
  },
  { 
    title: "Benefits", 
    url: "/benefits", 
    icon: Heart,
    permission: "benefits.view"
  },
  {
    title: "My Payslips",
    url: "/payroll/my-payslips",
    icon: Receipt,
    permission: "*",
    roles: [
      'general_employee',
      'contract_staff',
      'contract_employee',
      'contract_hr',
      'line_manager',
      'finance',
      'it_power_user',
      'corporate_hr',
      'hr_manager',
      'executive',
    ]
  },
  {
    title: "Leave Approvals",
    url: "/approvals/leave",
    icon: ShieldCheck,
    permission: "approvals.manage",
    roles: ['line_manager', 'hr_manager', 'corporate_hr', 'executive']
  },
  {
    title: "Attendance Approvals",
    url: "/approvals/attendance",
    icon: ClipboardCheck,
    permission: "approvals.manage",
    roles: ['line_manager', 'hr_manager', 'corporate_hr', 'executive']
  },
  {
    title: "Org Attendance",
    url: "/attendance/org-dashboard",
    icon: Clock,
    permission: "*",
    roles: ['hr_manager', 'corporate_hr', 'executive']
  },
  {
    title: "Announcements",
    url: "/announcements",
    icon: MessageSquare,
    permission: "*"
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: Bell,
    permission: "*"
  }
]

const managementItems: NavItem[] = [
  { 
    title: "Recruitment", 
    url: "/recruitment", 
    icon: UserPlus,
    permission: "employees.create"
  },
  { 
    title: "Analytics", 
    url: "/analytics", 
    icon: BarChart3,
    permission: "analytics.view"
  }
]

const systemItems: NavItem[] = [
  { 
    title: "Reports", 
    url: "/reports", 
    icon: FileText,
    permission: "reports.view"
  },
  { 
    title: "Policies", 
    url: "/policies", 
    icon: BookOpen,
    permission: "*"
  },
  { 
    title: "Security", 
    url: "/security", 
    icon: Shield,
    permission: "admin.troubleshoot"
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings,
    permission: "system.controls"
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const isMobile = useIsMobile()
  const { user, hasPermission } = useAuth()

  if (!user) return null

  const isActive = (path: string) => currentPath === path

  const getNavClasses = (path: string) => {
    return isActive(path) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/50 text-foreground"
  }

  const renderNavGroup = (items: typeof navigationItems, groupLabel: string, showGroup: boolean = true) => {
    const visibleItems = items.filter(item => {
      // Check permission
      const hasRequiredPermission = item.permission === "*" || hasPermission(item.permission);
      
      // Check role if roles array is specified
      const hasRequiredRole = !item.roles || item.roles.includes(user.role);
      
      return hasRequiredPermission && hasRequiredRole;
    });
    
    if (visibleItems.length === 0 || !showGroup) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-primary font-semibold text-xs">
          {!isCollapsed ? groupLabel : groupLabel.split(' ')[0]}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={`${getNavClasses(item.url)} flex items-center space-x-3 px-3 py-2 rounded-md transition-colors`}
                  >
                    <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm">{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const showManagementGroup = ['executive', 'hr_manager', 'corporate_hr', 'line_manager'].includes(user.role);

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        {renderNavGroup(navigationItems, "Main Navigation")}
        
        <RoleBasedComponent allowedRoles={['executive', 'hr_manager', 'corporate_hr', 'line_manager']}>
          {renderNavGroup(managementItems, "Management", showManagementGroup)}
        </RoleBasedComponent>
        
        {renderNavGroup(systemItems, "System Tools")}
      </SidebarContent>
    </Sidebar>
  )
}