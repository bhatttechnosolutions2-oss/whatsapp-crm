"use client";

import React, { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, CheckCircle2, Send, X, Loader2, Building, User } from "lucide-react";
import { InvoiceWithDetails } from "@/types/crm";
import { updateInvoiceStatus } from "@/lib/actions/payments";
import { InvoiceStatus } from "@/types/database";

interface InvoiceDetailsDialogProps {
  invoice: InvoiceWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailsDialog({
  invoice,
  isOpen,
  onClose,
}: InvoiceDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const handleStatusChange = (status: InvoiceStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await updateInvoiceStatus(invoice.id, status);
      if (!res.success) {
        setError(res.error || "Failed to update status");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">Paid</Badge>;
      case "SENT":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Sent</Badge>;
      case "OVERDUE":
        return <Badge className="bg-rose-500/10 text-rose-700 border-rose-200">Overdue</Badge>;
      case "DRAFT":
        return <Badge className="bg-slate-500/10 text-slate-700 border-slate-200">Draft</Badge>;
      case "CANCELLED":
        return <Badge className="bg-slate-200 text-slate-600 border-slate-300">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl transition-all my-8 max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
        {/* Actions Bar (hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            {getStatusBadge(invoice.status)}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print / Save PDF
            </Button>

            {invoice.status !== "PAID" && (
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleStatusChange("PAID")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                Mark Paid
              </Button>
            )}

            {invoice.status === "DRAFT" && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleStatusChange("SENT")}
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Mark Sent
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Printable Invoice Document */}
        <div className="space-y-6 pt-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                INVOICE
              </span>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                #{invoice.invoice_number}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Issue Date:</span>{" "}
                {new Date(invoice.issue_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Due Date:</span>{" "}
                {new Date(invoice.due_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              {invoice.paid_at && (
                <div className="text-xs text-emerald-600 font-semibold">
                  Paid On:{" "}
                  {new Date(invoice.paid_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Billed To:
              </span>
              <p className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                {invoice.client?.full_name || "Client"}
              </p>
              {invoice.client?.company_name && (
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {invoice.client.company_name}
                </p>
              )}
              {invoice.client?.phone && (
                <p className="text-xs text-slate-500">{invoice.client.phone}</p>
              )}
              {invoice.client?.email && (
                <p className="text-xs text-slate-500">{invoice.client.email}</p>
              )}
            </div>

            {invoice.project && (
              <div className="space-y-1 sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Project:
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {invoice.project.name}
                </p>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        ₹{Number(item.unit_price).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        ₹{Number(item.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No line items recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-slate-500 max-w-sm">
              {invoice.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Notes & Terms:</span>
                  <p className="whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-2 text-sm bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">
                  ₹{Number(invoice.subtotal).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST / Tax ({invoice.tax_rate}%):</span>
                <span className="font-semibold text-slate-900">
                  ₹{Number(invoice.tax_amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Total:</span>
                <span className="text-xl font-black text-emerald-600">
                  ₹{Number(invoice.total_amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
