import { z } from 'zod';

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(255),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Price must be non-negative'),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid('Please select a valid client'),
  project_id: z.string().uuid('Invalid project').optional().nullable(),
  invoice_number: z.string().min(1, 'Invoice number is required').max(50),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  tax_rate: z.number().min(0).max(100).default(18),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
});

export const updateInvoiceStatusSchema = z.object({
  invoice_id: z.string().uuid(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
  payment_method: z.string().max(50).optional().nullable(),
  payment_reference: z.string().max(100).optional().nullable(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
