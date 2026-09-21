"use client";

import { useState } from "react";
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Check,
  Plus,
  X,
  Copy,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { updateBusinessSettings } from "@/lib/actions/business-settings";

interface Props {
  initialSettings: {
    id: string;
    name: string;
    slug: string;
    businessType: string;
    website: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    plan: string;
    status: string;
    services: string[];
    notificationPrefs: {
      new_lead?: boolean;
      follow_up?: boolean;
      whatsapp_alerts?: boolean;
      email_summary?: boolean;
    };
    webhookToken: string;
  };
}

export function BusinessSettingsForm({ initialSettings }: Props) {
  const [name, setName] = useState(initialSettings.name);
  const [businessType, setBusinessType] = useState(initialSettings.businessType);
  const [website, setWebsite] = useState(initialSettings.website);
  const [phone, setPhone] = useState(initialSettings.phone);
  const [email, setEmail] = useState(initialSettings.email);
  const [address, setAddress] = useState(initialSettings.address);
  const [city, setCity] = useState(initialSettings.city);
  const [state, setState] = useState(initialSettings.state);
  const [country, setCountry] = useState(initialSettings.country);
  const [services, setServices] = useState<string[]>(initialSettings.services);
  const [customService, setCustomService] = useState("");
  const [notifPrefs, setNotifPrefs] = useState({
    new_lead: initialSettings.notificationPrefs?.new_lead ?? true,
    follow_up: initialSettings.notificationPrefs?.follow_up ?? true,
    whatsapp_alerts: initialSettings.notificationPrefs?.whatsapp_alerts ?? true,
    email_summary: initialSettings.notificationPrefs?.email_summary ?? false,
  });

  const [copiedToken, setCopiedToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddService = () => {
    const trimmed = customService.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setCustomService("");
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setServices(services.filter((s) => s !== serviceToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await updateBusinessSettings({
        name,
        businessType,
        website: website || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        country,
        services,
        notificationPrefs: notifPrefs,
      });

      if (!res.success) {
        setFeedback({ type: "error", text: res.error || "Failed to update settings" });
      } else {
        setFeedback({ type: "success", text: "Business profile and preferences saved successfully!" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "An unexpected error occurred" });
    } finally {
      setIsSaving(false);
    }
  };

  const planName = initialSettings.plan.toUpperCase();
  const planBadgeClass =
    planName === "BUSINESS"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : planName === "PRO"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <X className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Subscription & Plan (Read-Only) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Current Subscription Plan</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${planBadgeClass}`}>
              {planName} PLAN
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Managed by your agency administrator. Contact support to upgrade your tier or adjust limits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <span>Slug: /{initialSettings.slug}</span>
        </div>
      </div>

      {/* Business Profile Details */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            General Business Details
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            This information is used on customer-facing quotations, receipts, and headers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Industry Category
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="DIGITAL_MARKETING">Digital Marketing Agency</option>
              <option value="PACKERS_MOVERS">Packers & Movers</option>
              <option value="REAL_ESTATE">Real Estate</option>
              <option value="CLINIC_HEALTHCARE">Clinic / Healthcare</option>
              <option value="SOLAR_ENERGY">Solar / Clean Energy</option>
              <option value="INTERIOR_DESIGN">Interior Design</option>
              <option value="RESTAURANT">Restaurant / Food</option>
              <option value="OTHER">Other Business</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              placeholder="contact@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Office Address
            </label>
            <input
              type="text"
              placeholder="Street Address, Suite / Unit"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              State
            </label>
            <input
              type="text"
              placeholder="e.g. Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Configured Business Services
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Services offered by your company that appear in the lead ingestion dropdown.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add service (e.g. SEO Campaign, Warehouse Storage)..."
            value={customService}
            onChange={(e) => setCustomService(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddService();
              }
            }}
            className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleAddService}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {services.map((svc) => (
            <span
              key={svc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-800 border border-violet-200"
            >
              {svc}
              <button
                type="button"
                onClick={() => handleRemoveService(svc)}
                className="hover:text-violet-950 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {services.length === 0 && (
            <p className="text-xs text-slate-400">No custom services listed yet.</p>
          )}
        </div>
      </div>

      {/* Website Ingestion Token (Read-Only) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Website Form Ingestion Token</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secret token for your website forms to post leads directly to this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(initialSettings.webhookToken);
              setCopiedToken(true);
              setTimeout(() => setCopiedToken(false), 2000);
            }}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedToken ? "Copied!" : "Copy Token"}
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 break-all select-all">
          {initialSettings.webhookToken || "crm-token-default"}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-md shadow-violet-200 transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Business Profile
            </>
          )}
        </button>
      </div>
    </form>
  );
}
