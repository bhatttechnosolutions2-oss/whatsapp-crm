"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Share2,
  Bell,
  Code2,
  Copy,
  Check,
  Zap,
  Rocket,
  Plus,
  X,
  Clock,
} from "lucide-react";
import {
  OnboardingState,
  saveOnboardingStep,
  completeOnboarding,
} from "@/lib/actions/onboarding";

interface Props {
  initialState: OnboardingState;
}

const DEFAULT_SERVICE_OPTIONS: Record<string, string[]> = {
  DIGITAL_MARKETING: [
    "Website Design & Dev",
    "Search Engine Optimization (SEO)",
    "Google Search Ads (PPC)",
    "Meta / Facebook Ads",
    "Social Media Marketing",
    "Lead Generation Campaigns",
  ],
  PACKERS_MOVERS: [
    "Local Shifting",
    "Domestic Relocation",
    "Vehicle Transport",
    "Warehouse & Storage",
    "Office Relocation",
    "Packing & Unpacking",
  ],
  REAL_ESTATE: [
    "Residential Property Sales",
    "Commercial Leasing",
    "Luxury Apartments",
    "Plot & Land Investment",
    "Site Visit Coordination",
  ],
  CLINIC_HEALTHCARE: [
    "Doctor Consultations",
    "Diagnostic Tests",
    "Preventive Health Checkups",
    "Online Video Consultation",
  ],
  SOLAR_ENERGY: [
    "Rooftop Solar Installation",
    "Commercial Solar Solutions",
    "Net Metering Setup",
    "Solar Maintenance & AMC",
  ],
  INTERIOR_DESIGN: [
    "Full Home Interiors",
    "Modular Kitchens",
    "Living Room Makeovers",
    "Commercial & Office Design",
  ],
  RESTAURANT: [
    "Table Reservations",
    "Event Catering",
    "Home Delivery Orders",
  ],
  OTHER: [
    "Consulting",
    "Customer Support",
    "Maintenance & Services",
    "Product Inquiries",
  ],
};

const LEAD_SOURCE_OPTIONS = [
  { id: "website_form", label: "Website Contact Form", desc: "Leads submitted directly on your site" },
  { id: "whatsapp", label: "WhatsApp Direct Inquiries", desc: "Incoming chats & catalog leads" },
  { id: "google_ads", label: "Google Search Ads (PPC)", desc: "Traffic from Google Search" },
  { id: "meta_ads", label: "Meta (Facebook / Instagram) Ads", desc: "Social advertising campaigns" },
  { id: "phone_calls", label: "Direct Phone Calls", desc: "Inbound phone calls from customers" },
  { id: "referrals", label: "Word-of-Mouth & Referrals", desc: "Referrals from existing clients" },
  { id: "walk_in", label: "Walk-in Inquiries", desc: "Direct visitors to your office or store" },
];

