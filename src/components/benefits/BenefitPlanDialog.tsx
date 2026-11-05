import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarX, Pencil, RotateCcw, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EmployeeMultiSelect from "@/components/EmployeeMultiSelect"
import { useToast } from "@/hooks/use-toast"
import { apiService, type BenefitPlanInput, type Employee } from "@/lib/api"
import { formatNaira } from "@/lib/currency"
import { BENEFIT_TYPE_OPTIONS } from "./benefitTypes"

interface PlanForm {
  name: string
  benefit_type: string
  description: string
  value: string
  start_date: string
  end_date: string
  notes: string
  include_dependants: boolean
  is_recurring: boolean
  recurrence: "none" | "monthly" | "yearly"
}

const today = () => new Date().toLocaleDateString("en-CA")

const emptyForm = (benefitType: string): PlanForm => ({
  name: "",
  benefit_type: benefitType,
  description: "",
  value: "",
  start_date: today(),
  end_date: "",
  notes: "",
  include_dependants: false,
  is_recurring: false,
  recurrence: "none",
})

const formFromPlan = (plan: any): PlanForm => ({
  name: plan.name || "",
  benefit_type: plan.benefit_type || "",
  description: plan.description || "",
  value: plan.value != null ? String(plan.value) : "",
  start_date: plan.start_date || "",
  end_date: plan.end_date || "",
  notes: plan.notes || "",
  include_dependants: !!plan.include_dependants,
  is_recurring: !!plan.is_recurring,
  recurrence: plan.recurrence || "none",
})

const toPayload = (form: PlanForm): BenefitPlanInput => ({
  name: form.name.trim(),
  benefit_type: form.benefit_type,
  description: form.description.trim() || null,
  value: form.value === "" ? null : Number(form.value),
  start_date: form.start_date,
  end_date: form.end_date || null,
  notes: form.notes.trim() || null,
  include_dependants: form.include_dependants,
  is_recurring: form.is_recurring,
  recurrence: form.is_recurring ? form.recurrence : "none",
})

const memberName = (member: any) =>
  [member.employee?.first_name, member.employee?.last_name].filter(Boolean).join(" ") || `Employee #${member.employee_id}`

const isCurrent = (member: any) => member.status === "active" || member.status === "pending"

const FIELD_LABELS: Record<string, string> = {
  value: "value",
  description: "description",
  start_date: "start date",
  end_date: "end date",
  notes: "notes",
}

const sameDetail = (field: string, a: unknown, b: unknown) =>
  field === "value" ? Number(a ?? -1) === Number(b ?? -1) : (a ?? "") === (b ?? "")

interface Props {
  /** A benefit's id to open it, "new" to create one, or null when closed. */
  planId: number | "new" | null
  /** Section to preselect when creating a benefit. */
  defaultType?: string
  employees: Employee[]
  onClose: () => void
  /** Called after anything changes, so the page behind can refresh. */
  onChanged: () => void | Promise<void>
  /** Edit one person's own details in the shared edit form. */
  onEditMember: (member: any) => void
}

