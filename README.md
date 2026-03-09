# 🏠 Skyway Suites - Property Booking Platform

A full-stack Airbnb-like property booking platform built with React, TypeScript, Tailwind CSS, and Neon PostgreSQL.

## 🎨 Design

- **Primary Color**: Olive Green (#6B7C3C)
- **Secondary Color**: Dark Beige (#C9B99B)
- **Accent**: Charcoal Grey (#3a3a3a)

## ✨ Features

### Customer Features
- 🏡 Browse properties with detailed information
- 🔍 Filter and search properties
- 📅 Book properties with date selection
- 👤 User authentication (sign up/login)
- 📞 Contact form
- 📱 Fully responsive design

### Admin Dashboard
- 📊 Properties management (Create, Read, Update, Delete)
- 📅 Bookings management
- 👥 Customers management
- 💳 Payments tracking
- ⚙️ Settings configuration
- 🔐 Secure admin-only access

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router 7** - Routing
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **Sonner** - Toast notifications

### Backend (Serverless)
- **Vercel Functions** - Serverless API
- **PostgreSQL (Neon)** - Database
- **bcrypt** - Password hashing
- **jsonwebtoken** - Authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- GitHub account
- Vercel account
- Neon database account

### 🎉 **NEW: Simplified Deployment**

**Database connection is now hardcoded!** No environment variable setup needed.

**Deploy in 3 steps:**

1. **Push to GitHub**:
```bash
git add .
git commit -m "Deploy Skyway Suites"
git push origin main
```

2. **Wait for Vercel** (2-3 minutes)
   - Visit [vercel.com](https://vercel.com)
   - Auto-deploys from GitHub
   - Wait for "Ready" status ✅

3. **Initialize Database** (One-time)
   - Visit [neon.tech](https://neon.tech)
   - Open SQL Editor
   - Run `/backend-api/setup-database.sql`
   - Done! ✅

**📖 Complete deployment guide:** [`/DEPLOY_NOW.md`](/DEPLOY_NOW.md)

**🆘 Getting errors?** [`/FIX_API_ERRORS_QUICK.md`](/FIX_API_ERRORS_QUICK.md)

### Local Development

**Note**: The app runs with **mock data** locally. To use the real Neon database, deploy to Vercel or run the backend API server.

1. **Clone the repository**:
```bash
git clone <your-repo-url>
cd skyway-suites
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open browser**:
```
http://localhost:5173
```

### Database Setup

1. Go to [Neon Console](https://console.neon.tech/)
2. Open SQL Editor
3. Run the SQL from `/backend-api/setup-database.sql`
4. Sample data will be loaded automatically

## 📦 Deployment to Vercel

**Complete guide**: See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

Quick steps:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Deploy!

## 🔐 Default Admin Account

After running database setup:
- **Email**: admin@skywaysuites.com
- **Password**: admin123

⚠️ **Change this in production!**

## 📁 Project Structure

```
skyway-suites/
├── api/                      # Vercel serverless functions
│   ├── auth/                 # Authentication endpoints
│   ├── properties/           # Properties API
│   ├── bookings/            # Bookings API
│   ├── customers/           # Customers API
│   ├── payments/            # Payments API
│   ├── config/              # Database configuration
│   └── utils/               # Helper functions
├── src/
│   ├── app/
│   │   ├── components/      # React components
│   │   │   ├── admin/       # Admin dashboard components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── pages/           # Page components
│   │   │   └── admin/       # Admin pages
│   │   ├── context/         # React context providers
│   │   ├── lib/             # API functions and utilities
│   │   └── styles/          # CSS and theme files
│   └── imports/             # Assets
├── backend-api/             # Alternative Express backend (optional)
└── vercel.json              # Vercel configuration
```

## 🌐 API Endpoints

All endpoints are prefixed with `/api`

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (admin)
- `PUT /api/properties/:id` - Update property (admin)
- `DELETE /api/properties/:id` - Delete property (admin)

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking status

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Record payment

### Other
- `POST /api/contact` - Submit contact form
- `GET /api/health` - Health check

## 🧪 Testing

### Test Admin Access
1. Go to `/login`
2. Use admin credentials
3. Click "Admin Dashboard" in header
4. Test CRUD operations

### Test Customer Flow
1. Browse properties on homepage
2. Click a property to view details
3. Create an account
4. Make a booking

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ HTTPS (Vercel auto-generates SSL)
- ✅ Environment variables for secrets
- ✅ CORS protection
- ✅ SQL injection prevention (parameterized queries)

## 📊 Database Schema

### Tables
- `users` - User accounts
- `properties` - Property listings
- `customers` - Customer profiles
- `bookings` - Booking records
- `payments` - Payment transactions
- `contact_submissions` - Contact form submissions

See `/backend-api/setup-database.sql` for full schema.

## 🎯 Environment Variables

### Required
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

### Optional
- `NODE_ENV` - Environment (development/production)
- `VITE_API_URL` - API base URL (defaults to `/api`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in environment variables
- Check Neon database is active (auto-suspends after inactivity)
- Ensure IP is whitelisted in Neon settings

### Build Failures
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`
- Verify all dependencies in `package.json`

### Authentication Issues
- Clear browser localStorage
- Verify `JWT_SECRET` is set
- Check browser console for errors

## 📞 Support

For issues and questions:
1. Check [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
2. Check [QUICK_START.md](./QUICK_START.md)
3. Review API logs in Vercel dashboard

---

Made with ❤️ for property management excellence