import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

import {
  Menu,
  Bell,
  LogOut,
  User,
  MapPin,
  Link as LinkIcon,
  Loader2,
  Save,
  XCircle,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";
import { axiosInstance as axios } from "./axios";

/* -------------------- Types -------------------- */
type CaregiverInfo = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notifications?: boolean;
  verified?: boolean;
};

type ElderlyUser = {
  userId?: string;        // backend may use this...
  elderlyUserId?: string; // ...or this...
  id?: string;            // ...or this
  name?: string;
  address?: string;
  emergencyContact?: string;
};

type ActivityItem = {
  id: string;
  description: string;
  location: string;
  volunteer: string;
  timestamp: string;
  status: "Pending" | "In Progress" | "Completed" | "Failed" | string;
};

/* -------------------- Small UI helpers -------------------- */
function StatusBadge({ status }: { status: string }) {
  const cfg =
    {
      Completed: { Icon: CheckCircle2, variant: "default" as const, label: "Completed" },
      Pending: { Icon: Clock, variant: "secondary" as const, label: "Pending" },
      "In Progress": { Icon: Activity, variant: "outline" as const, label: "In Progress" },
      Failed: { Icon: XCircle, variant: "destructive" as const, label: "Failed" },
    }[status] ?? { Icon: AlertTriangle, variant: "outline" as const, label: status };

  const { Icon, variant, label } = cfg;
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3.5 w-3.5" /> {label}
    </Badge>
  );
}

/* -------------------- Component -------------------- */
export default function CaregiverDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "live" | "profile">("overview");

  // Core state
  const [caregiverInfo, setCaregiverInfo] = useState<CaregiverInfo | null>(null);
  const [elderlyUser, setElderlyUser] = useState<ElderlyUser | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  // PIN linking
  const [pinInput, setPinInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Profile editing
  const [profileDraft, setProfileDraft] = useState<Partial<CaregiverInfo>>({});
  const [saving, setSaving] = useState(false);

  // Toast (shadcn hook)
  const { toast } = useToast();

  /* -------------------- Data load -------------------- */
  useEffect(() => {
    fetchCaregiverData();
  }, []);

  const fetchCaregiverData = async () => {
    try {
      // 1) Me (caregiver)
      const { data: me } = await axios.get("/caregiver/me");
      setCaregiverInfo(me);

      // 2) Linked elderly
      const { data: linked } = await axios.get("/caregiver/linked-elderly");
      if (Array.isArray(linked) && linked.length > 0) {
        const first = linked[0];
        setElderlyUser(first);

        // 3) History for that elderly
        const id = first.userId ?? first.elderlyUserId ?? first.id;
        const { data: history } = await axios.get(`/caregiver/history/${id}`);

        setRecentActivities(
          (history ?? []).map((h: any) => ({
            id: String(h.id ?? h.request_id ?? h.report_id ?? crypto.randomUUID?.() ?? Date.now()),
            description: h.description ?? "Report",
            location: h.location ?? "",
            volunteer: h.volunteerName ?? h.volunteer ?? "",
            timestamp: h.created_at ?? h.timestamp ?? "",
            status: h.status ?? "Completed",
          }))
        );
      } else {
        setElderlyUser(null);
        setRecentActivities([]);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Failed to load caregiver data",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    }
  };

  /* -------------------- Link by PIN -------------------- */
  const linkElderlyByPin = async () => {
    if (!pinInput) return;
    setIsLinking(true);
    try {
      await axios.post("/caregiver/link", { pin: pinInput });
      setPinInput("");
      toast({ title: "Linked!", description: "Elderly successfully linked." });
      await fetchCaregiverData();
    } catch (err: any) {
      toast({
        title: "Failed to link",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  /* -------------------- Save profile -------------------- */
  const saveProfile = async (updates: Partial<CaregiverInfo>) => {
    try {
      setSaving(true);
      await axios.patch("/caregiver/me", updates);
      toast({ title: "Saved", description: "Profile updated." });
      await fetchCaregiverData();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message ?? err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------- Renderers -------------------- */
  const renderOverview = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-lg">Linked Elderly</div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <Label className="text-xs flex items-center gap-1">
                PIN to Link <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-40"
                />
                <Button onClick={linkElderlyByPin} disabled={isLinking}>
                  {isLinking ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LinkIcon className="h-4 w-4 mr-2" />
                  )}
                  Link
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {elderlyUser ? (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <div className="font-medium">{elderlyUser.name ?? "Elderly user"}</div>
              <Badge variant="secondary">Linked</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              No elderly linked yet. Link with a PIN to begin.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold text-lg mb-2">Recent Activities</div>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              No activity yet.
            </div>
          ) : (
            recentActivities.map((a) => (
              <div key={a.id} className="flex items-start justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">{a.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.location ? (
                      <>
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {a.location} ·{" "}
                      </>
                    ) : null}
                    {a.volunteer ? <>With {a.volunteer} · </> : null}
                    {a.timestamp}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );

  const renderLive = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="font-semibold text-lg mb-2">Live Status</div>
        <div className="text-sm text-muted-foreground">
          (Your live tracking / WebSocket UI goes here.)
        </div>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="font-semibold text-lg">Caregiver Profile</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input
              value={profileDraft.name ?? caregiverInfo?.name ?? ""}
              onChange={(e) => setProfileDraft((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={profileDraft.phone ?? caregiverInfo?.phone ?? ""}
              onChange={(e) => setProfileDraft((s) => ({ ...s, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={profileDraft.email ?? caregiverInfo?.email ?? ""}
              onChange={(e) => setProfileDraft((s) => ({ ...s, email: e.target.value }))}
            />
          </div>
          <div className="flex items-center justify-between border rounded-lg p-2 mt-2">
            <div>
              <div className="font-medium">Notifications</div>
              <div className="text-xs text-muted-foreground">Enable alerts for new requests & updates</div>
            </div>
            <Switch
              checked={Boolean(profileDraft.notifications ?? caregiverInfo?.notifications)}
              onCheckedChange={(val) => setProfileDraft((s) => ({ ...s, notifications: val }))}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setProfileDraft({})} variant="outline">
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={() => saveProfile(profileDraft)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </Card>
    </div>
  );

  /* -------------------- Shell -------------------- */
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setSidebarOpen((s) => !s)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-semibold">Caregiver Dashboard</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Bell className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => navigate("/signin")}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar (placeholder) */}
      {sidebarOpen && (
        <aside className="border-b md:border-b-0 md:border-r p-4">
          <div className="text-sm text-muted-foreground">(Sidebar content)</div>
        </aside>
      )}

      {/* Tabs */}
      <div className="max-w-4xl mx-auto p-4 flex gap-2">
        {[
          { key: "overview", label: "Overview" },
          { key: "live", label: "Live" },
          { key: "profile", label: "Profile" },
        ].map((tab) => {
          const active = activeTab === (tab.key as any);
          return (
            <Button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              variant={active ? "default" : "outline"}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-4">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "live" && renderLive()}
        {activeTab === "profile" && renderProfile()}
      </main>
    </div>
  );
}
