"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Receipt, Loader2, X } from "lucide-react";
import { createInvoice } from "@/lib/actions/payments";
import { Client } from "@/types/crm";

interface CreateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export function CreateInvoiceDialog({ isOpen, onClose, clients }: CreateInvoiceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState("Thank you for your business. Payment is due within 14 days.");

  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "Website Design & Development - Milestone 1", quantity: 1, unit_price: 35000 },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(), description: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof LineItem, val: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: val };
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce(
    (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0
  );
  const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client");
      return;
    }

    if (items.some((i) => !i.description.trim() || i.quantity <= 0 || i.unit_price < 0)) {
      setError("Please fill out all line item descriptions and valid pricing");
      return;
    }

    startTransition(async () => {
      const res = await createInvoice({
        client_id: clientId,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: taxRate,
        notes: notes.trim(),
        items: items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      });

      if (!res.success) {
        setError(res.error || "Failed to create invoice");
      } else {
        onClose();
        // Reset
        setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
        setClientId("");
        setItems([{ id: "1", description: "Website Development", quantity: 1, unit_price: 25000 }]);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">New Professional Invoice</h3>
              <p className="text-xs text-slate-500">Create client billables with GST breakdown</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full h-8 w-8 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {/* Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Select Client *</label>
              {clients.length === 0 ? (
                <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  No clients found. Please add a client first in the Clients tab.
                </div>
              ) : (
                <select
                  value={clientId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClientId(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
                  required
                >
                  <option value="">Choose a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} {c.company_name ? `(${c.company_name})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Invoice Number *</label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-2026-001"
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Issue Date</label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-xl border-slate-200"
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Line Items
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg h-8"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <Input
                      placeholder={`Item description #${index + 1}`}
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                      className="bg-white rounded-lg border-slate-200 text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="0.1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      className="bg-white rounded-lg border-slate-200 text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                        ₹
                      </span>
                      <Input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="any"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                        className="pl-6 bg-white rounded-lg border-slate-200 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length === 1}
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & GST Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Tax / GST Rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="rounded-xl border-slate-200 w-32"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Notes / Payment Terms</label>
                <textarea
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Bank details, payment terms, or message..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs min-h-[70px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax ({taxRate}%):</span>
                  <span className="font-semibold text-slate-900">₹{taxAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900">Grand Total:</span>
                  <span className="text-xl font-black text-emerald-600">
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || clients.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Issue Invoice"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
