import { NavLink, useLocation } from "react-router-dom"
import {
  Users,
  Calendar,
  UserPlus,
  DollarSign,
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

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Employee Records", url: "/employees", icon: Users },
  { title: "Attendance & Leave", url: "/attendance", icon: Calendar },
  { title: "Recruitment", url: "/recruitment", icon: UserPlus },
  { title: "Payroll", url: "/payroll", icon: DollarSign },
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
          <SidebarGroupLabel className="text-primary font-semibold">
            Main Navigation
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
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            System Tools
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
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
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