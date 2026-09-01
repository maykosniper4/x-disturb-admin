"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  FileText,
  Lock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Eye,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  content: string;
  items: string[];
  order: number;
}

export interface LegalDocument {
  id: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  updatedBy?: string;
}

const DEFAULT_DOCUMENTS: Record<string, LegalDocument> = {
  data_and_security: {
    id: "data_and_security",
    title: "Data & Security",
    lastUpdated: new Date().toISOString(),
    sections: [
      {
        id: "ds_sec_1",
        title: "Data Protection & Encryption",
        content: "We use industry-standard security protocols to safeguard your information:",
        order: 0,
        items: [
          "All network communication is encrypted using TLS 1.3 encryption in transit.",
          "Sensitive authentication tokens and preferences are stored securely on your device using encrypted storage.",
          "Geofence coordinates are validated and processed using zero-knowledge location triggers.",
        ],
      },
      {
        id: "ds_sec_2",
        title: "Account & Access Security",
        content: "Strict authentication protocols protect your account access:",
        order: 1,
        items: [
          "Secure SMS OTP authentication prevents unauthorized password breaches.",
          "Role-based access control restricts administrative zone controls to verified administrators.",
          "Automated session timeout and token refresh safeguards against replay attacks.",
        ],
      },
      {
        id: "ds_sec_3",
        title: "Data Retention & Audit",
        content: "We follow strict data minimization and audit trail practices:",
        order: 2,
        items: [
          "Transient location telemetry is pruned immediately after zone detection evaluation.",
          "Account update and security activity logs are recorded for safety and audit purposes.",
          "Users can clear activity history or purge cached records at any time.",
        ],
      },
    ],
  },
  user_agreement: {
    id: "user_agreement",
    title: "User Agreement",
    lastUpdated: new Date().toISOString(),
    sections: [
      {
        id: "ua_sec_1",
        title: "What you agree to",
        content: "By using XDisturb, you agree to:",
        order: 0,
        items: [
          "Manage your silent zones responsibly and accurately",
          "Understand that sound changes only occur inside designated active zones",
          "Keep required background location and notification permissions enabled for proper operation",
        ],
      },
      {
        id: "ua_sec_2",
        title: "What you cannot do",
        content: "Users are strictly prohibited from the following activities:",
        order: 1,
        items: [
          "Do not tamper with, reverse engineer, or decompile the app",
          "Do not misuse, scrape, or extract institutional zone data without authorization",
          "Do not use the application to disrupt, harass, or interfere with other users",
        ],
      },
      {
        id: "ua_sec_3",
        title: "Violations & Enforcement",
        content: "We take compliance and community guidelines seriously:",
        order: 2,
        items: [
          "Violating these terms may result in immediate account suspension or termination.",
          "Unauthorized administrative changes will be logged and subject to legal review.",
        ],
      },
    ],
  },
  privacy_policy: {
    id: "privacy_policy",
    title: "Privacy Policy",
    lastUpdated: new Date().toISOString(),
    sections: [
      {
        id: "pp_sec_1",
        title: "What Data We Collect",
        content: "We collect limited information required to provide silent zone automation:",
        order: 0,
        items: [
          "Location data (used strictly to identify and trigger silent zones)",
          "Subscription and payment status information",
          "Device diagnostics and app performance data",
        ],
      },
      {
        id: "pp_sec_2",
        title: "What We Do With Your Data",
        content: "We respect your privacy and handle data with strict confidentiality:",
        order: 1,
        items: [
          "We never sell, rent, or share your personal data with third parties.",
          "Location data is processed temporarily in real-time to automate sound profiles.",
          "Payment data is securely processed via certified payment gateways (e.g., Chapa).",
        ],
      },
      {
        id: "pp_sec_3",
        title: "How Can You Control Your Data?",
        content: "You maintain full control over your personal data at all times:",
        order: 2,
        items: [
          "You can request account deletion or data wipe at any time from the app settings.",
          "You can revoke location or notification permissions via your device settings.",
        ],
      },
    ],
  },
};

