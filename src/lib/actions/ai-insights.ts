"use server";

import { createClient } from "@/lib/supabase/server";
import { AiInsightsSummary, AiRecommendation, Lead, Project, Invoice, AdCampaign } from "@/types/crm";

async function getAuthenticatedUserOrg() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!member) return null;

  return {
    userId: user.id,
    orgId: member.organization_id,
    role: member.role,
  };
}

export async function getAiBusinessInsights(): Promise<AiInsightsSummary> {
  const auth = await getAuthenticatedUserOrg();
  const emptyInsights: AiInsightsSummary = {
    healthScore: 85,
    healthGrade: "A",
    winRatePercentage: 0,
    avgDealSize: 0,
    totalPipelineValue: 0,
    marketingEfficiencyRatio: 0,
    conversionFunnel: {
      totalLeads: 0,
      qualified: 0,
      proposals: 0,
      won: 0,
    },
    recommendations: [],
  };

  if (!auth) return emptyInsights;

  const supabase = await createClient();

  // 1. Fetch live leads, projects, invoices, ads
  const [{ data: leadsData }, { data: projectsData }, { data: invoicesData }, { data: adsData }] =
    await Promise.all([
      supabase.from("leads").select("*").eq("organization_id", auth.orgId),
      supabase.from("projects").select("*").eq("organization_id", auth.orgId),
      supabase.from("invoices").select("*").eq("organization_id", auth.orgId),
      supabase.from("ad_campaigns").select("*").eq("organization_id", auth.orgId),
    ]);

  const leads = (leadsData as Lead[]) || [];
  const projects = (projectsData as Project[]) || [];
  const invoices = (invoicesData as Invoice[]) || [];
  const ads = (adsData as AdCampaign[]) || [];

  // 2. Calculations
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "WON");
  const qualifiedLeads = leads.filter((l) => ["QUALIFIED", "PROPOSAL_SENT", "WON"].includes(l.status));
  const proposalLeads = leads.filter((l) => ["PROPOSAL_SENT", "WON"].includes(l.status));

  const winRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0;
  const totalPipelineValue = leads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0);
  const avgDealSize =
    wonLeads.length > 0
      ? Math.round(wonLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0) / wonLeads.length)
      : totalLeads > 0
      ? Math.round(totalPipelineValue / totalLeads)
      : 0;

  const totalAdSpend = ads.reduce((acc, a) => acc + (Number(a.spend) || 0), 0);
  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);

  const marketingEfficiencyRatio =
    totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 10) / 10 : totalRevenue > 0 ? 5.0 : 0;

  // 3. Health Score calculation (0 - 100)
  let healthScore = 75;
  if (totalLeads > 5) healthScore += 5;
  if (winRate >= 25) healthScore += 10;
  if (invoices.some((inv) => inv.status === "PAID")) healthScore += 5;
  if (projects.some((p) => p.status === "IN_PROGRESS" || p.status === "COMPLETED")) healthScore += 5;
  healthScore = Math.min(100, Math.max(40, healthScore));

  let healthGrade: "A+" | "A" | "B" | "C" | "NEEDS_ATTENTION" = "A";
  if (healthScore >= 95) healthGrade = "A+";
  else if (healthScore >= 85) healthGrade = "A";
  else if (healthScore >= 70) healthGrade = "B";
  else if (healthScore >= 55) healthGrade = "C";
  else healthGrade = "NEEDS_ATTENTION";

  // 4. Generate AI Recommendations
  const recommendations: AiRecommendation[] = [];

  // Check overdue invoices
  const overdueInvoices = invoices.filter(
    (inv) => inv.status === "OVERDUE" || (inv.status === "SENT" && new Date(inv.due_date) < new Date())
  );
  if (overdueInvoices.length > 0) {
    const overdueTotal = overdueInvoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
    recommendations.push({
      id: "rec-overdue",
      category: "CASHFLOW",
      priority: "HIGH",
      title: "Overdue Receivables Alert",
      insight: `You have ${overdueInvoices.length} invoice(s) totalling ₹${overdueTotal.toLocaleString("en-IN")} past due date. Following up on WhatsApp recovers 68% faster.`,
      actionLabel: "View Overdue Invoices",
      actionUrl: "/app/payments",
    });
  }

  // Check leads needing follow-up
  const newLeads = leads.filter((l) => l.status === "NEW");
  if (newLeads.length > 0) {
    recommendations.push({
      id: "rec-new-leads",
      category: "LEADS",
      priority: "HIGH",
      title: "Immediate Lead Follow-up Recommended",
      insight: `${newLeads.length} newly registered leads are waiting for first contact. Contacting within 15 minutes increases qualification rate by 3.8x.`,
      actionLabel: "Open Leads Pipeline",
      actionUrl: "/app/leads",
    });
  }

  // Check WhatsApp channel momentum
  const whatsAppLeads = leads.filter((l) => l.source === "WHATSAPP");
  if (whatsAppLeads.length > 0) {
    recommendations.push({
      id: "rec-whatsapp-boost",
      category: "MARKETING",
      priority: "MEDIUM",
      title: "High WhatsApp Inbound Velocity",
      insight: `WhatsApp is driving ${Math.round((whatsAppLeads.length / Math.max(1, totalLeads)) * 100)}% of your incoming inquiries with rapid close times.`,
      actionLabel: "View WhatsApp Inquiries",
      actionUrl: "/app/whatsapp",
    });
  }

  // Check project delivery milestone
  const inProgressProjects = projects.filter((p) => p.status === "IN_PROGRESS" || p.status === "REVIEW");
  if (inProgressProjects.length > 0) {
    recommendations.push({
      id: "rec-projects-progress",
      category: "PROJECTS",
      priority: "MEDIUM",
      title: "Active Client Design Milestones",
      insight: `${inProgressProjects.length} client website projects are actively progressing. Ensure Figma staging links are shared with clients.`,
      actionLabel: "Open Project Hub",
      actionUrl: "/app/projects",
    });
  }

  // Default initial recommendation if pipeline is fresh
  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-starter",
      category: "LEADS",
      priority: "MEDIUM",
      title: "Connect Website Tracking Pixel",
      insight: "Install your website tracking pixel to automatically capture live visitors and convert WhatsApp button clicks into leads.",
      actionLabel: "View Tracking Pixel",
      actionUrl: "/app/analytics",
    });
  }

  return {
    healthScore,
    healthGrade,
    winRatePercentage: winRate,
    avgDealSize,
    totalPipelineValue,
    marketingEfficiencyRatio,
    conversionFunnel: {
      totalLeads,
      qualified: qualifiedLeads.length,
      proposals: proposalLeads.length,
      won: wonLeads.length,
    },
    recommendations,
  };
}
