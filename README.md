# Dashboard ERP System

A comprehensive ERP dashboard system built for **Readers Point Pvt. Ltd.** with modern web technologies.

## 🚀 Features

- **Sales Management** - Track sales transactions, customers, and invoices
- **Purchase Management** - Manage vendor purchases and payments
- **Customer Management** - Complete customer information and transaction history
- **Vendor Management** - Vendor details and purchase records
- **Bank Transactions** - Track deposits, withdrawals, and payment history
- **HR Management** - Employee records and details
- **Payroll System** - Automated salary calculations with allowances
- **Print-Ready Reports** - Professional landscape-oriented printouts

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- React Router DOM
- Lucide React (Icons)
- Custom CSS with modern design

### Backend
- Node.js
- Express 5
- MongoDB (Atlas)
- Mongoose
- JWT Authentication
- Helmet (Security)
- Rate Limiting

## 📦 Project Structure

```
dashboard/
├── backend/          # Node.js Express API
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API routes
│   ├── middleware/   # Auth & validation
│   ├── index.js      # Server entry point
│   └── vercel.json   # Vercel config
├── frontend/         # React Vite app
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── api/      # API calls
│   │   └── index.css # Global styles
│   └── vercel.json   # Vercel config (not needed for frontend)
└── DEPLOYMENT_GUIDE.md
```

## 🔧 Local Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB Atlas account

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB URI:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

5. Start backend:
```bash
npm start
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env`:
```
VITE_API_BASE=http://localhost:5000
```

5. Start frontend:
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 🌐 Deployment

See detailed deployment instructions in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Quick Deploy Summary

1. **Backend** → Deploy to Vercel
   - Add MongoDB URI as environment variable
   - Get backend URL

2. **Frontend** → Deploy to Vercel
   - Update `VITE_API_BASE` with backend URL
   - Deploy with Vite preset

## 🔐 Environment Variables

### Backend (`.env`)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

### Frontend (`.env`)
```
VITE_API_BASE=http://localhost:5000
# Or in production:
# VITE_API_BASE=https://your-backend.vercel.app
```

## 📝 API Documentation

Once backend is running, visit:
```
http://localhost:5000/api-docs
```

## 🖨️ Print Features

All pages support professional printing with:
- Landscape orientation
- Company header (Readers Point Pvt. Ltd.)
- Compact table formatting
- Dark headers with zebra striping

## 👤 Company Information

- **Company**: Readers Point Pvt. Ltd.
- **Address**: Putalisadak, Kathmandu
- **Phone**: 9841467180
- **Email**: rokkayaman60@gmail.com

## 📄 License

Private - All Rights Reserved

## 🤝 Support

For issues or questions, contact: rokkayaman60@gmail.com

---

Built with ❤️ for Readers Point Pvt. Ltd.
