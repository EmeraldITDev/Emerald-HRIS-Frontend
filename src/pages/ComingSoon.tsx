import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction } from "lucide-react"

interface ComingSoonProps {
  title: string
  description: string
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Construction className="mr-2 h-5 w-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground space-y-4">
            <Construction className="h-16 w-16 mx-auto text-primary/30" />
            <h3 className="text-lg font-medium">This feature is under development</h3>
            <p>We're working hard to bring you this functionality. Check back soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}