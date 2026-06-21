import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().max(500_000).optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  noteDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const noteUpdateSchema = noteSchema.partial();

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const syncSchema = z.object({
  operations: z.array(
    z.object({
      id: z.string(),
      entityType: z.enum(["note", "tag"]),
      entityId: z.string(),
      operation: z.enum(["create", "update", "delete", "restore"]),
      payload: z.record(z.string(), z.unknown()),
      createdAt: z.string(),
    })
  ),
  lastSyncAt: z.string().optional(),
});

export type NoteInput = z.infer<typeof noteSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
export type SyncInput = z.infer<typeof syncSchema>;