export function BenefitPlanDialog({ planId, defaultType = "", employees, onClose, onChanged, onEditMember }: Props) {
  const { toast } = useToast()
  const [activePlanId, setActivePlanId] = useState<number | null>(null)
  const [plan, setPlan] = useState<any | null>(null)
  const [form, setForm] = useState<PlanForm>(emptyForm(defaultType))
  const [newMemberIds, setNewMemberIds] = useState<number[]>([])
  const [tab, setTab] = useState("details")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<{ id: number; date: string } | null>(null)

  const isNew = planId === "new" && activePlanId === null

  const showError = useCallback(
    (title: string, error: unknown) => {
      toast({ title, description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" })
    },
    [toast],
  )

  const load = useCallback(
    async (id: number) => {
      setLoading(true)
      try {
        const data = await apiService.getBenefitPlan(id)
        setPlan(data)
        setForm(formFromPlan(data))
      } catch (error) {
        showError("Could not load this benefit", error)
      } finally {
        setLoading(false)
      }
    },
    [showError],
  )

  useEffect(() => {
    setNewMemberIds([])
    setRemoving(null)
    setTab("details")
    setPlan(null)

    if (typeof planId === "number") {
      setActivePlanId(planId)
      load(planId)
    } else {
      setActivePlanId(null)
      setForm(emptyForm(defaultType))
    }
  }, [planId, defaultType, load])

  const currentIds = useMemo(
    () => new Set((plan?.members || []).filter(isCurrent).map((m: any) => Number(m.employee_id))),
    [plan],
  )
  const availableEmployees = useMemo(
    () => employees.filter((e) => e.id && !currentIds.has(Number(e.id))),
    [employees, currentIds],
  )
  const duplicateIds = useMemo(() => {
    const seen = new Set<number>()
    const duplicates = new Set<number>()
    for (const member of (plan?.members || []).filter(isCurrent)) {
      const id = Number(member.employee_id)
      if (seen.has(id)) duplicates.add(id)
      seen.add(id)
    }
    return duplicates
  }, [plan])

  const set = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const refresh = async (id: number) => {
    await Promise.all([load(id), onChanged()])
  }

  const validate = (): string | null => {
    if (!form.name.trim()) return "Enter a benefit name."
    if (!form.benefit_type) return "Choose a benefit type."
    if (!form.start_date) return "Enter a start date."
    if (form.end_date && form.end_date <= form.start_date) return "The end date must be after the start date."
    return null
  }

  /** Send only what changed, so editing one detail leaves everyone's other details alone. */
  const changedFields = (): Partial<BenefitPlanInput> => {
    const next = toPayload(form) as any
    const previous = toPayload(formFromPlan(plan)) as any
    return Object.keys(next).reduce<any>((changes, key) => {
      if (next[key] !== previous[key]) changes[key] = next[key]
      return changes
    }, {})
  }

  const handleSave = async () => {
    const problem = validate()
    if (problem) {
      toast({ title: "Check the details", description: problem, variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      if (isNew) {
        const result = await apiService.createBenefitPlan({ ...toPayload(form), employee_ids: newMemberIds })
        await onChanged()
        setActivePlanId(result.plan.id)
        setNewMemberIds([])
        await load(result.plan.id)
        setTab("people")
        toast({
          title: "Benefit Created",
          description: result.skipped?.length
            ? `Created. Not added: ${result.skipped.map((s: any) => s.reason).join("; ")}`
            : `${form.name.trim()} has been created.`,
        })
        return
      }

      const changes = changedFields()
      if (Object.keys(changes).length === 0) {
        toast({ title: "Nothing to Save", description: "You have not changed anything." })
        return
      }

      // Saving for everyone replaces any detail someone has been given individually.
      const overridden = Object.keys(changes)
        .filter((field) => field in FIELD_LABELS)
        .map((field) => ({
          label: FIELD_LABELS[field],
          count: (plan?.members || []).filter(
            (member: any) => member.status !== "revoked" && !sameDetail(field, member[field], plan[field]),
          ).length,
        }))
        .filter((item) => item.count > 0)

      if (
        overridden.length > 0 &&
        !window.confirm(
          `${overridden.map((item) => `${item.count} person(s) have their own ${item.label}`).join(", ")}. Saving will replace it with the new one for everyone. Continue?`,
        )
      ) {
        return
      }

      const result = await apiService.updateBenefitPlan(activePlanId!, changes)
      await refresh(activePlanId!)
      toast({ title: "Benefit Updated", description: `Saved for ${result.updated_count} assignment(s).` })
    } catch (error) {
      showError("Could not save", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddPeople = async () => {
    setSaving(true)
    try {
      const result = await apiService.addBenefitPlanMembers(activePlanId!, newMemberIds)
      setNewMemberIds([])
      await refresh(activePlanId!)
      toast({
        title: "People Added",
        description: result.skipped?.length
          ? `${result.added_count} added. Not added: ${result.skipped.map((s: any) => s.reason).join("; ")}`
          : `${result.added_count} added to this benefit.`,
      })
    } catch (error) {
      showError("Could not add people", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!removing) return
    setSaving(true)
    try {
      await apiService.revokeBenefit(removing.id, removing.date)
      setRemoving(null)
      await refresh(activePlanId!)
      toast({ title: "Benefit Ended", description: "They have been removed. The record has been kept." })
    } catch (error) {
      showError("Could not remove them", error)
    } finally {
      setSaving(false)
    }
  }

  const handleReactivate = async (member: any) => {
    setSaving(true)
    try {
      await apiService.updateBenefit(member.id, { status: "active", end_date: null })
      await refresh(activePlanId!)
      toast({ title: "Benefit Reactivated", description: `${memberName(member)} is back on this benefit.` })
    } catch (error) {
      showError("Could not reactivate", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (member: any) => {
    if (!window.confirm(`Permanently delete this record for ${memberName(member)}? This cannot be undone. To keep the history, use Remove instead.`)) {
      return
    }
    setSaving(true)
    try {
      await apiService.deleteBenefit(member.id)
      await refresh(activePlanId!)
      toast({ title: "Record Deleted", description: `The record for ${memberName(member)} was deleted.` })
    } catch (error) {
      showError("Could not delete", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async () => {
    const count = plan?.members?.length || 0
    if (!window.confirm(`Permanently delete "${plan?.name}" and all ${count} record(s) under it? This cannot be undone. To keep the history, remove people instead.`)) {
      return
    }
    setSaving(true)
    try {
      await apiService.deleteBenefitPlan(activePlanId!)
      await onChanged()
      onClose()
      toast({ title: "Benefit Deleted", description: `${plan?.name} was deleted.` })
    } catch (error) {
      showError("Could not delete", error)
    } finally {
      setSaving(false)
    }
  }

  const detailsForm = (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plan_name">Benefit Name *</Label>
          <Input id="plan_name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g., Internet Allowance" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan_type">Benefit Type *</Label>
          <Select value={form.benefit_type} onValueChange={(value) => set("benefit_type", value)}>
            <SelectTrigger id="plan_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {BENEFIT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {form.benefit_type && !BENEFIT_TYPE_OPTIONS.some((o) => o.value === form.benefit_type) && (
                <SelectItem value={form.benefit_type}>{form.benefit_type}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan_description">Description</Label>
        <Input id="plan_description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan_value">Monetary Value (₦)</Label>
        <Input id="plan_value" type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="e.g., 50000" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plan_start">Start Date *</Label>
          <Input id="plan_start" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan_end">End Date</Label>
          <Input id="plan_end" type="date" min={form.start_date || undefined} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="flex items-start gap-2">
          <Checkbox id="plan_dependants" checked={form.include_dependants} onCheckedChange={(checked) => set("include_dependants", !!checked)} />
          <div className="flex-1">
            <Label htmlFor="plan_dependants" className="cursor-pointer font-medium">Include Dependants</Label>
            <p className="text-xs text-muted-foreground">Extend this benefit to the employee's registered dependants.</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="plan_recurring"
            checked={form.is_recurring}
            onCheckedChange={(checked) =>
              setForm((prev) => ({
                ...prev,
                is_recurring: !!checked,
                recurrence: checked ? (prev.recurrence === "none" ? "monthly" : prev.recurrence) : "none",
              }))
            }
          />
          <div className="flex-1">
            <Label htmlFor="plan_recurring" className="cursor-pointer font-medium">Recurring Benefit</Label>
            <p className="text-xs text-muted-foreground">Automatically renew this benefit on a schedule.</p>
          </div>
        </div>
        {form.is_recurring && (
          <div>
            <Label htmlFor="plan_recurrence">Recurrence</Label>
            <Select value={form.recurrence} onValueChange={(value) => set("recurrence", value as PlanForm["recurrence"])}>
              <SelectTrigger id="plan_recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan_notes">Notes</Label>
        <Input id="plan_notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes" />
      </div>
    </div>
  )

  const peopleTable = (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="hidden md:table-cell">Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(plan?.members || []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                Nobody is on this benefit yet.
              </TableCell>
            </TableRow>
          ) : (
            plan.members.map((member: any) => (
              <TableRow key={member.id} data-member={member.id}>
                <TableCell className="font-medium">
                  {memberName(member)}
                  {member.employee?.is_former && <Badge variant="outline" className="ml-2 text-[10px]">Former</Badge>}
                  {isCurrent(member) && duplicateIds.has(Number(member.employee_id)) && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">Duplicate</Badge>
                  )}
                </TableCell>
                <TableCell>{member.value != null ? formatNaira(member.value) : "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-xs">
                  {member.start_date ? new Date(member.start_date).toLocaleDateString() : "—"}
                  {member.end_date ? ` → ${new Date(member.end_date).toLocaleDateString()}` : ""}
                  {member.next_renewal_date && (
                    <div className="text-muted-foreground">Renews {new Date(member.next_renewal_date).toLocaleDateString()}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={isCurrent(member) ? "default" : "secondary"} className="capitalize">
                    {member.status === "revoked" ? "Removed" : member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {removing?.id === member.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="date"
                        aria-label="End date"
                        className="h-8 w-[150px]"
                        min={member.start_date || undefined}
                        value={removing.date}
                        onChange={(e) => setRemoving({ id: member.id, date: e.target.value })}
                      />
                      <Button size="sm" variant="destructive" disabled={saving || !removing.date} onClick={handleRemove}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" disabled={saving} onClick={() => setRemoving(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" aria-label={`Edit ${memberName(member)}`} onClick={() => onEditMember(member)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isCurrent(member) ? (
                        <Button variant="ghost" size="sm" onClick={() => setRemoving({ id: member.id, date: today() })}>
                          <CalendarX className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled={saving} onClick={() => handleReactivate(member)}>
                          <RotateCcw className="h-4 w-4 mr-1" /> Reactivate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete record for ${memberName(member)}`}
                        disabled={saving}
                        onClick={() => handleDeleteMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <Dialog open={planId !== null} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add Benefit" : plan?.name || "Benefit"}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Create a benefit and choose who is on it."
              : "Changes under Details apply to everyone on this benefit. Use People to change one person."}
          </DialogDescription>
        </DialogHeader>

        {isNew ? (
          <>
            {detailsForm}
            <div className="space-y-2">
              <Label>Add People</Label>
              <EmployeeMultiSelect employees={availableEmployees as any} selectedIds={newMemberIds} onChange={setNewMemberIds} />
            </div>
          </>
        ) : loading && !plan ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="people">People ({plan?.current_count ?? 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="details">{detailsForm}</TabsContent>
            <TabsContent value="people" className="space-y-4 pt-2">
              {peopleTable}
              <div className="space-y-2 rounded-md border p-3">
                <Label>Add People</Label>
                <EmployeeMultiSelect employees={availableEmployees as any} selectedIds={newMemberIds} onChange={setNewMemberIds} />
                <Button size="sm" disabled={saving || newMemberIds.length === 0} onClick={handleAddPeople}>
                  <UserPlus className="h-4 w-4 mr-1" /> Add {newMemberIds.length || ""} to Benefit
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {!isNew && plan ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={saving} onClick={handleDeletePlan}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete Benefit
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" disabled={saving} onClick={onClose}>
              Close
            </Button>
            {(isNew || tab === "details") && (
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving || loading} onClick={handleSave}>
                {saving ? "Saving..." : isNew ? "Create Benefit" : "Save for Everyone"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
