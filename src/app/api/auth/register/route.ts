import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

const RegisterSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Password minimum 8 characters"),
    name: z.string().min(1),
    phone: z.string().optional(),
  })
  .refine((data) => !!data.email || !!data.phone, {
    message: "Email atau No. Telepon wajib diisi",
  });
export async function POST(request: NextRequest) {
  // 1. Parse and validate the body
  const body = await request.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { password, name, phone } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  // 2. Check if email already exists → 409 Conflict
  const existing = await prisma.user.findFirst({
    where: {
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(
        Boolean
      ) as any,
    },
  });

  if (existing) {
    return Response.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  // 3. Hash the password
  const passwordHash = await hashPassword(password);
  // 4. Create the user + session in a transaction
  const { user, session } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, name, phone },
    });
    const session = await tx.session.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    return { user, session };
  });
  // 5. Set the session cookie

  await setSessionCookie(session.id, session.expiresAt);
  // 6. Return 201 Created with the user (minus passwordHash)
  return Response.json(
    {
      user: { id: user.id, email: user.email, name: user.name },
      // notice: NO passwordHash returned
    },
    { status: 201 }
  );
}