export function OnboardingWizard({ initialState }: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(
    Math.min(Math.max(initialState.onboardingStep, 1), 7)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState(initialState.businessName);
  const [businessType, setBusinessType] = useState(initialState.businessType || "DIGITAL_MARKETING");
  const [website, setWebsite] = useState(initialState.website);
  const [phone, setPhone] = useState(initialState.phone);
  const [email, setEmail] = useState(initialState.email);
  const [address, setAddress] = useState(initialState.address);
  const [city, setCity] = useState(initialState.city);
  const [state, setState] = useState(initialState.state);

  // Services
  const initialServices =
    initialState.services.length > 0
      ? initialState.services
      : DEFAULT_SERVICE_OPTIONS[initialState.businessType] || DEFAULT_SERVICE_OPTIONS.OTHER;
  const [services, setServices] = useState<string[]>(initialServices);
  const [customServiceInput, setCustomServiceInput] = useState("");

  // Lead Sources
  const initialLeadSources =
    initialState.leadSources.length > 0
      ? initialState.leadSources
      : ["website_form", "whatsapp", "google_ads"];
  const [leadSources, setLeadSources] = useState<string[]>(initialLeadSources);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    new_lead: initialState.notificationPrefs?.new_lead ?? true,
    follow_up: initialState.notificationPrefs?.follow_up ?? true,
    whatsapp_alerts: initialState.notificationPrefs?.whatsapp_alerts ?? true,
    email_summary: initialState.notificationPrefs?.email_summary ?? false,
  });

  // Copied state
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const stepsList = [
    { number: 1, title: "Welcome" },
    { number: 2, title: "Business" },
    { number: 3, title: "Services" },
    { number: 4, title: "Lead Sources" },
    { number: 5, title: "Notifications" },
    { number: 6, title: "Website Form" },
    { number: 7, title: "Complete" },
  ];

  const handleNext = async () => {
    setErrorMessage(null);
    setIsSaving(true);

    try {
      if (currentStep === 1) {
        // Just advance
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (!businessName.trim()) {
          setErrorMessage("Business name is required");
          setIsSaving(false);
          return;
        }
        const res = await saveOnboardingStep(2, {
          businessName,
          businessType,
          website,
          phone,
          email,
          address,
          city,
          state,
        });
        if (!res.success) throw new Error(res.error);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        const res = await saveOnboardingStep(3, { services });
        if (!res.success) throw new Error(res.error);
        setCurrentStep(4);
      } else if (currentStep === 4) {
        const res = await saveOnboardingStep(4, { leadSources });
        if (!res.success) throw new Error(res.error);
        setCurrentStep(5);
      } else if (currentStep === 5) {
        const res = await saveOnboardingStep(5, { notificationPrefs: notifPrefs });
        if (!res.success) throw new Error(res.error);
        setCurrentStep(6);
      } else if (currentStep === 6) {
        setCurrentStep(7);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save step");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const res = await completeOnboarding();
      if (!res.success) throw new Error(res.error);
      router.push("/app/dashboard");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to complete onboarding");
      setIsSaving(false);
    }
  };

  const toggleService = (item: string) => {
    setServices((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const addCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices([...services, trimmed]);
      setCustomServiceInput("");
    }
  };

  const toggleLeadSource = (sourceId: string) => {
    setLeadSources((prev) =>
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  };

  const trackingSnippetCode = `<!-- WhatsApp CRM Lead Ingestion Snippet -->
<script>
  window.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('#contact-form') || document.querySelector('form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      const data = new FormData(form);
      fetch('${typeof window !== "undefined" ? window.location.origin : ""}/api/leads/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-token': '${initialState.webhookToken}'
        },
        body: JSON.stringify({
          fullName: data.get('name') || data.get('fullName'),
          phone: data.get('phone'),
          email: data.get('email'),
          serviceNeeded: data.get('service') || '${services[0] || "General Inquiry"}',
          source: 'Website Form'
        })
      }).catch(console.error);
    });
  });
</script>`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
            Step {currentStep} of 7 • {stepsList[currentStep - 1]?.title}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {Math.round((currentStep / 7) * 100)}% Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 7) * 100}%` }}
          />
        </div>

        {/* Steps Chips */}
        <div className="hidden sm:flex justify-between mt-3 text-xs text-slate-400">
          {stepsList.map((step) => (
            <span
              key={step.number}
              className={`font-medium ${
                step.number === currentStep
                  ? "text-violet-600 font-bold"
                  : step.number < currentStep
                  ? "text-slate-700"
                  : "text-slate-300"
              }`}
            >
              {step.number}. {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <X className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: WELCOME */}
        {currentStep === 1 && (
          <div className="text-center py-6 space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 shadow-inner">
              <Rocket className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Welcome to {businessName || "Your CRM"}!
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
                Your agency workspace has been provisioned. Let&apos;s configure your services, lead capture channels, and notification settings so you can start closing deals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl mx-auto text-left">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-blue-100 text-blue-700 w-fit rounded-xl mb-2">
                  <Globe className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Lead Ingestion</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Fetch website forms & WhatsApp inquiries.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-emerald-100 text-emerald-700 w-fit rounded-xl mb-2">
                  <Zap className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Pipeline Flow</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Organized Kanban stages tailored to your business.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="p-2 bg-purple-100 text-purple-700 w-fit rounded-xl mb-2">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Smart Alerts</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Never miss customer callbacks and follow-ups.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUSINESS DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Business Information</h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify and update your business details that appear on client proposals and invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business / Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry / Business Type
                </label>
                <select
                  value={businessType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setBusinessType(newType);
                    if (DEFAULT_SERVICE_OPTIONS[newType]) {
                      setServices(DEFAULT_SERVICE_OPTIONS[newType]);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="DIGITAL_MARKETING">Digital Marketing Agency</option>
                  <option value="PACKERS_MOVERS">Packers & Movers</option>
                  <option value="REAL_ESTATE">Real Estate & Property</option>
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
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
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
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SERVICES OFFERED */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Services Offered</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select the services your business provides. These will populate your lead intake forms and quotation generator.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(DEFAULT_SERVICE_OPTIONS[businessType] || DEFAULT_SERVICE_OPTIONS.OTHER).map((svc) => {
                const isSelected = services.includes(svc);
                return (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => toggleService(svc)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? "bg-violet-50 border-violet-300 text-violet-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-semibold">{svc}</span>
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Services Tagging */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Add Custom Service
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Express Weekend Delivery"
                  value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomService();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={addCustomService}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {/* Active Services Badges */}
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {services.map((svc) => (
                    <span
                      key={svc}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800"
                    >
                      {svc}
                      <button
                        type="button"
                        onClick={() => toggleService(svc)}
                        className="hover:text-violet-950"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: LEAD SOURCES */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lead Sources & Ingestion Channels</h2>
              <p className="text-xs text-slate-500 mt-1">
                Where do your customers usually reach out? Choose all channels you wish to track.
              </p>
            </div>

            <div className="space-y-3">
              {LEAD_SOURCE_OPTIONS.map((source) => {
                const isSelected = leadSources.includes(source.id);
                return (
                  <div
                    key={source.id}
                    onClick={() => toggleLeadSource(source.id)}
                    className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? "bg-violet-50 border-violet-300 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{source.label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{source.desc}</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: NOTIFICATIONS */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Notification Preferences</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure how and when you want to receive lead updates and team activity alerts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Instant New Lead Alerts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trigger an in-app banner and alert badge whenever a new inquiry arrives.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.new_lead}
                  onChange={(e) =>
                    setNotifPrefs({ ...notifPrefs, new_lead: e.target.checked })
                  }
                  className="h-5 w-5 text-violet-600 rounded focus:ring-violet-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Follow-up & Callback Reminders</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alert your team when a customer follow-up appointment is due.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.follow_up}
                  onChange={(e) =>
                    setNotifPrefs({ ...notifPrefs, follow_up: e.target.checked })
                  }
                  className="h-5 w-5 text-violet-600 rounded focus:ring-violet-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">WhatsApp Dispatch Updates</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enable WhatsApp notifications for quotation updates and lead confirmations.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.whatsapp_alerts}
                  onChange={(e) =>
                    setNotifPrefs({ ...notifPrefs, whatsapp_alerts: e.target.checked })
                  }
                  className="h-5 w-5 text-violet-600 rounded focus:ring-violet-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: WEBSITE CONNECTION */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Website Connection & Tracking Code</h2>
              <p className="text-xs text-slate-500 mt-1">
                Connect your website contact forms so inquiries automatically land in your CRM.
              </p>
            </div>

            {/* Webhook Token Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Your Webhook Ingestion Token
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(initialState.webhookToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedToken ? "Copied!" : "Copy Token"}
                </button>
              </div>
              <p className="font-mono text-xs bg-white p-3 rounded-xl border border-slate-200 break-all select-all text-slate-800">
                {initialState.webhookToken || "crm-token-default"}
              </p>
            </div>

            {/* Tracking Script Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Ready-to-Use Website Ingestion Code
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(trackingSnippetCode);
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2000);
                  }}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  {copiedSnippet ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedSnippet ? "Snippet Copied!" : "Copy Snippet"}
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-4 rounded-2xl overflow-x-auto border border-slate-800 leading-relaxed">
                {trackingSnippetCode}
              </pre>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2.5">
              <Code2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Paste this script inside the &lt;body&gt; tag of your website landing page. Every contact form submission will be securely routed directly into your leads pipeline with zero delay!
              </span>
            </div>
          </div>
        )}

        {/* STEP 7: COMPLETE */}
        {currentStep === 7 && (
          <div className="text-center py-6 space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Your CRM Workspace is Ready!
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Congratulations! <strong>{businessName}</strong> is fully configured. You can now start managing leads, dispatching quotations, and tracking ad metrics.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Business:</span>
                <span className="font-semibold text-slate-800">{businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Configured Services:</span>
                <span className="font-semibold text-slate-800">{services.length} services</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lead Sources:</span>
                <span className="font-semibold text-slate-800">{leadSources.length} channels</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Form Integration:</span>
                <span className="font-semibold text-emerald-600">Active & Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          {currentStep > 1 && currentStep < 7 ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 7 ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : currentStep === 1 ? (
                <>
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleFinish}
              className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-200 transition flex items-center gap-2 disabled:opacity-50 mx-auto"
            >
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Finalizing Workspace...
                </>
              ) : (
                <>
                  Launch My CRM Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
