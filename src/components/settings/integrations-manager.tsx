"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  MessageCircle,
  BarChart3,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Send,
  Zap,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  OrgIntegrationsConfig,
  WhatsAppProvider,
} from "@/types/crm";
import {
  saveWhatsAppIntegration,
  saveGoogleAdsIntegration,
  saveMetaAdsIntegration,
  rotateWebhookToken,
  sendWhatsAppMessage,
} from "@/lib/actions/integrations";

interface Props {
  initialConfig: OrgIntegrationsConfig | null;
  appUrl?: string;
}

export function IntegrationsManager({ initialConfig, appUrl = "http://localhost:3000" }: Props) {
  const [activeTab, setActiveTab] = useState<"website" | "whatsapp" | "google_ads" | "meta_ads">("website");
  const [config, setConfig] = useState<OrgIntegrationsConfig | null>(initialConfig);

  // Copied states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // WhatsApp form state
  const [waProvider, setWaProvider] = useState<WhatsAppProvider>(config?.whatsappProvider || "WATI");
  const [waApiKey, setWaApiKey] = useState(config?.whatsappApiKey || "");
  const [waApiUrl, setWaApiUrl] = useState(config?.whatsappApiUrl || "");
  const [waPhoneNumber, setWaPhoneNumber] = useState(config?.whatsappPhoneNumber || "");
  const [waInstanceId, setWaInstanceId] = useState(config?.whatsappInstanceId || "");
  const [waEnabled, setWaEnabled] = useState(config?.whatsappEnabled ?? false);
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [waStatusMsg, setWaStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Test WhatsApp send
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Hello! This is a test message from your CRM integration.");
  const [isSendingWaTest, setIsSendingWaTest] = useState(false);
  const [waTestResult, setWaTestResult] = useState<string | null>(null);

  // Google Ads form state
  const [gCustomerId, setGCustomerId] = useState(config?.googleAdsCustomerId || "");
  const [gDevToken, setGDevToken] = useState(config?.googleAdsDeveloperToken || "");
  const [gClientId, setGClientId] = useState(config?.googleAdsClientId || "");
  const [gClientSecret, setGClientSecret] = useState(config?.googleAdsClientSecret || "");
  const [gRefreshToken, setGRefreshToken] = useState(config?.googleAdsRefreshToken || "");
  const [gEnabled, setGEnabled] = useState(config?.googleAdsEnabled ?? false);
  const [isSavingG, setIsSavingG] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [gStatusMsg, setGStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Meta Ads form state
  const [metaToken, setMetaToken] = useState(config?.metaAdsAccessToken || "");
  const [metaAccountId, setMetaAccountId] = useState(config?.metaAdsAccountId || "");
  const [metaAppId, setMetaAppId] = useState(config?.metaAdsAppId || "");
  const [metaEnabled, setMetaEnabled] = useState(config?.metaAdsEnabled ?? false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [metaStatusMsg, setMetaStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Webhook lead test
  const [isSendingLeadTest, setIsSendingLeadTest] = useState(false);
  const [leadTestStatus, setLeadTestStatus] = useState<string | null>(null);

  // Rotating token
  const [isRotating, setIsRotating] = useState(false);

  const webhookToken = config?.webhookToken || "crm_token_default";
  const webhookUrl = `${appUrl}/api/v1/webhook/${webhookToken}`;
  const incomingWaWebhookUrl = `${appUrl}/api/v1/whatsapp/webhook?org=${config?.orgSlug || "business"}`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test Webhook Lead
  const handleTestLeadSubmit = async () => {
    setIsSendingLeadTest(true);
    setLeadTestStatus(null);
    try {
      const res = await fetch(`/api/v1/webhook/${webhookToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Rohit Sharma (Test Webhook)",
          phone: "+919876543210",
          email: "rohit.test@example.com",
          company: "Acme Web Solutions",
          notes: "Testing form lead integration from CRM Connect Hub",
          budget: 50000,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeadTestStatus(`✅ Success! Test lead captured (ID: ${data.leadId?.slice(0, 8)}...). Check Form Leads tab!`);
      } else {
        setLeadTestStatus(`❌ Failed: ${data.error || "Could not ingest lead"}`);
      }
    } catch (e: any) {
      setLeadTestStatus(`❌ Error sending test: ${e.message}`);
    } finally {
      setIsSendingLeadTest(false);
    }
  };

  // Rotate Webhook Token
  const handleRotateToken = async () => {
    if (!confirm("Are you sure you want to rotate your webhook token? Any existing website forms using the old URL will need to be updated.")) {
      return;
    }
    setIsRotating(true);
    const res = await rotateWebhookToken();
    if (res.success && res.token && config) {
      setConfig({ ...config, webhookToken: res.token });
    }
    setIsRotating(false);
  };

  // Save WhatsApp
  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWa(true);
    setWaStatusMsg(null);
    const res = await saveWhatsAppIntegration({
      provider: waProvider,
      apiKey: waApiKey,
      apiUrl: waApiUrl,
      phoneNumber: waPhoneNumber,
      instanceId: waInstanceId,
      enabled: waEnabled,
    });
    setIsSavingWa(false);
    if (res.success) {
      setWaStatusMsg({ text: res.message || "Saved successfully!", type: "success" });
    } else {
      setWaStatusMsg({ text: res.error || "Failed to save", type: "error" });
    }
  };

  // Send WhatsApp Test
  const handleSendWaTest = async () => {
    if (!testPhone) {
      alert("Please enter a test phone number with country code (e.g. +919876543210)");
      return;
    }
    setIsSendingWaTest(true);
    setWaTestResult(null);
    try {
      const res = await sendWhatsAppMessage({
        phone: testPhone,
        message: testMessage,
      });
      if (res.success) {
        setWaTestResult("✅ WhatsApp message dispatched successfully! Check recipient's WhatsApp.");
      } else {
        setWaTestResult(`⚠️ Dispatch attempted. Provider note: ${res.error || "Logged into CRM history"}`);
      }
    } catch (e: any) {
      setWaTestResult(`❌ Error: ${e.message}`);
    } finally {
      setIsSendingWaTest(false);
    }
  };

  // Save Google Ads
  const handleSaveGoogleAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingG(true);
    setGStatusMsg(null);
    const res = await saveGoogleAdsIntegration({
      customerId: gCustomerId,
      developerToken: gDevToken,
      clientId: gClientId,
      clientSecret: gClientSecret,
      refreshToken: gRefreshToken,
      enabled: gEnabled,
    });
    setIsSavingG(false);
    if (res.success) {
      setGStatusMsg({ text: res.message || "Google Ads config saved!", type: "success" });
    } else {
      setGStatusMsg({ text: res.error || "Failed to save", type: "error" });
    }
  };

  // Trigger Google Ads Sync
  const handleSyncGoogleAds = async () => {
    setIsSyncingGoogle(true);
    try {
      const res = await fetch("/api/v1/ads/google", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setGStatusMsg({ text: `✅ Sync Complete! ${data.count} campaigns synchronized. View them in /app/ads`, type: "success" });
      } else {
        setGStatusMsg({ text: `❌ Sync error: ${data.error}`, type: "error" });
      }
    } catch (err: any) {
      setGStatusMsg({ text: `❌ Sync failed: ${err.message}`, type: "error" });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Save Meta Ads
  const handleSaveMetaAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeta(true);
    setMetaStatusMsg(null);
    const res = await saveMetaAdsIntegration({
      accessToken: metaToken,
      accountId: metaAccountId,
      appId: metaAppId,
      enabled: metaEnabled,
    });
    setIsSavingMeta(false);
    if (res.success) {
      setMetaStatusMsg({ text: res.message || "Meta Ads config saved!", type: "success" });
    } else {
      setMetaStatusMsg({ text: res.error || "Failed to save", type: "error" });
    }
  };

  // Trigger Meta Ads Sync
  const handleSyncMetaAds = async () => {
    setIsSyncingMeta(true);
    try {
      const res = await fetch("/api/v1/ads/meta", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetaStatusMsg({ text: `✅ Sync Complete! ${data.count} Meta campaigns synchronized. View them in /app/ads`, type: "success" });
      } else {
        setMetaStatusMsg({ text: `❌ Sync error: ${data.error}`, type: "error" });
      }
    } catch (err: any) {
      setMetaStatusMsg({ text: `❌ Sync failed: ${err.message}`, type: "error" });
    } finally {
      setIsSyncingMeta(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation Pill Bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("website")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "website"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Globe className="h-4 w-4" />
          Website Form Leads
          <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded-full bg-blue-500/20 text-blue-100 font-semibold">
            Webhook
          </span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "whatsapp"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp API
          {config?.whatsappEnabled ? (
            <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded-full bg-emerald-400 text-emerald-950 font-bold">
              Active
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-500">
              Setup
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("google_ads")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "google_ads"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Google Ads Live
          {config?.googleAdsEnabled && (
            <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded-full bg-amber-400 text-amber-950 font-bold">
              Connected
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("meta_ads")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "meta_ads"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Share2 className="h-4 w-4" />
          Meta (FB & Insta) Ads
          {config?.metaAdsEnabled && (
            <span className="ml-1 px-1.5 py-0.5 text-[11px] rounded-full bg-indigo-400 text-indigo-950 font-bold">
              Connected
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: WEBSITE FORM LEADS (WEBHOOK)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "website" && (
        <div className="space-y-6">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border-b border-blue-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Website Form Leads Integration
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-0.5">
                      Fetch leads instantly from any website (WordPress, Elementor, Webflow, Custom HTML, Contact Form 7, WPForms) directly into this CRM.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1 font-semibold text-xs flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  CORS Enabled • Instant Lead Capture
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Webhook URL Box */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Your Organization Webhook URL (Paste this in your form settings)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="w-full font-mono text-xs text-gray-800 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 pr-20 select-all focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(webhookUrl, "webhook")}
                      className="absolute right-1.5 top-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1"
                    >
                      {copiedKey === "webhook" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedKey === "webhook" ? "Copied!" : "Copy URL"}
                    </button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRotating}
                    onClick={handleRotateToken}
                    className="text-xs text-gray-600 hover:text-gray-900 shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRotating ? "animate-spin" : ""}`} />
                    Regenerate Token
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supports POST with JSON, standard FormData, or URL-encoded form data. CORS is enabled, so forms can submit directly without backend proxies.
                </p>
              </div>

              {/* Test Lead Simulator */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Test Lead Ingestion (1-Click Simulator)
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Click the button below to simulate an incoming lead submission and verify that leads appear in your CRM dashboard.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleTestLeadSubmit}
                    disabled={isSendingLeadTest}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs shrink-0"
                  >
                    <Send className={`h-3.5 w-3.5 mr-1.5 ${isSendingLeadTest ? "animate-spin" : ""}`} />
                    {isSendingLeadTest ? "Sending..." : "Send Test Lead"}
                  </Button>
                </div>
                {leadTestStatus && (
                  <p className="text-xs font-semibold mt-3 p-2 rounded-lg bg-white border border-blue-200 text-gray-800">
                    {leadTestStatus}
                  </p>
                )}
              </div>

              {/* Guide Accordions for popular site builders */}
              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-gray-900">
                  Easy Setup Guides for Website Forms
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Elementor Pro */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-100 text-pink-700 font-bold text-xs">
                        E
                      </span>
                      <h5 className="text-xs font-bold text-gray-900">Elementor Pro Forms</h5>
                    </div>
                    <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside pl-1">
                      <li>Edit your Form widget in Elementor.</li>
                      <li>Go to <strong>Actions After Submit</strong> → add <strong>Webhook</strong>.</li>
                      <li>Open the new <strong>Webhook</strong> tab that appears below.</li>
                      <li>Paste your <strong>Organization Webhook URL</strong> in the Webhook URL field.</li>
                      <li>Save & publish! Every submission will directly populate in CRM.</li>
                    </ol>
                  </div>

                  {/* Contact Form 7 / WPForms / HTML */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 font-bold text-xs">
                        CF
                      </span>
                      <h5 className="text-xs font-bold text-gray-900">Custom HTML / JavaScript / WPForms</h5>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      You can also POST directly from JavaScript or your contact page:
                    </p>
                    <div className="relative">
                      <pre className="text-[11px] font-mono bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
{`fetch("${webhookUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fullName: "John Doe",
    phone: "+919876543210",
    email: "john@example.com",
    message: "Need a website quote"
  })
});`}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(`fetch("${webhookUrl}", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({\n    fullName: "John Doe",\n    phone: "+919876543210",\n    email: "john@example.com",\n    message: "Need a website quote"\n  })\n});`, "jsCode")}
                        className="absolute right-2 top-2 px-2 py-1 text-[10px] font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
                      >
                        {copiedKey === "jsCode" ? "Copied!" : "Copy Code"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto-detected fields summary */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <h5 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Auto-Detected Form Fields (No strict naming required):
                  </h5>
                  <p className="text-xs text-gray-500">
                    Our API intelligently normalizes fields like <code className="bg-white px-1 py-0.5 border rounded">name</code>, <code className="bg-white px-1 py-0.5 border rounded">fullName</code>, <code className="bg-white px-1 py-0.5 border rounded">your-name</code>, <code className="bg-white px-1 py-0.5 border rounded">phone</code>, <code className="bg-white px-1 py-0.5 border rounded">mobile</code>, <code className="bg-white px-1 py-0.5 border rounded">email</code>, <code className="bg-white px-1 py-0.5 border rounded">message</code>, <code className="bg-white px-1 py-0.5 border rounded">budget</code>, and <code className="bg-white px-1 py-0.5 border rounded">company</code>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: WHATSAPP API INTEGRATION (WATI / AISENSY / TWILIO)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "whatsapp" && (
        <div className="space-y-6">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border-b border-emerald-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      WhatsApp Business API Integration
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-0.5">
                      Connect your Wati, AiSensy, Twilio, or Custom WhatsApp API to receive leads on WhatsApp, send 1-click messages, and auto-alert yourself on new leads.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-700">Integration Status:</label>
                  <button
                    type="button"
                    onClick={() => setWaEnabled(!waEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      waEnabled ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        waEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold ${waEnabled ? "text-emerald-600" : "text-gray-400"}`}>
                    {waEnabled ? "ENABLED" : "DISABLED"}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* WhatsApp Config Form */}
              <form onSubmit={handleSaveWhatsApp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      WhatsApp Provider *
                    </label>
                    <select
                      value={waProvider}
                      onChange={(e) => setWaProvider(e.target.value as WhatsAppProvider)}
                      className="w-full text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="WATI">Wati.io (India Popular)</option>
                      <option value="AISENSY">AiSensy (WhatsApp Engagement)</option>
                      <option value="TWILIO">Twilio WhatsApp API</option>
                      <option value="INTERAKT">Interakt (Jio Haptik)</option>
                      <option value="CUSTOM">Custom Webhook / Other Provider</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Business WhatsApp Phone Number *
                    </label>
                    <Input
                      placeholder="+919876543210"
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Include country code (+91 for India). New leads will receive and send from this number.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      API Key / Bearer Token *
                    </label>
                    <Input
                      type="password"
                      placeholder="Paste your Wati / AiSensy API token"
                      value={waApiKey}
                      onChange={(e) => setWaApiKey(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      API Endpoint URL (Required for Wati / Custom)
                    </label>
                    <Input
                      placeholder={
                        waProvider === "WATI"
                          ? "https://live-server-XXXX.wati.io"
                          : "https://api.your-provider.com/v1/send"
                      }
                      value={waApiUrl}
                      onChange={(e) => setWaApiUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Instance ID / Channel ID (Optional)
                    </label>
                    <Input
                      placeholder="e.g. inst_9283401"
                      value={waInstanceId}
                      onChange={(e) => setWaInstanceId(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Status Message */}
                {waStatusMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      waStatusMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {waStatusMsg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {waStatusMsg.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSavingWa}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5"
                  >
                    {isSavingWa ? "Saving..." : "Save WhatsApp Settings"}
                  </Button>
                </div>
              </form>

              {/* Inbound Webhook URL to paste in Wati / AiSensy dashboard */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    Incoming WhatsApp Webhook URL (For Tracking Incoming Inquiries)
                  </h4>
                </div>
                <p className="text-xs text-gray-600">
                  Paste this URL inside your <strong>Wati / AiSensy / Twilio</strong> Webhook settings. Whenever a customer sends a WhatsApp message to your number, it will automatically create or update a lead in this CRM!
                </p>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={incomingWaWebhookUrl}
                    className="w-full font-mono text-xs text-gray-800 bg-white border border-emerald-300 rounded-lg px-3 py-2 pr-20 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(incomingWaWebhookUrl, "waWebhook")}
                    className="absolute right-1.5 top-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors flex items-center gap-1"
                  >
                    {copiedKey === "waWebhook" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === "waWebhook" ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>

              {/* Direct WhatsApp Message Tester */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="h-4 w-4 text-emerald-600" />
                  Quick Test: Send WhatsApp Message From CRM
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Recipient Phone (+91...)
                    </label>
                    <Input
                      placeholder="+91XXXXXXXXXX"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Message Text
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        className="text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendWaTest}
                        disabled={isSendingWaTest}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0"
                      >
                        {isSendingWaTest ? "Sending..." : "Send Test"}
                      </Button>
                    </div>
                  </div>
                </div>
                {waTestResult && (
                  <p className="text-xs font-semibold p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800">
                    {waTestResult}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: GOOGLE ADS LIVE TRACKING
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "google_ads" && (
        <div className="space-y-6">
          <Card className="border-amber-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 border-b border-amber-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Google Ads Live Performance Integration
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-0.5">
                      Pull live Google Ads spend, impressions, clicks, CTR, and conversions directly into your CRM Ads tab.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-700">Google Ads Live Sync:</label>
                  <button
                    type="button"
                    onClick={() => setGEnabled(!gEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      gEnabled ? "bg-amber-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        gEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold ${gEnabled ? "text-amber-600" : "text-gray-400"}`}>
                    {gEnabled ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSaveGoogleAds} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Google Ads Customer ID (Account ID) *
                    </label>
                    <Input
                      placeholder="123-456-7890"
                      value={gCustomerId}
                      onChange={(e) => setGCustomerId(e.target.value)}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Found in the top-right corner of your Google Ads manager dashboard.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Developer Token
                    </label>
                    <Input
                      type="password"
                      placeholder="e.g. AbC123dEfGhIjKlMnOpQ"
                      value={gDevToken}
                      onChange={(e) => setGDevToken(e.target.value)}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      From Google Ads API Center (Tools & Settings → API Center).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      OAuth Client ID / Service Account
                    </label>
                    <Input
                      placeholder="e.g. 123456789.apps.googleusercontent.com"
                      value={gClientId}
                      onChange={(e) => setGClientId(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      OAuth Refresh Token / Client Secret
                    </label>
                    <Input
                      type="password"
                      placeholder="Paste your OAuth Refresh Token"
                      value={gRefreshToken}
                      onChange={(e) => setGRefreshToken(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {gStatusMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      gStatusMsg.type === "success"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {gStatusMsg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {gStatusMsg.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingGoogle}
                    onClick={handleSyncGoogleAds}
                    className="text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncingGoogle ? "animate-spin" : ""}`} />
                    {isSyncingGoogle ? "Pulling Live Data..." : "⚡ Sync Google Ads Now"}
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSavingG}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-5"
                  >
                    {isSavingG ? "Saving..." : "Save Google Ads Config"}
                  </Button>
                </div>
              </form>

              {/* Instructions Callout */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  How to Connect Google Ads (3 Steps):
                </h4>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Log into <a href="https://ads.google.com" target="_blank" rel="noreferrer" className="text-amber-700 underline font-medium">Google Ads Manager</a> and copy your 10-digit Customer ID.</li>
                  <li>In Google Cloud Console, create an OAuth 2.0 Client ID with Google Ads API scope enabled.</li>
                  <li>Click <strong>⚡ Sync Google Ads Now</strong> to immediately pull current campaign spend & leads!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: META (FACEBOOK & INSTAGRAM) ADS LIVE TRACKING
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "meta_ads" && (
        <div className="space-y-6">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50/70 to-purple-50/50 border-b border-indigo-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <Share2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Meta Ads (Facebook & Instagram) Live Tracking
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600 mt-0.5">
                      Connect your Meta Ad Account to track Facebook and Instagram ad campaign spend, cost-per-lead, and live lead form results.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-700">Meta Ads Live Sync:</label>
                  <button
                    type="button"
                    onClick={() => setMetaEnabled(!metaEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      metaEnabled ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        metaEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold ${metaEnabled ? "text-indigo-600" : "text-gray-400"}`}>
                    {metaEnabled ? "CONNECTED" : "DISCONNECTED"}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <form onSubmit={handleSaveMetaAds} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Meta Ad Account ID *
                    </label>
                    <Input
                      placeholder="act_123456789012345"
                      value={metaAccountId}
                      onChange={(e) => setMetaAccountId(e.target.value)}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Found in your Meta Ads Manager (starts with `act_`).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Meta App ID (Optional)
                    </label>
                    <Input
                      placeholder="e.g. 109283746592817"
                      value={metaAppId}
                      onChange={(e) => setMetaAppId(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Meta User or System User Access Token *
                    </label>
                    <Input
                      type="password"
                      placeholder="EAAG..."
                      value={metaToken}
                      onChange={(e) => setMetaToken(e.target.value)}
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Long-lived access token with `ads_read` and `leads_retrieval` permissions from Meta for Developers.
                    </p>
                  </div>
                </div>

                {metaStatusMsg && (
                  <div
                    className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      metaStatusMsg.type === "success"
                        ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {metaStatusMsg.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {metaStatusMsg.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingMeta}
                    onClick={handleSyncMetaAds}
                    className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncingMeta ? "animate-spin" : ""}`} />
                    {isSyncingMeta ? "Pulling Live Meta Data..." : "⚡ Sync Meta Ads Now"}
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSavingMeta}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5"
                  >
                    {isSavingMeta ? "Saving..." : "Save Meta Ads Config"}
                  </Button>
                </div>
              </form>

              {/* Instructions Callout */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-indigo-600" />
                  How to Generate a Meta Access Token:
                </h4>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-indigo-700 underline font-medium">Meta Graph API Explorer</a>.</li>
                  <li>Select your Meta App and add permissions: <code className="bg-white px-1 py-0.5 border rounded">ads_read</code>, <code className="bg-white px-1 py-0.5 border rounded">read_insights</code>.</li>
                  <li>Click <strong>Generate Access Token</strong> and paste it into the field above.</li>
                  <li>Click <strong>⚡ Sync Meta Ads Now</strong> to import your active Facebook & Instagram campaigns!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
