// src/lib/auth.ts — SERVER ONLY
//
// TODO: after `npm install server-only`, uncomment the next line.
// It makes the build fail if a Client Component ever imports this file.
// import "server-only";

import type { User } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const BCRYPT_COST = 12;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  return { user: session.user };
}

export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}
