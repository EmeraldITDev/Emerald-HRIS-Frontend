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
  BookOpen
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

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Home,
    permission: "*"
  },
  { 
    title: "Employee Records", 
    url: "/employees", 
    icon: Users,
    permission: "employees.read"
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
    permission: "*"
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
  }
]

const managementItems = [
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

const systemItems = [
  { 
    title: "Reports", 
    url: "/reports", 
    icon: FileText,
    permission: "reports.view"
  },
  { 
    title: "Announcements", 
    url: "/announcements", 
    icon: MessageSquare,
    permission: "*"
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
    const visibleItems = items.filter(item => 
      item.permission === "*" || hasPermission(item.permission)
    );
    
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