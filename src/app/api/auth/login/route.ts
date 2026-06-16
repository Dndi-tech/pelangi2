import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { classifyIdentifier, normalizePhone } from "@/lib/identifier";

// Login accepts ONE identifier field. Server classifies as email or phone,
// normalizes if needed, then looks up the user in the correct column.
const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1), // not min(8) — we accept whatever they type
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, password } = parsed.data;
  const type = classifyIdentifier(identifier);

  // ANTI-ENUMERATION. Same generic 401 for every failure case:
  //   - invalid format
  //   - phone normalization fails
  //   - no user found
  //   - wrong password
  // Attackers must not be able to distinguish which check failed,
  // otherwise they can enumerate registered email/phone numbers.
  const GENERIC_FAIL = () =>
    Response.json(
      { error: "Email/nomor telepon atau password salah" },
      { status: 401 }
    );

  if (type === "invalid") return GENERIC_FAIL();

  let user;
  if (type === "email") {
    user = await prisma.user.findUnique({
      where: { email: identifier.toLowerCase().trim() },
    });
  } else {
    // Phone path — normalize input to E.164 BEFORE the lookup so the same
    // number in different formats ("0812..." vs "+62812...") matches.
    const normalized = normalizePhone(identifier);
    if (!normalized) return GENERIC_FAIL();
    user = await prisma.user.findUnique({ where: { phone: normalized } });
  }

  if (!user) return GENERIC_FAIL();

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return GENERIC_FAIL();

  // Success: create session, set cookie, return hand-picked DTO.
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await setSessionCookie(session.id, session.expiresAt);

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
    },
    { status: 200 }
  );
}
