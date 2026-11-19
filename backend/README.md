# BizzConnect Backend

Express and MongoDB API for the BizzConnect procurement platform.

## Setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run seed
npm run dev
```

The API runs at `http://localhost:5000/api`. Set `MONGO_URI`, `JWT_SECRET`, and `FRONTEND_URL` in `.env`.

## Seed accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@bizzconnect.local | Admin123! |
| Retailer | retailer@bizzconnect.local | Retailer123! |
| Wholesaler | wholesaler@bizzconnect.local | Wholesaler123! |

## API groups

- `POST /api/auth/register` - public retailer or wholesaler registration
- `POST /api/auth/login` - JWT login
- `GET /api/auth/me` - authenticated current user
- `GET|POST|PATCH|DELETE /api/products` - catalogue discovery and wholesaler management
- `GET|POST /api/group-orders` - collective orders
- `POST /api/group-orders/:id/join` - add or update retailer quantity
- `GET|POST /api/bids` - reverse-auction bids
- `POST /api/bids/:id/accept` - admin supplier selection
- `GET|POST /api/orders` - retail, wholesaler, and admin order access
- `POST /api/payments/process` - simulated payment processing
- `GET|PATCH /api/delivery` - hub and last-mile tracking
- `GET|POST|PATCH /api/disputes` - exception and refund workflows
- `GET /api/analytics/dashboard` - role-aware procurement metrics
- `GET|PATCH /api/admin/*` - platform administration

Protected endpoints require `Authorization: Bearer <token>`.
