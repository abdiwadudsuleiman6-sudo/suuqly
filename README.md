# Suuqly – The Alibaba of Garissa & Northern Kenya

**Your Marketplace. Your Community.**

A multi‑vendor B2B & retail marketplace built for Garissa County, denominated in Kenyan Shillings (KES). The demo runs entirely locally – no cloud services required.

---

## Quick Start (Hackathon Demo)

```bash
# 1️⃣ Install all dependencies (root, server, client)
npm run install:all

# 2️⃣ Start the API (port 5000) and React app (port 5173)
npm run dev
```

The frontend will be available at **http://localhost:5173**. The backend API runs on **http://localhost:5000**.

---

## 1‑Click Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| **Platform Admin** | `admin@suuqly.co.ke` | `Admin123!` |
| **Verified Supplier 1** | `seller1@suuqly.co.ke` | `Seller123!` |
| **Verified Supplier 2** | `seller2@suuqly.co.ke` | `Seller123!` |
| **Buyer / Customer** | `customer@suuqly.co.ke` | `Customer123!` |

Use the **1‑Click Demo Login Bar** on the login page (or the homepage hero card) to switch roles instantly.

---

## Configuration

*Copy `.env.example` to `server/.env` if you wish to integrate real Safaricom M‑Pesa Daraja credentials.* Leaving the M‑Pesa keys empty keeps the app in **sandbox demo mode**, which is sufficient for the hackathon presentation.

---

## Verifying the Demo

1. After `npm run dev` finishes, open `http://localhost:5173`.
2. Log in using any demo account.
3. Browse products, add items to the cart, request a bulk quote, or manage a store as a supplier.
4. The admin dashboard is reachable at `/admin` (e.g., `http://localhost:5173/admin`).

All pages should load without errors and the API should respond successfully (check the terminal for any server logs).

---

Enjoy exploring **Suuqly**!
