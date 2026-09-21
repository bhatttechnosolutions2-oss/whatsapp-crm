"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  Search,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Info,
  Copy,
  Check,
  Sparkles,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  createClientOrganization,
  updateOrganizationStatus,
  updateOrganizationBasicInfo,
  deleteOrganization,
} from "@/lib/actions/admin";

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  timezone: string;
  currency: string;
  created_at: string;
  plan?: string;
  business_type?: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerRole?: string;
  memberCount: number;
  leadCount: number;
  revenue: number;
  webhook_token?: string;
}

export function OrganizationsClient({ initialOrgs }: { initialOrgs: OrganizationItem[] }) {
  const [orgs, setOrgs] = useState<OrganizationItem[]>(initialOrgs);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Create Client Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<{
    businessName: string;
    ownerEmail: string;
    loginUrl: string;
  } | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("DIGITAL_MARKETING");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [plan, setPlan] = useState<"FREE" | "PRO" | "BUSINESS">("FREE");
  const [status, setStatus] = useState<"ACTIVE" | "PENDING">("ACTIVE");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [enabledModules, setEnabledModules] = useState<string[]>([
    "leads",
    "whatsapp",
    "analytics",
    "ads",
  ]);

  // Details Modal state
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Status Action state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    orgId: string;
    orgName: string;
    targetStatus: "ACTIVE" | "SUSPENDED" | "DELETE";
  } | null>(null);

  // Edit State
  const [editModal, setEditModal] = useState<OrganizationItem | null>(null);
  const [editData, setEditData] = useState<{ name: string; plan: string; email: string; phone: string }>({
    name: "",
    plan: "FREE",
    email: "",
    phone: "",
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Filtered organizations
  const filteredOrgs = orgs.filter((org) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      org.name.toLowerCase().includes(q) ||
      org.slug.toLowerCase().includes(q) ||
      (org.ownerName && org.ownerName.toLowerCase().includes(q)) ||
      (org.ownerEmail && org.ownerEmail.toLowerCase().includes(q)) ||
      (org.email && org.email.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && org.status === "ACTIVE") ||
      (statusFilter === "SUSPENDED" && org.status === "SUSPENDED") ||
      (statusFilter === "INACTIVE" && (org.status === "INACTIVE" || org.status === "PENDING"));

    const matchesPlan =
      planFilter === "ALL" ||
      (org.plan || "FREE").toUpperCase() === planFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsSubmitting(true);

    try {
      const res = await createClientOrganization({
        businessName,
        businessType,
        websiteUrl: websiteUrl || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || "India",
        plan,
        status,
        ownerName,
        ownerEmail,
        ownerPhone: ownerPhone || undefined,
        enabledModules,
      });

      if (!res.success) {
        setCreateError(res.error || "Failed to create organization");
        setIsSubmitting(false);
        return;
      }

      setCreatedSuccess({
        businessName: res.organization?.name || businessName,
        ownerEmail: res.invitation?.clientEmail || ownerEmail,
        loginUrl: res.invitation?.loginUrl || `${window.location.origin}/login`,
      });

      // Append new org to local list
      const newOrgItem: OrganizationItem = {
        id: res.organization?.id || `temp-${Date.now()}`,
        name: businessName,
        slug: res.organization?.slug || businessName.toLowerCase().replace(/\s+/g, "-"),
        status: status,
        email: email || ownerEmail,
        phone: phone || ownerPhone,
        website: websiteUrl || null,
        timezone: "Asia/Kolkata",
        currency: "INR",
        created_at: new Date().toISOString(),
        plan,
        business_type: businessType,
        onboarding_completed: false,
        onboarding_step: 1,
        ownerName,
        ownerEmail,
        ownerPhone,
        ownerRole: "CLIENT",
        memberCount: 1,
        leadCount: 0,
        revenue: 0,
      };

      setOrgs((prev) => [newOrgItem, ...prev]);
      setIsSubmitting(false);
    } catch (err: any) {
      setCreateError(err?.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    orgId: string,
    targetStatus: "ACTIVE" | "SUSPENDED"
  ) => {
    setActionLoadingId(orgId);
    setConfirmModal(null);
    try {
      const res = await updateOrganizationStatus(orgId, targetStatus);
      if (res.success) {
        setOrgs((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, status: targetStatus } : o))
        );
        if (selectedOrg && selectedOrg.id === orgId) {
          setSelectedOrg({ ...selectedOrg, status: targetStatus });
        }
      } else {
        alert(res.error || "Failed to update status");
      }
    } catch (err: any) {
      alert(err?.message || "Error updating organization status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    setActionLoadingId(orgId);
    setConfirmModal(null);
    try {
      const res = await deleteOrganization(orgId);
      if (res.success) {
        setOrgs((prev) => prev.filter((o) => o.id !== orgId));
      } else {
        alert(res.error || "Failed to delete organization");
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting organization");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!editModal) return;
    setActionLoadingId(editModal.id);
    try {
      const res = await updateOrganizationBasicInfo(editModal.id, {
        name: editData.name,
        plan: editData.plan as any,
        email: editData.email,
        phone: editData.phone,
      });
      if (res.success) {
        setOrgs((prev) =>
          prev.map((o) =>
            o.id === editModal.id
              ? { ...o, name: editData.name, plan: editData.plan, email: editData.email, phone: editData.phone }
              : o
          )
        );
        setEditModal(null);
      } else {
        alert(res.error || "Failed to update organization");
      }
    } catch (err: any) {
      alert(err?.message || "Error updating organization");
    } finally {
      setActionLoadingId(null);
    }
  };

  const resetForm = () => {
    setBusinessName("");
    setBusinessType("DIGITAL_MARKETING");
    setWebsiteUrl("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("India");
    setPlan("FREE");
    setStatus("ACTIVE");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setEnabledModules(["leads", "whatsapp", "analytics", "ads"]);
    setCreateError(null);
    setCreatedSuccess(null);
    setIsCreateOpen(false);
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Organizations & Clients</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800">
              Multi-Tenant
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage isolated client organizations, monitor onboarding status, and configure subscriptions.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm shadow-sm transition-all hover:shadow-violet-200"
        >
          <Plus className="h-4 w-4" />
          Create Client Organization
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Organizations</p>
            <p className="text-xl font-bold text-slate-900">{orgs.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Active Clients</p>
            <p className="text-xl font-bold text-slate-900">
              {orgs.filter((o) => o.status === "ACTIVE").length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Onboarding Pending</p>
            <p className="text-xl font-bold text-slate-900">
              {orgs.filter((o) => !o.onboarding_completed).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Suspended</p>
            <p className="text-xl font-bold text-slate-900">
              {orgs.filter((o) => o.status === "SUSPENDED").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by business name, slug, owner name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive / Pending</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="BUSINESS">Business</option>
          </select>
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredOrgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-20">
          <Building2 className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-600">No organizations found</p>
          <p className="text-sm text-slate-400 mt-1">
            {searchQuery || statusFilter !== "ALL" || planFilter !== "ALL"
              ? "Try adjusting your search query or filters"
              : "Click 'Create Client Organization' to register your first client"}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-4">Client / Organization</th>
                  <th className="px-6 py-4">Contact Owner</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Onboarding</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Leads</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.map((org) => {
                  const isSuspended = org.status === "SUSPENDED";
                  const planName = (org.plan || "FREE").toUpperCase();
                  const planBadgeClass =
                    planName === "BUSINESS"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : planName === "PRO"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-600 border-slate-200";

                  return (
                    <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-sm flex-shrink-0 shadow-sm">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{org.name}</p>
                            <p className="text-xs text-slate-400 font-mono">/{org.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{org.ownerName || "—"}</p>
                        <p className="text-xs text-slate-400">{org.ownerEmail || org.email || "—"}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${planBadgeClass}`}>
                          {planName}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {org.onboarding_completed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            Pending (Step {org.onboarding_step || 1}/7)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Suspended
                          </span>
                        ) : org.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {org.status}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-slate-700">{org.leadCount}</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrg(org)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            Details
                          </button>

                          {isSuspended ? (
                            <button
                              disabled={actionLoadingId === org.id}
                              onClick={() =>
                                setConfirmModal({
                                  orgId: org.id,
                                  orgName: org.name,
                                  targetStatus: "ACTIVE",
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-50"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              disabled={actionLoadingId === org.id}
                              onClick={() =>
                                setConfirmModal({
                                  orgId: org.id,
                                  orgName: org.name,
                                  targetStatus: "SUSPENDED",
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            disabled={actionLoadingId === org.id}
                            onClick={() => {
                              setEditModal(org);
                              setEditData({
                                name: org.name,
                                plan: org.plan || "FREE",
                                email: org.email || "",
                                phone: org.phone || "",
                              });
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition disabled:opacity-50"
                          >
                            Edit
                          </button>

                          <button
                            disabled={actionLoadingId === org.id}
                            onClick={() =>
                              setConfirmModal({
                                orgId: org.id,
                                orgName: org.name,
                                targetStatus: "DELETE",
                              })
                            }
                            className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredOrgs.length} of {orgs.length} organizations</span>
            <span>Created for Agency Clients</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className={`flex items-center gap-3 mb-4 ${confirmModal.targetStatus === "DELETE" ? "text-red-600" : "text-amber-600"}`}>
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">
                Confirm {confirmModal.targetStatus === "SUSPENDED" ? "Suspension" : confirmModal.targetStatus === "DELETE" ? "Deletion" : "Activation"}
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              {confirmModal.targetStatus === "SUSPENDED"
                ? `Are you sure you want to suspend "${confirmModal.orgName}"? Client users of this organization will be blocked from accessing the CRM dashboard until reactivated.`
                : confirmModal.targetStatus === "DELETE"
                ? `Are you sure you want to permanently delete "${confirmModal.orgName}"? This action cannot be undone and all associated data will be removed.`
                : `Reactivate "${confirmModal.orgName}"? Client users will regain full access to their CRM workspace.`}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.targetStatus === "DELETE") {
                    handleDeleteOrg(confirmModal.orgId);
                  } else {
                    handleStatusChange(confirmModal.orgId, confirmModal.targetStatus);
                  }
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                  confirmModal.targetStatus === "SUSPENDED"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : confirmModal.targetStatus === "DELETE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Yes, {confirmModal.targetStatus === "SUSPENDED" ? "Suspend Organization" : confirmModal.targetStatus === "DELETE" ? "Delete Organization" : "Activate Organization"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Organization</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                <select
                  value={editData.plan}
                  onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="BUSINESS">Business</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition disabled:opacity-50"
              >
                {actionLoadingId === editModal.id ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-lg">
                  {selectedOrg.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedOrg.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Org ID: {selectedOrg.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Subscription & Status
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-semibold text-slate-800">{selectedOrg.plan || "FREE"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-slate-800">{selectedOrg.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Onboarding:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedOrg.onboarding_completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created:</span>
                    <span className="text-slate-700">{formatDate(selectedOrg.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Contact Information
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Owner:</span>
                    <span className="font-semibold text-slate-800">{selectedOrg.ownerName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-700 font-mono text-xs">{selectedOrg.ownerEmail || selectedOrg.email || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span className="text-slate-700">{selectedOrg.ownerPhone || selectedOrg.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Website:</span>
                    <span className="text-slate-700 truncate max-w-[150px]">{selectedOrg.website || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook & Lead Ingestion Token */}
            {selectedOrg.webhook_token && (
              <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-violet-900 uppercase tracking-wider">
                    Website Lead Ingestion Token
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrg.webhook_token || "");
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:text-violet-900"
                  >
                    {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedToken ? "Copied" : "Copy Token"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-mono bg-white p-2 rounded-lg border border-violet-200/50 break-all select-all">
                  {selectedOrg.webhook_token}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Client Organization Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Client Organization</h3>
                <p className="text-xs text-slate-500">
                  Provision a new isolated tenant workspace and create the primary client user.
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createdSuccess ? (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-900">Organization Provisioned Successfully!</h4>
                    <p className="text-sm text-emerald-700 mt-1">
                      The client workspace for <strong>{createdSuccess.businessName}</strong> has been created with role <strong>CLIENT</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client Login Details
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Login URL:</span>
                      <a
                        href={createdSuccess.loginUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-violet-600 hover:underline inline-flex items-center gap-1"
                      >
                        {createdSuccess.loginUrl}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Client Email:</span>
                      <span className="font-mono text-slate-800">{createdSuccess.ownerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Transparent statement about email delivery */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Notice: Automated email delivery is not configured</p>
                    <p className="mt-0.5">
                      SMTP credentials have not been configured yet. Please share the login URL with your client directly so they can log in and begin their onboarding wizard.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="space-y-6">
                {createError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Section 1: Business Details */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    1. Business Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Digital Solutions"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Business Type
                      </label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Business Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
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
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Owner / Client User */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3 flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    2. Client User (Owner Account)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Owner / Contact Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Owner Email (Login ID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="rajesh@client.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Owner Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 00000"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Plan & Subscription */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    3. Plan & Status
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Assigned Plan
                      </label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="FREE">Free Tier</option>
                        <option value="PRO">Pro Tier</option>
                        <option value="BUSINESS">Business Tier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Initial Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending Setup</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Creating Client...
                      </>
                    ) : (
                      "Create Client Organization"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
