import { z } from 'zod';

export const CardSchema = z.object({
  id: z.string().min(1, 'Card ID is required'),
  provider: z.string().min(1, 'Provider name is required').max(50),
  color: z.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Valid hex color is required'),
  holder: z.string().max(100).default(''),
  number: z.string().max(100).default(''),
  numberEnc: z.string().optional(),
  label: z.string().max(50).default(''),
  payload: z.string().nullable().optional(),
  payloadEnc: z.string().nullable().optional(),
  imgB64: z.string().nullable().optional(),
  logoB64: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.number().int().nonnegative().default(0),
  createdAt: z.number().int().nonnegative().default(() => Date.now()),
  updatedAt: z.number().int().nonnegative().default(() => Date.now()),
  v: z.literal(1).default(1),
}).refine(
  (data) => Boolean(data.payload || data.payloadEnc || data.imgB64),
  {
    message: 'Either payload, payloadEnc, or imgB64 must be provided',
    path: ['payload'],
  }
);

export type Card = z.infer<typeof CardSchema>;

export const CardInputSchema = z.object({
  id: z.string().optional(),
  provider: z.string().min(1, 'Provider name is required').max(50),
  color: z.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, 'Valid hex color is required'),
  holder: z.string().max(100).default(''),
  number: z.string().max(100).default(''),
  label: z.string().max(50).default(''),
  payload: z.string().nullable().optional(),
  imgB64: z.string().nullable().optional(),
  logoB64: z.string().nullable().optional(),
  isDefault: z.boolean().default(false),
});

export type CardInput = z.infer<typeof CardInputSchema>;

export const UserMetaSchema = z.object({
  e2eeEnabled: z.boolean().default(false),
  salt: z.string().optional(),
  updatedAt: z.number().default(() => Date.now()),
});

export type UserMeta = z.infer<typeof UserMetaSchema>;
