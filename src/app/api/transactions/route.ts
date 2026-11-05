import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { errorResponse, parseTransactionInput, readJson } from "@/lib/http";
import { createTransaction, listTransactions } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listTransactions());
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Admin access required to change stock." }, { status: 401 });
  }
  try {
    const input = parseTransactionInput(await readJson(request));
    return NextResponse.json(await createTransaction(input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
