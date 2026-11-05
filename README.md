# Stock Records

Stock Records is a small-shop stock notebook built around the capstone proposal: keep a product list, record deliveries, sales and damaged goods, get low-stock reminders, and check a simple stock history.

## Run it on your computer

You need Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first run creates `data/stockvoice.json` with example shop products and a sample stock history. Your changes are saved in that file and remain after the server restarts. Keep a backup of this file if you want to preserve your records.

`npm run build` makes a production build, and `npm start` serves that build.

## What works

- Only the shop owner can change stock. Customers can browse products, stock levels and history without the owner password.
- Click any product to see how many units are available, its selling price, shelf value and recent movements.
- A built-in **How it works** guide explains the basics for first-time users, and view-only mode clearly points to the Admin unlock.
- The interface is responsive: tables become easy-to-read product cards on phones, and modals, summaries and controls stack cleanly on smaller screens.
- Add, edit, search, filter and remove products. Removing a product keeps its earlier history.
- Record stock received, sold and damaged. The API updates quantities and prevents a sale or write-off larger than the stock on hand.
- Change quantities through stock actions so each movement remains in the history.
- Review a timestamped history and export it as a CSV.
- See current shelf value, product counts and items at or below their reorder levels.
- Speak a stock command (for example, “sold 3 milk”) or type one. Check the detected action, product and quantity, then explicitly confirm before anything is saved.

Voice capture uses the browser's built-in Web Speech API when available. It works on localhost or a secure HTTPS site in supported browsers; microphone permission is required. The command parser runs locally and matches a spoken product name, quantity and stock action. There is no OpenAI key or external AI service configured, so the parser is intentionally small and rule-based. The manual stock form works without microphone access.

## Owner access

Click **Admin** in the sidebar or top bar and enter the owner password. Set both `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in `.env.local` before starting the server; generate a strong session secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Restart the server after changing either value. There are no built-in credentials, so admin access remains disabled until both values are configured. Unlocking admin mode lets you add, edit and remove groceries and record stock movements. Without it the shop stays view-only.

## Backend and storage

The Next.js App Router provides JSON endpoints under `/api/products` and `/api/transactions`. Route handlers validate input, store product and transaction records, keep stock changes together, and return useful errors for invalid quantities or insufficient stock. Data is stored locally in `data/stockvoice.json`.

This file-based store is suitable for a local capstone demo or one running server. It is not a shared database: deployments with multiple instances or ephemeral/serverless filesystems need a durable database (for example, MongoDB as proposed) before real business use. Owner access is a single shared password, not multi-user accounts or multi-shop access.

## API at a glance

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` / `POST` | `/api/products` | List or add products |
| `PATCH` / `DELETE` | `/api/products/:id` | Edit or remove a product |
| `GET` / `POST` | `/api/transactions` | List or record a stock change |

New products accept `name`, `category`, `sku`, `unit`, `price`, `stock` and `lowStockAt`. A blank SKU is generated automatically. A transaction accepts `productId`, `type` (`received`, `sold` or `damaged`), `quantity` and an optional `note`. `POST`, `PATCH` and `DELETE` requests require an active owner admin session.