const DOC_CONFIGS = [
  {
    id: "data_and_security",
    name: "Data & Security",
    description: "Encryption, device storage, and account security details shown on mobile.",
    icon: Lock,
    color: "text-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  {
    id: "user_agreement",
    name: "User Agreement",
    description: "Terms of service, usage guidelines, and violations policy.",
    icon: FileText,
    color: "text-purple-500",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200",
  },
  {
    id: "privacy_policy",
    name: "Privacy Policy",
    description: "Data collection, location processing, and data rights disclosed to users.",
    icon: ShieldCheck,
    color: "text-blue-500",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
];

export default function LegalDocumentsManager() {
  const [selectedDocId, setSelectedDocId] = useState("data_and_security");
  const [documents, setDocuments] = useState<Record<string, LegalDocument>>(DEFAULT_DOCUMENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const loaded: Record<string, LegalDocument> = { ...DEFAULT_DOCUMENTS };

    try {
      for (const config of DOC_CONFIGS) {
        const docRef = doc(db, "app_legal_content", config.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<LegalDocument>;
          loaded[config.id] = {
            id: config.id,
            title: data.title || DEFAULT_DOCUMENTS[config.id].title,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            sections: Array.isArray(data.sections)
              ? (data.sections as LegalSection[]).sort((a, b) => (a.order || 0) - (b.order || 0))
              : DEFAULT_DOCUMENTS[config.id].sections,
            updatedBy: data.updatedBy,
          };
        }
      }
      setDocuments(loaded);
    } catch (err: any) {
      console.error("Error fetching legal documents from Firestore:", err);
      toast.error("Failed to load legal documents from database. Showing default templates.");
    } finally {
      setLoading(false);
    }
  };

  const currentDoc = documents[selectedDocId] || DEFAULT_DOCUMENTS[selectedDocId];

  const updateCurrentDoc = (updater: (prev: LegalDocument) => LegalDocument) => {
    setDocuments((prev) => ({
      ...prev,
      [selectedDocId]: updater(prev[selectedDocId] || DEFAULT_DOCUMENTS[selectedDocId]),
    }));
  };

  const handleTitleChange = (val: string) => {
    updateCurrentDoc((doc) => ({ ...doc, title: val }));
  };

  const handleAddSection = () => {
    updateCurrentDoc((doc) => {
      const newSec: LegalSection = {
        id: `sec_${Date.now()}`,
        title: `Section ${doc.sections.length + 1}`,
        content: "",
        items: ["New point or policy detail..."],
        order: doc.sections.length,
      };
      return { ...doc, sections: [...doc.sections, newSec] };
    });
  };

  const handleRemoveSection = (secIndex: number) => {
    updateCurrentDoc((doc) => {
      const filtered = doc.sections.filter((_, idx) => idx !== secIndex);
      return {
        ...doc,
        sections: filtered.map((s, idx) => ({ ...s, order: idx })),
      };
    });
  };

  const handleMoveSection = (fromIndex: number, toIndex: number) => {
    updateCurrentDoc((doc) => {
      if (toIndex < 0 || toIndex >= doc.sections.length) return doc;
      const reordered = [...doc.sections];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return {
        ...doc,
        sections: reordered.map((s, idx) => ({ ...s, order: idx })),
      };
    });
  };

  const handleSectionFieldChange = (
    secIndex: number,
    field: "title" | "content",
    val: string
  ) => {
    updateCurrentDoc((doc) => {
      const updated = [...doc.sections];
      updated[secIndex] = { ...updated[secIndex], [field]: val };
      return { ...doc, sections: updated };
    });
  };

  const handleAddItem = (secIndex: number) => {
    updateCurrentDoc((doc) => {
      const updated = [...doc.sections];
      const items = [...updated[secIndex].items, ""];
      updated[secIndex] = { ...updated[secIndex], items };
      return { ...doc, sections: updated };
    });
  };

  const handleRemoveItem = (secIndex: number, itemIndex: number) => {
    updateCurrentDoc((doc) => {
      const updated = [...doc.sections];
      const items = updated[secIndex].items.filter((_, idx) => idx !== itemIndex);
      updated[secIndex] = { ...updated[secIndex], items };
      return { ...doc, sections: updated };
    });
  };

  const handleItemChange = (secIndex: number, itemIndex: number, val: string) => {
    updateCurrentDoc((doc) => {
      const updated = [...doc.sections];
      const items = [...updated[secIndex].items];
      items[itemIndex] = val;
      updated[secIndex] = { ...updated[secIndex], items };
      return { ...doc, sections: updated };
    });
  };

  const handleResetToDefault = () => {
    if (confirm(`Reset "${DOC_CONFIGS.find((c) => c.id === selectedDocId)?.name}" to default template?`)) {
      setDocuments((prev) => ({
        ...prev,
        [selectedDocId]: {
          ...DEFAULT_DOCUMENTS[selectedDocId],
          lastUpdated: new Date().toISOString(),
        },
      }));
      toast.info("Reset to default template. Click 'Save & Publish' to save changes to Firestore.");
    }
  };

  const handleSaveToFirestore = async () => {
    setSaving(true);
    try {
      const docToSave: LegalDocument = {
        ...currentDoc,
        lastUpdated: new Date().toISOString(),
      };

      const docRef = doc(db, "app_legal_content", selectedDocId);
      await setDoc(docRef, docToSave, { merge: true });

      setDocuments((prev) => ({ ...prev, [selectedDocId]: docToSave }));
      toast.success(`${docToSave.title} published to Firebase successfully! Mobile app will update live.`);
    } catch (err: any) {
      console.error("Error saving document to Firestore:", err);
      toast.error(err?.message || "Failed to save document to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const currentConfig = DOC_CONFIGS.find((c) => c.id === selectedDocId) || DOC_CONFIGS[0];
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="border-border shadow-sm bg-gradient-to-r from-primary/5 via-card to-card">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Mobile App Legal Content & Policies
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  Live Firestore Sync
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Edit Data Security, User Agreement, and Privacy Policy details. Changes stream live to customer mobile devices.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Default
            </Button>
            <Button
              size="sm"
              onClick={handleSaveToFirestore}
              disabled={saving || loading}
              className="gap-2 text-xs font-semibold"
            >
              <Save className="h-4 w-4" />
              {saving ? "Publishing..." : "Save & Publish to App"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DOC_CONFIGS.map((docConfig) => {
          const isSelected = selectedDocId === docConfig.id;
          const DocIcon = docConfig.icon;
          const docData = documents[docConfig.id] || DEFAULT_DOCUMENTS[docConfig.id];
          const totalPoints = docData.sections.reduce((acc, s) => acc + s.items.length, 0);

          return (
            <div
              key={docConfig.id}
              onClick={() => setSelectedDocId(docConfig.id)}
              className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "bg-card border-primary ring-1 ring-primary shadow-sm"
                  : "bg-card/60 hover:bg-card border-border/70 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <DocIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{docConfig.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {docData.sections.length} sections • {totalPoints} points
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] px-2 py-0.5">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Document Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${currentConfig.color}`} />
                    Edit {currentConfig.name} Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {currentConfig.description}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSection}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Document Header Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Mobile Page Title
                </label>
                <Input
                  value={currentDoc.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Data & Security"
                  className="font-medium"
                />
              </div>

              <Separator className="my-4" />

              {/* Sections List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Content Sections ({currentDoc.sections.length})
                  </span>
                </div>

                {currentDoc.sections.map((section, secIdx) => (
                  <div
                    key={section.id || secIdx}
                    className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3.5 hover:border-border transition-colors"
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {secIdx + 1}
                        </span>
                        <Input
                          value={section.title}
                          onChange={(e) => handleSectionFieldChange(secIdx, "title", e.target.value)}
                          placeholder="Section Header Title..."
                          className="h-8 font-semibold text-sm bg-background flex-1"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={secIdx === 0}
                          onClick={() => handleMoveSection(secIdx, secIdx - 1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          disabled={secIdx === currentDoc.sections.length - 1}
                          onClick={() => handleMoveSection(secIdx, secIdx + 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveSection(secIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Section Intro / Paragraph */}
                    <div>
                      <label className="text-[11px] text-muted-foreground block mb-1 font-medium">
                        Intro / Summary Line (Optional)
                      </label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => handleSectionFieldChange(secIdx, "content", e.target.value)}
                        placeholder="e.g. By using XDisturb, you agree to the following terms..."
                        rows={2}
                        className="text-xs bg-background resize-none"
                      />
                    </div>

                    {/* Bullet Points Items */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-medium text-muted-foreground">
                          Bullet Points / Items ({section.items.length})
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddItem(secIdx)}
                          className="h-6 text-[11px] text-primary hover:text-primary gap-1 px-2"
                        >
                          <Plus className="h-3 w-3" />
                          Add Point
                        </Button>
                      </div>

                      {section.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-start gap-2">
                          <span className="text-muted-foreground text-sm mt-1.5">•</span>
                          <Input
                            value={item}
                            onChange={(e) => handleItemChange(secIdx, itemIdx, e.target.value)}
                            placeholder="Enter policy detail..."
                            className="text-xs bg-background h-8"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => handleRemoveItem(secIdx, itemIdx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Mobile App Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-border/70">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Live Mobile App Preview
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  Real-time Preview
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Mock Mobile Screen Frame */}
              <div className="rounded-2xl border-2 border-border/80 bg-card p-4 shadow-inner space-y-4 max-h-[650px] overflow-y-auto">
                {/* Mobile App Bar */}
                <div className="text-center pb-3 border-b border-border/60">
                  <h4 className="text-base font-bold text-foreground font-sans">
                    {currentDoc.title || "Document Title"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Last updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Rendered Mobile Sections */}
                <div className="space-y-5">
                  {currentDoc.sections.map((section, idx) => (
                    <div key={section.id || idx} className="space-y-2">
                      <h5 className="text-sm font-bold text-foreground">
                        {section.title || `Section ${idx + 1}`}
                      </h5>
                      {section.content && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {section.content}
                        </p>
                      )}
                      <ul className="space-y-1.5 pt-1">
                        {section.items.filter((item) => item.trim().length > 0).map((item, iIdx) => (
                          <li key={iIdx} className="text-xs text-foreground/90 flex items-start gap-2 leading-snug">
                            <span className="text-primary font-bold text-sm leading-none">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {idx < currentDoc.sections.length - 1 && (
                        <Separator className="mt-3 opacity-60" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
