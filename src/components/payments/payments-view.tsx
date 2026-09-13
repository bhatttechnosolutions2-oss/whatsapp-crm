"use client";

import React, { useState } from "react";
import { PaymentsSummary, Client, InvoiceWithDetails } from "@/types/crm";
import { CreateInvoiceDialog } from "@/components/payments/create-invoice-dialog";
import { InvoiceDetailsDialog } from "@/components/payments/invoice-details-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Plus,
} from "lucide-react";

interface PaymentsViewProps {
  initialData: {
    paymentsSummary: PaymentsSummary;
    clients: Client[];
  };
}

export function PaymentsView({ initialData }: PaymentsViewProps) {
  const { paymentsSummary, clients } = initialData;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredInvoices = paymentsSummary.invoices.filter((inv) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      inv.status === statusFilter ||
      (statusFilter === "OVERDUE" &&
        inv.status === "SENT" &&
        new Date(inv.due_date) < new Date());

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.client?.full_name.toLowerCase().includes(query) ||
      inv.client?.company_name?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string, dueDate: string) => {
    const isPastDue = status === "SENT" && new Date(dueDate) < new Date();
    if (isPastDue || status === "OVERDUE") {
      return (
        <Badge className="bg-rose-500/10 text-rose-700 border-rose-200">
          <AlertCircle className="w-3 h-3 mr-1" /> Overdue
        </Badge>
      );
    }
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case "SENT":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Sent
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-slate-500/10 text-slate-700 border-slate-200">
            Draft
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-slate-200 text-slate-600 border-slate-300">
            Cancelled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payments & Invoicing
          </h1>
          <p className="text-sm text-slate-500">
            Track business revenue, client invoices, GST calculations, and payment statuses.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all rounded-xl h-10 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Paid Revenue
            </CardTitle>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ₹{paymentsSummary.totalRevenuePaid.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {paymentsSummary.paidCount} cleared {paymentsSummary.paidCount === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Invoices
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ₹{paymentsSummary.totalPending.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {paymentsSummary.pendingCount} awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Amount
            </CardTitle>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              ₹{paymentsSummary.totalOverdue.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {paymentsSummary.overdueCount} {paymentsSummary.overdueCount === 1 ? "invoice" : "invoices"} past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List Card */}
      <Card className="rounded-2xl border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {["ALL", "PAID", "SENT", "OVERDUE", "DRAFT"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  statusFilter === status
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice or client..."
              className="pl-9 h-9 text-xs rounded-xl border-slate-200"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No invoices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Create an invoice for your client projects to track billables, GST, and cleared payments.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {inv.client?.full_name || "Unknown"}
                      </div>
                      {inv.client?.company_name && (
                        <div className="text-xs text-slate-400">
                          {inv.client.company_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(inv.due_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status, inv.due_date)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 group-hover:text-emerald-600 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <CreateInvoiceDialog
        clients={clients}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <InvoiceDetailsDialog
        invoice={selectedInvoice}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
