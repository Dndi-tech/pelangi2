import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { password } = parsed.data;
  const email = parsed.data.identifier.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
  // success — fall through to session creation
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await setSessionCookie(session.id, session.expiresAt);

  return Response.json(
    { user: { id: user.id, email: user.email, name: user.name } },
    { status: 200 }
  );
}
