import { z } from 'zod';

export const createAdCampaignSchema = z.object({
  platform: z.enum(['GOOGLE_ADS', 'META_ADS', 'OTHER']),
  campaign_name: z.string().min(2, 'Campaign name must be at least 2 characters').max(150),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).default('ACTIVE'),
  spend: z.number().min(0, 'Spend must be non-negative'),
  impressions: z.number().int().min(0, 'Impressions must be non-negative'),
  clicks: z.number().int().min(0, 'Clicks must be non-negative'),
  leads_generated: z.number().int().min(0, 'Leads generated must be non-negative'),
});

export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;
