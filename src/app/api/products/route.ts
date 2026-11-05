import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { errorResponse, parseProductInput, readJson } from "@/lib/http";
import { createProduct, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listProducts());
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Admin access required to add products." }, { status: 401 });
  }
  try {
    const input = parseProductInput(await readJson(request));
    return NextResponse.json(await createProduct(input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
