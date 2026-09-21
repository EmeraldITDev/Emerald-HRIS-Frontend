import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, RefreshCw, Search } from "lucide-react";
import apiService from "@/lib/api";

interface AuditRow {
  id: number | string;
  created_at?: string;
  user?: any;
  user_name?: string;
  action?: string;
  description?: string;
  auditable_type?: string;
  auditable_id?: number | string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  [key: string]: any;
}

const prettify = (value: string | undefined) =>
  String(value ?? "")
    .split(/[.\\\\]/)
    .pop()!
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

function ChangeTable({ oldValues, newValues }: { oldValues: any; newValues: any }) {
  const keys = Array.from(
    new Set([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]),
  );
  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">No field-level changes were recorded.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{prettify(key)}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatValue(oldValues?.[key])}
              </TableCell>
              <TableCell>{formatValue(newValues?.[key])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AuditTrailPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiService.getAuditLogs({ per_page: 50 });
      const list =
        (Array.isArray(res) && res) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.data?.data) && res.data.data) ||
        (Array.isArray(res?.logs) && res.logs) ||
        [];
      setRows(list as AuditRow[]);
    } catch (e: any) {
      setError(e?.data?.message || e?.message || "The activity history could not be loaded.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.action,
        r.description,
        r.auditable_type,
        r.user_name,
        r.user?.name,
        r.user?.email,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Who changed what, and what the value was before and after.</CardDescription>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by person, action or record"
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No recorded activity yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => {
                  const key = String(row.id);
                  const isOpen = expanded === key;
                  return (
                    <>
                      <TableRow
                        key={key}
                        className="cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : key)}
                      >
                        <TableCell>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.user_name || row.user?.name || row.user?.email || "System"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{prettify(row.action) || "Updated"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {prettify(row.auditable_type)}
                          {row.auditable_id ? ` #${row.auditable_id}` : ""}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow key={`${key}-detail`}>
                          <TableCell colSpan={5} className="bg-muted/40">
                            <div className="space-y-3 p-2">
                              {row.description && <p className="text-sm">{row.description}</p>}
                              <ChangeTable oldValues={row.old_values} newValues={row.new_values} />
                              {row.ip_address && (
                                <p className="text-xs text-muted-foreground">
                                  Recorded from {row.ip_address}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
