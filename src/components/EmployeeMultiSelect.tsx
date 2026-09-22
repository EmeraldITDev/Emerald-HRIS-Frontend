import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Search } from "lucide-react"

export interface SelectableEmployee {
  id?: number | string | null
  first_name?: string
  last_name?: string
  name?: string
  employee_id?: string
  department?: string
}

interface Props {
  employees: SelectableEmployee[]
  selectedIds: (number | string)[]
  onChange: (ids: any[]) => void
  loading?: boolean
  emptyMessage?: string
}

const label = (e: SelectableEmployee) =>
  e.name || [e.first_name, e.last_name].filter(Boolean).join(" ") || String(e.employee_id || e.id || "")

export function EmployeeMultiSelect({
  employees,
  selectedIds,
  onChange,
  loading,
  emptyMessage = "No employees available",
}: Props) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) =>
      [label(e), e.employee_id, e.department].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [employees, query])

  const visibleIds = filtered.map((e) => e.id!).filter((id) => id !== undefined && id !== null)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  const toggle = (id: any, checked: boolean) => {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((s) => s !== id))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID or department"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={visibleIds.length === 0}
          onClick={() =>
            onChange(
              allVisibleSelected
                ? selectedIds.filter((id) => !visibleIds.includes(id))
                : Array.from(new Set([...selectedIds, ...visibleIds])),
            )
          }
        >
          {allVisibleSelected ? "Clear" : "Select all"}
        </Button>
      </div>

      <div className="max-h-56 overflow-y-auto rounded-md border p-2">
        {loading ? (
          <p className="p-2 text-sm text-muted-foreground">Loading employees…</p>
        ) : filtered.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">
            {employees.length === 0 ? emptyMessage : "No employees match your search"}
          </p>
        ) : (
          filtered.map((employee) => {
            const id = employee.id!
            const checked = selectedIds.includes(id)
            return (
              <label
                key={String(id)}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5 hover:bg-muted/60"
              >
                <Checkbox checked={checked} onCheckedChange={(v) => toggle(id, !!v)} />
                <span className="text-sm">
                  {label(employee)}
                  {employee.employee_id ? ` · ${employee.employee_id}` : ""}
                  {employee.department ? ` — ${employee.department}` : ""}
                </span>
              </label>
            )
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground">{selectedIds.length} employee(s) selected</p>
    </div>
  )
}

export default EmployeeMultiSelect
