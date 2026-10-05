# 💅 Nail Art House - Backend API

Backend management & registration system for Nail Art House, connected with **Neon Serverless PostgreSQL**.

---

## 🚀 Features

- **Nail Works Registration & Showcase**:
  - Register new nail artwork (designs, client name, artist, pricing, category, photo URL).
  - Search, filter by category, update, and delete.
- **Client Online Registrations**:
  - Bookings & client registration with appointment date, time, and style preferences.
  - Status management (`pending`, `confirmed`, `completed`, `cancelled`).
- **Services Catalog**:
  - Pre-configured nail care services (Gel Extensions, Acrylic, French Polish, Spa Pedicure, etc.).
- **Neon Cloud DB Integration**:
  - Direct secure SSL pooling with Neon PostgreSQL.

---

## 🛠️ Setup Instructions

### 1. Configure Neon Connection String
In your Neon Console (as seen in your browser):
1. Click the green **"Connect"** button on the left sidebar.
2. Copy the connection string.
3. Open [.env](file:///c:/Users/acer/Desktop/abysii/.env) and paste it:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-plain-union-ayjualqp.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Initialize Database Tables
Run the database schema setup:
```bash
npm run db:init
```

### 3. Start the Development Server
```bash
npm run dev
```
Server will run at `http://localhost:5000`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check API & Neon DB connection status |
| `GET` | `/api/nail-works` | Get all registered nail works |
| `POST` | `/api/nail-works` | Register a new nail work |
| `GET` | `/api/nail-works/:id` | Get details of a single nail work |
| `PUT` | `/api/nail-works/:id` | Update nail work |
| `DELETE` | `/api/nail-works/:id` | Delete nail work |
| `GET` | `/api/registrations` | View all client appointment registrations |
| `POST` | `/api/registrations` | Register a new client appointment online |
| `PATCH` | `/api/registrations/:id/status`| Update status (`pending`, `confirmed`, `completed`) |
| `GET` | `/api/services` | List all salon service packages |
