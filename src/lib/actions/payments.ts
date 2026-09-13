"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createInvoiceSchema, updateInvoiceStatusSchema, CreateInvoiceInput } from "@/lib/validations/payments";
import { InvoiceWithDetails, PaymentsSummary, Client } from "@/types/crm";
import { InvoiceStatus } from "@/types/database";

export interface PaymentActionResult {
  success: boolean;
  error?: string;
  message?: string;
  invoiceId?: string;
}

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

export async function createInvoice(
  payload: CreateInvoiceInput
): Promise<PaymentActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const parseResult = createInvoiceSchema.safeParse(payload);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Invalid invoice details",
    };
  }

  const { client_id, project_id, invoice_number, issue_date, due_date, tax_rate, notes, items } =
    parseResult.data;

  // Calculate Subtotal & Tax
  let subtotal = 0;
  const processedItems = items.map((item) => {
    const itemAmount = Math.round(item.quantity * item.unit_price * 100) / 100;
    subtotal += itemAmount;
    return {
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: itemAmount,
    };
  });

  const taxAmount = Math.round(((subtotal * tax_rate) / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  const supabase = await createClient();

  // Insert Invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: auth.orgId,
      client_id,
      project_id: project_id || null,
      invoice_number,
      status: "DRAFT",
      issue_date,
      due_date,
      subtotal,
      tax_rate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    console.error("Invoice creation error:", invoiceError);
    return { success: false, error: invoiceError?.message || "Failed to create invoice" };
  }

  // Insert Invoice Items
  const itemsToInsert = processedItems.map((item) => ({
    organization_id: auth.orgId,
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.amount,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);

  if (itemsError) {
    console.error("Invoice items creation error:", itemsError);
  }

  revalidatePath("/app/payments");
  revalidatePath("/app/dashboard");
  return { success: true, message: "Invoice created successfully", invoiceId: invoice.id };
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  paymentMethod?: string,
  paymentReference?: string
): Promise<PaymentActionResult> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) {
    return { success: false, error: "Unauthorized access" };
  }

  const supabase = await createClient();

  const updateData: {
    status: InvoiceStatus;
    payment_method?: string | null;
    payment_reference?: string | null;
    paid_at?: string | null;
  } = {
    status,
    payment_method: paymentMethod || null,
    payment_reference: paymentReference || null,
  };

  if (status === "PAID") {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", invoiceId)
    .eq("organization_id", auth.orgId);

  if (error) {
    console.error("Failed to update invoice status:", error);
    return { success: false, error: error.message };
  }

  if (status === "PAID") {
    await supabase.from("notifications").insert({
      organization_id: auth.orgId,
      title: "Invoice Paid 🎉",
      message: `An invoice has been marked as fully cleared and paid.`,
      type: "INVOICE_PAID",
      link_url: "/app/payments",
      is_read: false,
    });
  }

  revalidatePath("/app/payments");
  revalidatePath("/app/dashboard");
  return { success: true, message: `Invoice marked as ${status}` };
}

export async function getInvoicesData(): Promise<{
  paymentsSummary: PaymentsSummary;
  clients: Client[];
}> {
  const auth = await getAuthenticatedUserOrg();
  const emptySummary: PaymentsSummary = {
    totalRevenuePaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    invoices: [],
  };

  if (!auth) {
    return { paymentsSummary: emptySummary, clients: [] };
  }

  const supabase = await createClient();

  // Fetch clients for dropdown
  const { data: clientsData } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", auth.orgId)
    .order("full_name", { ascending: true });

  const clients = (clientsData as Client[]) || [];

  // Fetch invoices with client info
  const { data: invoicesData, error } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients(*),
      project:projects(*),
      items:invoice_items(*)
    `)
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: false });

  if (error || !invoicesData) {
    return { paymentsSummary: emptySummary, clients };
  }

  const invoices = invoicesData as unknown as InvoiceWithDetails[];

  let totalRevenuePaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  const today = new Date().toISOString().split("T")[0];

  invoices.forEach((inv) => {
    const amount = Number(inv.total_amount) || 0;
    if (inv.status === "PAID") {
      totalRevenuePaid += amount;
      paidCount++;
    } else if (inv.status === "OVERDUE" || (inv.status === "SENT" && inv.due_date < today)) {
      totalOverdue += amount;
      overdueCount++;
    } else if (inv.status === "SENT" || inv.status === "DRAFT") {
      totalPending += amount;
      pendingCount++;
    }
  });

  return {
    paymentsSummary: {
      totalRevenuePaid,
      totalPending,
      totalOverdue,
      paidCount,
      pendingCount,
      overdueCount,
      invoices,
    },
    clients,
  };
}

export async function getInvoiceDetails(invoiceId: string): Promise<InvoiceWithDetails | null> {
  const auth = await getAuthenticatedUserOrg();
  if (!auth) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients(*),
      project:projects(*),
      items:invoice_items(*)
    `)
    .eq("id", invoiceId)
    .eq("organization_id", auth.orgId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as InvoiceWithDetails;
}
