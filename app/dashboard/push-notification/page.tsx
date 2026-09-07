"use client";

import { useEffect, useState } from "react";
import {
  sendNotification,
  fetchNotificationHistory,
  Notification,
  sendNotficationMobile,
} from "@/app/api/notification-api";
import { Loader, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { logAuditEvent } from "@/app/api/audit-logs-api";
import { AdminPageContent } from "@/components/admin/admin-layout";
import { AdminPageHeaderActions } from "@/components/admin/admin-page-header-provider";
import {
  AdminTableShell,
  AdminDataTableEmpty,
} from "@/components/admin/data-table";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { getNotificationStatusTone } from "@/lib/admin-status-badge";
import { formatAdminDate } from "@/lib/admin-display";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const categories = ["Orthodox", "Protestant", "Mosque", "Library", "other"];

const TARGET_OPTIONS = [
  { value: "all", label: "All users" },
  { value: "category", label: "By category" },
  { value: "referral", label: "By referral code" },
] as const;

type TargetType = (typeof TARGET_OPTIONS)[number]["value"];

const emptyForm = () => ({
  title: "",
  message: "",
  targetType: "all" as TargetType,
  selectedCategory: "",
  referralCode: "",
  isScheduled: false,
  scheduledDateTime: "",
});

export default function PushNotificationPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [history, setHistory] = useState<Notification[]>([]);
  const [isSending, setIsSending] = useState(false);

  const loadHistory = async () => {
    const data = await fetchNotificationHistory();
    setHistory(
      data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    );
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const resetForm = () => setForm(emptyForm());

  const handleClose = () => {
    setComposeOpen(false);
    resetForm();
  };

  const handleSend = async () => {
    const { title, message, targetType, selectedCategory, referralCode } = form;
    if (!title || !message) {
      toast.error("Title and message are required");
      return;
    }

    setIsSending(true);

    try {
      let target = "";
      if (targetType === "all") {
        target = "all";
      } else if (targetType === "category") {
        if (!selectedCategory) {
          toast.error("Please select a category");
          setIsSending(false);
          return;
        }
        target = selectedCategory;
      } else {
        if (!referralCode) {
          toast.error("Please enter a referral code");
          setIsSending(false);
          return;
        }
        target = referralCode;
      }

      const payload = {
        title,
        message,
        target,
        targetType,
        status: form.isScheduled ? ("Scheduled" as const) : ("Sent" as const),
        scheduledAt:
          form.isScheduled && form.scheduledDateTime
            ? new Date(form.scheduledDateTime)
            : null,
      };

      await sendNotification(payload);
      await sendNotficationMobile({
        message: payload.message,
        target: payload.target,
        targetType: payload.targetType,
        title: payload.title,
      });

      await logAuditEvent({
        action: form.isScheduled ? "NOTIFICATION_SCHEDULED" : "NOTIFICATION_SENT",
        category: "notifications",
        targetType: "Push Notification",
        targetName: payload.title,
        details: `${form.isScheduled ? "Scheduled" : "Dispatched"} push notification: "${payload.title}" to ${payload.targetType} target '${payload.target}'.`,
        metadata: { title: payload.title, target: payload.target, targetType: payload.targetType, scheduled: form.isScheduled },
        status: "success",
      });

      await loadHistory();
      toast.success(
        form.isScheduled ? "Notification scheduled" : "Notification sent"
      );
      handleClose();
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminPageContent>
      <AdminPageHeaderActions>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-primary hover:bg-transparent hover:text-primary/80"
          onClick={() => setComposeOpen(true)}
          aria-label="Compose notification"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </AdminPageHeaderActions>

      <AdminTableShell>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">Message</TableHead>
              <TableHead className="text-muted-foreground">Target</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <AdminDataTableEmpty
                colSpan={5}
                message="No notifications sent yet"
              />
            ) : (
              history.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell className="font-medium">{notif.title}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-muted-foreground">
                    {notif.message}
                  </TableCell>
                  <TableCell className="text-sm">{notif.target}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatAdminDate(notif.createdAt.toDate())}
                  </TableCell>
                  <TableCell>
                    <AdminStatusBadge
                      label={notif.status}
                      tone={getNotificationStatusTone(notif.status)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableShell>

      <Dialog open={composeOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg gap-0 p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Compose notification</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="notif-title">Title</Label>
              <Input
                id="notif-title"
                placeholder="Notification title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notif-message">Message</Label>
              <Textarea
                id="notif-message"
                placeholder="Notification message"
                value={form.message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, message: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>Target audience</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
                {TARGET_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value={option.value}
                      checked={form.targetType === option.value}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          targetType: option.value,
                        }))
                      }
                      className="accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {form.targetType === "category" && (
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.selectedCategory}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, selectedCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.targetType === "referral" && (
              <div className="space-y-2">
                <Label htmlFor="referral-code">Referral code</Label>
                <Input
                  id="referral-code"
                  value={form.referralCode}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, referralCode: e.target.value }))
                  }
                  placeholder="e.g. XYZ123"
                />
              </div>
            )}

            <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="schedule"
                  checked={form.isScheduled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      isScheduled: checked === true,
                    }))
                  }
                />
                <Label htmlFor="schedule" className="cursor-pointer font-normal">
                  Schedule notification
                </Label>
              </div>

              {form.isScheduled && (
                <Input
                  type="datetime-local"
                  value={form.scheduledDateTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      scheduledDateTime: e.target.value,
                    }))
                  }
                />
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : form.isScheduled ? (
                "Schedule"
              ) : (
                "Send notification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageContent>
  );
}
