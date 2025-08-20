import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile()

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
                <span className="text-xs md:text-sm text-muted-foreground">HR Department</span>
              </div>
              <ThemeToggle />
              {isMobile && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          
          <main className="flex-1 p-3 md:p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}