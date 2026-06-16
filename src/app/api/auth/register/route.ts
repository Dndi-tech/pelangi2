import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { normalizePhone } from "@/lib/identifier";

// Accepts either email or phone (or both). zod's .refine() enforces
// "at least one of the two is required" — this is the cross-field rule
// that .optional() on each individual field can't express alone.
const RegisterSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, "Password minimum 8 characters"),
    name: z.string().min(1),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Email atau No. Telepon wajib diisi",
  });

export async function POST(request: NextRequest) {
  // 1. Parse and validate
  const body = await request.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, name } = parsed.data;
  // Email — normalize: lowercase + trim. Stays null if user gave phone.
  const email = parsed.data.email?.toLowerCase().trim() ?? null;

  // 2. Normalize phone server-side (single source of truth).
  //    If user submitted a phone but it doesn't parse to E.164, reject 400.
  let phone: string | null = null;
  if (parsed.data.phone) {
    phone = normalizePhone(parsed.data.phone);
    if (!phone) {
      return Response.json(
        { error: "Format nomor telepon tidak valid" },
        { status: 400 }
      );
    }
  }

  // 3. Uniqueness check across BOTH identifiers. Generic 409 — anti-enumeration:
  //    don't reveal which of the two was the conflict.
  const conditions = [];
  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });

  const existing = await prisma.user.findFirst({
    where: { OR: conditions },
  });
  if (existing) {
    return Response.json(
      { error: "Email atau nomor telepon sudah terdaftar" },
      { status: 409 }
    );
  }

  // 4. Hash password
  const passwordHash = await hashPassword(password);

  // 5. Create user + session in one transaction.
  //    If session insert fails, user creation rolls back — no orphaned users.
  const { user, session } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, phone, passwordHash, name },
    });
    const session = await tx.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    return { user, session };
  });

  // 6. Set the session cookie (server controls this; httpOnly)
  await setSessionCookie(session.id, session.expiresAt);

  // 7. Hand-picked DTO. NEVER spread {...user} — passwordHash would leak.
  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    },
    { status: 201 }
  );
}
