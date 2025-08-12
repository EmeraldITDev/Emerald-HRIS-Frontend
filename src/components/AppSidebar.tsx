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
  Settings
} from "lucide-react"

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
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Employee Records", url: "/employees", icon: Users },
  { title: "Attendance & Leave", url: "/attendance", icon: Calendar },
  { title: "Recruitment", url: "/recruitment", icon: UserPlus },
  { title: "Payroll", url: "/payroll", icon: NairaIcon },
  { title: "Performance", url: "/performance", icon: TrendingUp },
  { title: "Training", url: "/training", icon: Award },
  { title: "Benefits", url: "/benefits", icon: Heart },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
]

const systemItems = [
  { title: "Time Tracking", url: "/time", icon: Clock },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Announcements", url: "/announcements", icon: MessageSquare },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const isMobile = useIsMobile()

  const isActive = (path: string) => currentPath === path

  const getNavClasses = (path: string) => {
    return isActive(path) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/50 text-foreground"
  }

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card border-r">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold text-xs">
            {!isCollapsed ? "Main Navigation" : "Main"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold text-xs">
            {!isCollapsed ? "System Tools" : "Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  )
}