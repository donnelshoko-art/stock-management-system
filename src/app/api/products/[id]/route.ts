import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { errorResponse, parseProductUpdateInput, readJson } from "@/lib/http";
import { deleteProduct, updateProduct } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Admin access required to edit products." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const input = parseProductUpdateInput(await readJson(request));
    return NextResponse.json(await updateProduct(id, input));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Admin access required to remove products." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    return NextResponse.json(await deleteProduct(id));
  } catch (error) {
    return errorResponse(error);
  }
}
