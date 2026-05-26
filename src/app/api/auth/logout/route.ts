import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
export async function POST() {
  // 1. Read the session cookie
  //    → get the cookie store, then read `session_id`
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  // 2. If a session ID exists, delete the matching Session row
  //    → use prisma.session.deleteMany({ where: { id: sessionId } })
  //    deleteMany is idempotent — doesn't throw if the row is already gone
  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  // 3. Delete the cookie from the browser
  //    → cookieStore.delete("session_id")
  cookieStore.delete("session_id");
  // 4. Return 200 with a simple success body
  //    → Response.json({ ok: true }, { status: 200 })
  return Response.json({ ok: true }, { status: 200 });
}
