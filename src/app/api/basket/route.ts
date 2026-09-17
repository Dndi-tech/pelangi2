import { getSession } from "@/lib/auth";
import { getBasket } from "@/lib/services/basket";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: /* what message? */ }, { status: /* which code — same as orders */ });
  }

  const basket = await getBasket(/* what goes here, from the session? */);
  return Response.json({ basket }, { status: 200 });
}