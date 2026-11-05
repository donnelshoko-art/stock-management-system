import { NextResponse } from "next/server";
import {
  StoreError,
  type ProductInput,
  type ProductUpdateInput,
  type TransactionType,
} from "@/lib/store";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new StoreError("Please send valid JSON.", 400);
    }
    throw error;
  }
}

function parseProductDetails(value: unknown, includeStock: true): ProductInput;
function parseProductDetails(value: unknown, includeStock: false): ProductUpdateInput;
function parseProductDetails(
  value: unknown,
  includeStock: boolean,
): ProductInput | ProductUpdateInput {
  if (!isRecord(value)) throw new StoreError("Product details are required.", 400);
  const text = (key: string, maximum: number, optional = false) => {
    const field = value[key];
    if (
      optional &&
      (field === undefined || field === null || (typeof field === "string" && !field.trim()))
    ) {
      return "";
    }
    if (typeof field !== "string" || !field.trim() || field.trim().length > maximum) {
      throw new StoreError(`Enter a valid ${key} (up to ${maximum} characters).`, 400);
    }
    return field.trim();
  };
  const amount = (key: string, minimum: number) => {
    const field = value[key];
    if (typeof field !== "number" || !Number.isFinite(field) || field < minimum || field > 1_000_000_000) {
      throw new StoreError(`Enter a valid ${key}.`, 400);
    }
    return field;
  };

  const details = {
    name: text("name", 80),
    category: text("category", 40),
    sku: text("sku", 32, true),
    unit: text("unit", 12),
    price: amount("price", 0),
    lowStockAt: amount("lowStockAt", 0),
  };
  return includeStock ? { ...details, stock: amount("stock", 0) } : details;
}

export function parseProductInput(value: unknown): ProductInput {
  return parseProductDetails(value, true);
}

export function parseProductUpdateInput(value: unknown): ProductUpdateInput {
  return parseProductDetails(value, false);
}

export function parseTransactionInput(value: unknown): {
  productId: string;
  type: TransactionType;
  quantity: number;
  note: string;
} {
  if (!isRecord(value)) throw new StoreError("Transaction details are required.", 400);
  const { productId, type, quantity, note } = value;
  if (typeof productId !== "string" || !productId.trim()) {
    throw new StoreError("Choose a product.", 400);
  }
  if (type !== "received" && type !== "sold" && type !== "damaged") {
    throw new StoreError("Choose received, sold or damaged stock.", 400);
  }
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0 || quantity > 1_000_000) {
    throw new StoreError("Quantity must be greater than zero.", 400);
  }
  if (note !== undefined && (typeof note !== "string" || note.length > 160)) {
    throw new StoreError("Notes must be 160 characters or fewer.", 400);
  }
  return { productId: productId.trim(), type, quantity, note: typeof note === "string" ? note : "" };
}

export function errorResponse(error: unknown) {
  if (error instanceof StoreError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
