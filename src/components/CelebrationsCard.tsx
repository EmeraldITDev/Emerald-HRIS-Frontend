import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Cake, Award, MessageSquare, Send, Gift, PartyPopper } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import apiService from "@/lib/api"
import { Celebration } from "@/utils/celebrations"
import { cn } from "@/lib/utils"

interface CelebrationsCardProps {
  celebrations: Celebration[]
  isLoading?: boolean
  title?: string
  className?: string
  compact?: boolean
}

export function CelebrationsCard({ 
  celebrations, 
  isLoading = false, 
  title = "This Month's Celebrations",
  className,
  compact = false
}: CelebrationsCardProps) {
  const { toast } = useToast()
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [selectedCelebration, setSelectedCelebration] = useState<Celebration | null>(null)
  const [celebrationMessage, setCelebrationMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSendMessage = async () => {
    if (!selectedCelebration || !celebrationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    try {
      await apiService.sendCelebrationMessage({
        employee_id: selectedCelebration.employee.id!,
        celebration_type: selectedCelebration.type,
        message: celebrationMessage,
        celebration_date: selectedCelebration.date.toISOString().split('T')[0],
        years_of_service: selectedCelebration.yearsOfService,
      })
      
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${selectedCelebration.employee.first_name} ${selectedCelebration.employee.last_name}`,
      })
      setShowMessageDialog(false)
      setCelebrationMessage("")
      setSelectedCelebration(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const birthdays = celebrations.filter(c => c.type === 'birthday')
  const anniversaries = celebrations.filter(c => c.type === 'anniversary')

  return (
    <>
      <Card className={cn("border-border/50 shadow-sm overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-pink-500/10 via-amber-500/10 to-purple-500/10 border-b border-border/30">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-amber-500 text-white">
              <PartyPopper className="h-4 w-4" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : celebrations.length > 0 ? (
            <div className="divide-y divide-border/50">
              {/* Birthdays Section */}
              {birthdays.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Cake className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Birthdays ({birthdays.length})
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {birthdays.map((celebration) => (
                      <CelebrationItem
                        key={`birthday-${celebration.id}-${celebration.day}`}
                        celebration={celebration}
                        onSendMessage={() => {
                          setSelectedCelebration(celebration)
                          setShowMessageDialog(true)
                        }}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Work Anniversaries Section */}
              {anniversaries.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Work Anniversaries ({anniversaries.length})
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {anniversaries.map((celebration) => (
                      <CelebrationItem
                        key={`anniversary-${celebration.id}-${celebration.day}`}
                        celebration={celebration}
                        onSendMessage={() => {
                          setSelectedCelebration(celebration)
                          setShowMessageDialog(true)
                        }}
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Gift className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">No celebrations this month</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Celebration Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedCelebration?.type === 'birthday' 
                  ? "bg-pink-500/10 text-pink-500" 
                  : "bg-amber-500/10 text-amber-500"
              )}>
                {selectedCelebration?.type === 'birthday' ? (
                  <Cake className="h-5 w-5" />
                ) : (
                  <Award className="h-5 w-5" />
                )}
              </div>
              <div>
                <DialogTitle>Send Celebration Message</DialogTitle>
                <DialogDescription className="mt-1">
                  To {selectedCelebration?.employee.first_name} {selectedCelebration?.employee.last_name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                {selectedCelebration?.type === 'birthday' 
                  ? `Celebrating their birthday on ${selectedCelebration?.displayDate}`
                  : `Celebrating ${selectedCelebration?.yearsOfService} year${selectedCelebration?.yearsOfService !== 1 ? 's' : ''} of service on ${selectedCelebration?.displayDate}`
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder={`Congratulations on your ${selectedCelebration?.type === 'birthday' ? 'birthday' : `${selectedCelebration?.yearsOfService} year work anniversary`}!`}
                value={celebrationMessage}
                onChange={(e) => setCelebrationMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowMessageDialog(false)
                setCelebrationMessage("")
                setSelectedCelebration(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={isSending || !celebrationMessage.trim()}
              className="bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface CelebrationItemProps {
  celebration: Celebration
  onSendMessage: () => void
  compact?: boolean
}

function CelebrationItem({ celebration, onSendMessage, compact }: CelebrationItemProps) {
  const isBirthday = celebration.type === 'birthday'
  
  return (
    <div className={cn(
      "group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50",
      "hover:bg-muted/50 hover:border-border transition-all duration-200",
      compact && "p-2"
    )}>
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
        isBirthday 
          ? "bg-pink-500/10 text-pink-600" 
          : "bg-amber-500/10 text-amber-600"
      )}>
        {celebration.day}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-foreground truncate", compact ? "text-sm" : "text-base")}>
          {celebration.employee.first_name} {celebration.employee.last_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {isBirthday 
            ? celebration.displayDate
            : `${celebration.yearsOfService} year${celebration.yearsOfService !== 1 ? 's' : ''} • ${celebration.displayDate}`
          }
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onSendMessage}
        className={cn(
          "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
          isBirthday 
            ? "text-pink-600 hover:text-pink-700 hover:bg-pink-500/10" 
            : "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
        )}
      >
        <MessageSquare className="h-4 w-4" />
        {!compact && <span className="ml-1">Send</span>}
      </Button>
    </div>
  )
}

export default CelebrationsCard
