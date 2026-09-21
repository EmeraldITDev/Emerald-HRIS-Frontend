import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY } from "@/constants/company";

export default function CompanySettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          The details used on payslips, reports and letters. Editing these from here is not
          available yet — tell HR IT and they will update them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={COMPANY.logoUrl}
            alt={`${COMPANY.name} logo`}
            className="h-16 w-16 rounded-md object-contain"
          />
          <div>
            <p className="font-medium">{COMPANY.name}</p>
            <p className="text-sm text-muted-foreground">{COMPANY.website}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" value={COMPANY.name} readOnly className="bg-muted/50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Company Address</Label>
          <Textarea id="address" value={COMPANY.address} readOnly className="bg-muted/50" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={COMPANY.website} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hrEmail">HR Email</Label>
            <Input id="hrEmail" value={COMPANY.email} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={COMPANY.timezone} readOnly className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value={COMPANY.currency} readOnly className="bg-muted/50" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
