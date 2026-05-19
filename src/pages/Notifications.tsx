import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { resolveNotificationLink } from "@/lib/notificationLinks";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.getNotifications(50, 1);
      setItems(res?.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load notifications", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = items.filter((n) => (tab === "unread" ? n.is_unread || !n.read_at : true));

  const handleClick = async (n: any) => {
    try {
      if (n.is_unread || !n.read_at) await apiService.markNotificationRead(n.id);
    } catch {}
    const target = resolveNotificationLink(n);
    if (target) navigate(target);
    load();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await apiService.deleteNotification(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err?.message, variant: "destructive" });
    }
  };

  const markAll = async () => {
    try {
      await apiService.markAllNotificationsRead();
      load();
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <Button variant="outline" size="sm" onClick={markAll}>
          <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
        </Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{visible.length} notification{visible.length === 1 ? "" : "s"}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : visible.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications</p>
              ) : (
                <ul className="divide-y">
                  {visible.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`py-3 px-2 cursor-pointer hover:bg-accent/50 rounded flex gap-3 ${
                        n.is_unread || !n.read_at ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{n.message}</p>
                          {(n.is_unread || !n.read_at) && (
                            <Badge variant="secondary" className="text-[10px]">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {n.type} · {(() => {
                            try { return formatDistanceToNow(new Date(n.created_at), { addSuffix: true }); } catch { return ""; }
                          })()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => handleDelete(e, n.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}