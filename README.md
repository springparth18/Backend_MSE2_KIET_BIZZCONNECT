# BizzConnect

**Connecting Small Retailers. Unlocking Bulk Buying Power.**

BizzConnect is a managed B2B procurement platform that connects small retailers with wholesalers through collective buying, reverse auctions, and intelligent procurement. By aggregating demand from multiple retailers, BizzConnect helps unlock bulk pricing, reduce procurement costs, and simplify the entire purchasing and delivery process.

## 🚀 Key Features

### 1. Collective Buying
- Multiple retailers combine their requirements to meet wholesaler minimum order quantities (MOQs).
- Live group order progress and threshold tracking.
- Individual retailer quantity allocation.
- Neighbourhood-based buying groups.

### 2. Reverse Auctions & Smart Negotiation
- Wholesalers compete to fulfil aggregated demand.
- Compare supplier bids, pricing slabs, MOQs, and delivery terms.
- Select suitable suppliers based on price and reliability.
- Backup supplier mechanism when an order cannot be fulfilled.

### 3. Intelligent Procurement
- Smart reorder recommendations.
- Historical price comparisons and savings analytics.
- Quantity-based pricing suggestions.
- Supplier reliability scoring.
- Retailer Power Index based on purchasing activity and reliability.

### 4. End-to-End Order Management
- Centralised checkout with simulated payment processing.
- Automated order allocation and digital receipts.
- Order tracking from supplier confirmation to final delivery.
- Virtual distribution hub for receiving, sorting, and dispatching orders.
- Platform-managed delivery coordination.

### 5. Exception & Recovery Management
- Automatic alerts when group orders approach their targets.
- Recovery mechanisms for incomplete group orders.
- Payment failure handling.
- Supplier withdrawal and backup supplier support.
- Shortage, damaged goods, refund, and dispute workflows.

## 👥 Platform Roles

| Role | Responsibilities |
|---|---|
| Retailer | Browse products, join group orders, compare deals, purchase and track deliveries. |
| Wholesaler | Manage catalogue, define MOQs, submit bids and fulfil orders. |
| Admin | Verify suppliers, manage group orders, oversee payments, coordinate logistics and resolve disputes. |

## 🔄 How It Works

1. **Browse:** Retailers explore products and available wholesale deals.
2. **Join:** Retailers contribute their required quantities to a collective order.
3. **Aggregate:** The platform combines demand to reach the wholesaler's MOQ.
4. **Negotiate:** Wholesalers submit competitive bids for the aggregated demand.
5. **Confirm:** The platform selects a supplier and finalises retailer allocations.
6. **Checkout:** Retailers complete their individual payments.
7. **Consolidate:** Products arrive at the virtual distribution hub for verification and sorting.
8. **Deliver:** Orders are dispatched to individual retailers with tracking updates.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT, Role-Based Access Control |
| Charts | Recharts |
| Animations | Motion |
| Icons | Lucide React |
| PDF Receipts | jsPDF |

## 🏗️ Architecture

BizzConnect follows a role-based architecture with three primary interfaces:

- **Retailer Dashboard:** Product discovery, collective buying, order tracking and savings analytics.
- **Wholesaler Dashboard:** Catalogue management, MOQ configuration, supplier bidding and order fulfilment.
- **Admin & Operations Dashboard:** Supplier verification, group order management, payment monitoring, logistics coordination and dispute resolution.

The backend manages product catalogues, pooled demand, supplier bids, order allocation, payments, fulfilment, delivery tracking, and exception handling.

## ⚙️ Getting Started

### Prerequisites
- Node.js (LTS recommended)
- MongoDB
- npm

### Installation

**1. Clone the repository**

```bash
git clone <repository-url>
cd <project-folder>
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

**4. Start the backend**

```bash
cd backend
npm install
npm run dev
```

**5. Start the frontend**

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL provided by Vite.

## 💰 Business Model

BizzConnect can generate revenue through:

- **Transaction Commission:** Commission on successfully completed procurement orders.
- **Logistics Margin:** Revenue from delivery coordination.
- **Wholesaler Subscriptions:** Premium tools and visibility for suppliers.
- **Sponsored Placements:** Clearly labelled promotional supplier listings.

## 🔮 Future Enhancements

- AI-powered demand forecasting.
- Dynamic wholesale price prediction.
- Automated route and delivery optimisation.
- Integration with real payment gateways.
- Integration with logistics partners.
- Advanced inventory and sales analytics.
- Expansion into multiple product categories and regions.

## 🎯 Vision

To build a collaborative procurement ecosystem where independent retailers can access competitive wholesale prices, reliable suppliers, and organised logistics—without needing the purchasing power of a large retail chain.

---

**BizzConnect — Buy Together. Save Together. Grow Together.**
