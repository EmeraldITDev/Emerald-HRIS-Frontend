import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { resolveNotificationLink } from "@/lib/notificationLinks";

interface Notification {
  id: number;
  type: string;
  message: string;
  link?: string | null;
  read_at?: string | null;
  is_unread?: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCount = useCallback(async () => {
    try {
      const res = await apiService.getUnreadNotificationCount();
      setUnread(res.unread_count || 0);
    } catch {
      // silent — backend may not be ready
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiService.getNotifications(5, 1);
      setItems(res?.data || []);
      if (typeof res?.unread_count === "number") setUnread(res.unread_count);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const handleClickItem = async (n: Notification) => {
    try {
      if (n.is_unread || !n.read_at) {
        await apiService.markNotificationRead(n.id);
        setUnread((u) => Math.max(0, u - 1));
      }
    } catch {}
    setOpen(false);
    const target = resolveNotificationLink(n);
    if (target) navigate(target);
  };

  const handleMarkAll = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setUnread(0);
      setItems((arr) => arr.map((i) => ({ ...i, read_at: new Date().toISOString(), is_unread: false })));
    } catch {}
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await apiService.deleteNotification(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch {}
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          <Button variant="ghost" size="sm" onClick={handleMarkAll} className="h-7 text-xs">
            <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  className={`px-3 py-2 cursor-pointer hover:bg-accent/50 flex gap-2 ${
                    n.is_unread || !n.read_at ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(() => {
                        try {
                          return formatDistanceToNow(new Date(n.created_at), { addSuffix: true });
                        } catch {
                          return "";
                        }
                      })()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
                    onClick={(e) => handleDelete(e, n.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}