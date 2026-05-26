// src/app/api/auth/me/route.ts
//
// GET /api/auth/me
// Returns the currently-logged-in user, or { user: null } for anonymous visitors.
// Purpose: lets the browser ask the server "who am I?" — the session cookie is
// httpOnly, so JavaScript can't read it directly. This endpoint bridges that gap.

import { getSession } from "@/lib/auth";

export async function GET() {
  // 1. Ask the auth layer: is there a valid session?
  //    getSession() reads the cookie, looks up the session row, checks expiry.
  //    Returns { user: User } if everything is good, or null otherwise.
  const session = await getSession();

  // 2. NULL CHECK FIRST. Always narrow before you reach in.c
  //    Anonymous visitor is a NORMAL state, not an error — return 200, not 401.
  if (!session) {
    return Response.json({ user: null }, { status: 200 });
  }

  // 3. Now (and only now) destructure the fields we want to send.
  //    HAND-PICK. Never spread `session.user` — that would leak passwordHash.
  //    Listing the fields explicitly is the safety mechanism.
  const { id, email, name } = session.user;

  // 4. Respond with only the safe fields.
  return Response.json({ user: { id, email, name } }, { status: 200 });
}
