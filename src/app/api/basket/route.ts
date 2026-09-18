import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  addItem,
  getBasket,
  removeItem,
  updateQuantity,
} from "@/lib/services/basket";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "login first" }, { status: 401 });
  }

  const basket = await getBasket(session.user.id);
  return Response.json({ basket }, { status: 200 });
}

const AddItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "login first" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = AddItemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await addItem(
    session.user.id,
    parsed.data.productId,
    parsed.data.size,
    parsed.data.quantity
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
const UpdateQtySchema = z.object({
  quantity: z.number().int(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "login first" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = UpdateQtySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateQuantity(
    session.user.id,
    id,
    parsed.data.quantity
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json({ ok: true }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "login first" }, { status: 401 });
  }

  const { id } = await params;

  const result = await removeItem(session.user.id, id);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json({ ok: true }, { status: 200 });
}
