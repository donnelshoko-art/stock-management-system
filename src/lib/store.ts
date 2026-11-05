import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type TransactionType = "received" | "sold" | "damaged";

export type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  price: number;
  stock: number;
  lowStockAt: number;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  unitPrice: number;
  note: string;
  createdAt: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;
export type ProductUpdateInput = Omit<ProductInput, "stock">;

type Database = {
  products: Product[];
  transactions: Transaction[];
};

export class StoreError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StoreError";
  }
}

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "stockvoice.json");
let writeQueue: Promise<void> = Promise.resolve();

function seedDatabase(): Database {
  const now = Date.now();
  const seedProducts = [
    { id: "seed-bread", name: "Brown bread", category: "Bakery", sku: "BAK-001", unit: "loaves", price: 1.5, stock: 18, lowStockAt: 6, received: 24, sold: 6 },
    { id: "seed-milk", name: "Full cream milk", category: "Dairy", sku: "DAI-001", unit: "cartons", price: 1.2, stock: 12, lowStockAt: 5, received: 20, sold: 8 },
    { id: "seed-eggs", name: "Free range eggs", category: "Dairy", sku: "DAI-002", unit: "trays", price: 4.5, stock: 6, lowStockAt: 8, received: 24, sold: 18 },
    { id: "seed-oil", name: "Cooking oil", category: "Groceries", sku: "GRO-001", unit: "bottles", price: 3.25, stock: 8, lowStockAt: 5, received: 12, sold: 4 },
    { id: "seed-soap", name: "Laundry soap", category: "Household", sku: "HOU-001", unit: "bars", price: 0.95, stock: 3, lowStockAt: 5, received: 10, sold: 6, damaged: 1 },
    { id: "seed-tea", name: "Tea bags", category: "Groceries", sku: "GRO-002", unit: "boxes", price: 2.75, stock: 7, lowStockAt: 4, received: 12, sold: 5 },
    { id: "seed-sugar", name: "White sugar", category: "Groceries", sku: "GRO-003", unit: "kg", price: 1.8, stock: 5, lowStockAt: 6, received: 8, sold: 3 },
    { id: "seed-meal", name: "Maize meal", category: "Groceries", sku: "GRO-004", unit: "bags", price: 5.5, stock: 4, lowStockAt: 5, received: 8, sold: 4 },
  ];

  const products: Product[] = seedProducts.map(({ received: _received, sold: _sold, damaged: _damaged, ...product }) => ({
    ...product,
    createdAt: new Date(now - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 15).toISOString(),
  }));
  const transactions: Transaction[] = [];

  for (const product of seedProducts) {
    const savedProduct = products.find((item) => item.id === product.id);
    if (!savedProduct) continue;
    const receiveTime = new Date(now - 1000 * 60 * (70 + transactions.length * 19)).toISOString();
    const saleTime = new Date(now - 1000 * 60 * (25 + transactions.length * 7)).toISOString();
    transactions.push({
      id: randomUUID(),
      productId: product.id,
      productName: product.name,
      type: "received",
      quantity: product.received,
      unitPrice: savedProduct.price,
      note: "Sample opening stock",
      createdAt: receiveTime,
    });
    if (product.sold) {
      transactions.push({
        id: randomUUID(),
        productId: product.id,
        productName: product.name,
        type: "sold",
        quantity: product.sold,
        unitPrice: savedProduct.price,
        note: "",
        createdAt: saleTime,
      });
    }
    if (product.damaged) {
      transactions.push({
        id: randomUUID(),
        productId: product.id,
        productName: product.name,
        type: "damaged",
        quantity: product.damaged,
        unitPrice: savedProduct.price,
        note: "Damaged packaging",
        createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
      });
    }
  }
  transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { products, transactions };
}

async function ensureDatabase() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
    try {
      await writeFile(dataFile, JSON.stringify(seedDatabase(), null, 2), { flag: "wx" });
    } catch (writeError) {
      if (!(writeError && typeof writeError === "object" && "code" in writeError && writeError.code === "EEXIST")) {
        throw writeError;
      }
    }
  }
}

async function readDatabase(): Promise<Database> {
  await ensureDatabase();
  const contents = await readFile(dataFile, "utf8");
  const parsed: unknown = JSON.parse(contents);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("products" in parsed) ||
    !Array.isArray(parsed.products) ||
    !("transactions" in parsed) ||
    !Array.isArray(parsed.transactions)
  ) {
    throw new Error(`The stock data file at ${dataFile} is not valid.`);
  }
  return parsed as Database;
}

async function writeDatabase(database: Database) {
  const temporaryFile = `${dataFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(database, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

async function updateDatabase<T>(update: (database: Database) => T): Promise<T> {
  const result = writeQueue.then(async () => {
    const database = await readDatabase();
    const value = update(database);
    await writeDatabase(database);
    return value;
  });
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function listProducts() {
  const database = await readDatabase();
  return database.products.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createProduct(input: ProductInput) {
  return updateDatabase((database) => {
    const sku = input.sku.trim() || `SV-${randomUUID().slice(0, 8).toUpperCase()}`;
    if (database.products.some((product) => product.sku.toLowerCase() === sku.toLowerCase())) {
      throw new StoreError("That SKU is already in use.", 409);
    }
    const now = new Date().toISOString();
    const product: Product = {
      ...input,
      name: input.name.trim(),
      category: input.category.trim(),
      sku,
      unit: input.unit.trim(),
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    database.products.push(product);
    return product;
  });
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  return updateDatabase((database) => {
    const product = database.products.find((item) => item.id === id);
    if (!product) throw new StoreError("Product not found.", 404);
    const sku = input.sku.trim() || product.sku;
    if (database.products.some((item) => item.id !== id && item.sku.toLowerCase() === sku.toLowerCase())) {
      throw new StoreError("That SKU is already in use.", 409);
    }
    Object.assign(product, {
      ...input,
      name: input.name.trim(),
      category: input.category.trim(),
      sku,
      unit: input.unit.trim(),
      updatedAt: new Date().toISOString(),
    });
    return product;
  });
}

export async function deleteProduct(id: string) {
  return updateDatabase((database) => {
    const index = database.products.findIndex((product) => product.id === id);
    if (index < 0) throw new StoreError("Product not found.", 404);
    const [product] = database.products.splice(index, 1);
    return product;
  });
}

export async function listTransactions() {
  const database = await readDatabase();
  return database.transactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createTransaction(input: {
  productId: string;
  type: TransactionType;
  quantity: number;
  note: string;
}) {
  return updateDatabase((database) => {
    const product = database.products.find((item) => item.id === input.productId);
    if (!product) throw new StoreError("Choose a product that exists in your inventory.", 404);
    if (input.type !== "received" && input.quantity > product.stock) {
      throw new StoreError(`Only ${product.stock} ${product.unit} of ${product.name} are on hand.`, 409);
    }
    product.stock += input.type === "received" ? input.quantity : -input.quantity;
    product.updatedAt = new Date().toISOString();
    const transaction: Transaction = {
      id: randomUUID(),
      productId: product.id,
      productName: product.name,
      type: input.type,
      quantity: input.quantity,
      unitPrice: product.price,
      note: input.note.trim(),
      createdAt: new Date().toISOString(),
    };
    database.transactions.push(transaction);
    return transaction;
  });
}
