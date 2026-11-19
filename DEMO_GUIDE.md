# 🚀 BizzConnect - Live Demo Presentation Walkthrough

This guide ensures your live demo is 100% stable, flawless, and highlights the **bidirectional live interaction** between **Retailers** and **Wholesalers**.

---

## ⚡ Quick 1-Click Launch
Double-click `run-demo.bat` in the project root:
- Checks & starts MongoDB
- Starts the Backend API on `http://localhost:5000` (auto-seeds demo users & data if empty)
- Starts Vite Frontend on `http://localhost:5173`
- Opens your default browser automatically

---

## 👥 Pre-seeded Demo Accounts
You don't need to manually type passwords or register accounts:
1. **Retailer**: `retailer@bizzconnect.local` / `Retailer123!` (Asha Sharma - *Sharma General Store*)
2. **Wholesaler**: `wholesaler@bizzconnect.local` / `Wholesaler123!` (Rajesh Kumar - *Metro Cash & Carry*)
3. **Admin**: `admin@bizzconnect.local` / `Admin123!` (Platform Operations)

> **Pro-Tip for Live Demo**:
> Look at the top navigation bar. There is a **Demo Switcher Bar**:
> `[ ROLE: Retailer | Wholesaler | Admin ]`
> You can switch between any role with **1 single click** in real-time, without logging out!

---

## 🔄 Bidirectional Live Interaction Demo Script (5 Minutes)

### Step 1: Wholesaler Adds a Product (Wholesaler ➔ Retailer)
1. In the top bar, click **Wholesaler**.
2. Go to **Product catalogue** and click **+ Add product**.
3. Add a new listing:
   - **Name**: `Organic Green Cardamom`
   - **Category**: `Spices`
   - **Unit**: `kg`
   - **Minimum order (MOQ)**: `20`
   - **Wholesaler price**: `₹1,200`
   - **Retail price**: `₹1,600`
   - **Stock**: `500`
4. Click **Add listing**.
5. Switch to **Retailer** via the topbar:
   - Go to **Browse products**.
   - Notice that `Organic Green Cardamom` is **immediately visible** in the catalogue with MOQ 20 kg!

---

### Step 2: Retailer Starts a Group Order (Retailer ➔ Wholesaler)
1. While logged in as **Retailer**, click **Start a group order** on `Organic Green Cardamom` (or from Overview).
2. Enter your initial pledge: `15` kg (Starter target will automatically be set to 30 kg).
3. Click **Create group**.
4. Switch to **Wholesaler** via the topbar (or open Wholesaler in another window):
   - Click **Group opportunities**.
   - You will see the new pooled demand: `Organic Green Cardamom · 15 / 30 kg pooled (50%)` with a live progress track!

---

### Step 3: Wholesaler Submits a Reverse Auction Bid
1. In **Wholesaler Workspace** under **Group opportunities**, click **Submit bid**.
2. Enter competitive pricing:
   - **Price per unit**: `₹1,150`
   - **Minimum order**: `15`
   - **Delivery days**: `2`
   - **Terms**: `Direct delivery to distribution hub`
3. Click **Submit bid**.
4. The group status changes to `bidding`, and Wholesaler sees `Bid submitted: ₹1,150 / unit`.

---

### Step 4: Admin / Platform Selects Best Supplier
1. Click **Admin** on the top switcher.
2. Go to **Compare supplier bids**.
3. Notice the group order with Metro Cash & Carry's offer of `₹1,150 / kg` and reliability score `92/100`.
4. Click **Select supplier**.
5. The status turns green: supplier selected!

---

### Step 5: Retailer Checkouts with Simulated Payment (Retailer ➔ Wholesaler)
1. Switch back to **Retailer**.
2. Under **Collective buying**, the card updates:
   - Status: `Supplier selected: Metro Cash & Carry`
   - Discounted bulk price: `₹1,150/kg`
   - Click **Checkout ₹1,150 ->**.
3. Summary modal opens with total amount and delivery charge.
4. Click **Pay & place order** (simulated payment).
5. A formal Tax Invoice & Payment Receipt pop-up appears (printable / PDF ready).
6. Close the invoice.

---

### Step 6: Wholesaler Fulfils Order & Retailer Sees Live Status (Wholesaler ➔ Retailer)
1. Switch to **Wholesaler**.
2. Click **Orders & fulfilment**.
3. The new order appears right away.
4. Change status dropdown from `Pending` ➔ `Confirmed` ➔ `Out for delivery` ➔ `Delivered`.
5. Switch to **Retailer**:
   - Order in **Orders & tracking** displays as `delivered` (green pill).
   - Retailer's **Lifetime savings** metric increases automatically!

---

## 🛡️ What Was Fixed to Prevent Breaking
- **Live Sync & Polling**: Background auto-sync every 3.5 seconds + on window focus so two windows side-by-side sync without page refresh.
- **Auto-Seeding**: Backend seeds demo users, products, and group orders automatically if DB is empty.
- **Group Order Visibility**: Wholesalers now see forming groups (`open`), reached thresholds, and active bids.
- **Bid Accepting**: Retailer initiator and Admin can both accept bids without getting locked out.
- **Checkout Pledge Fix**: Retailer who starts a group is automatically recorded in `joinedGroups`, preventing the "Not in group" checkout bug.
- **Product Availability Toggle**: Wholesaler can pause/activate products with live updates in Retailer view.
