# Dhanya Car Rentals - Admin Portal

A modern, responsive admin dashboard for managing car rentals, fleet, customers, and payments.

![Admin Portal](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-cyan)

## 🚀 Features

### Dashboard
- Real-time fleet status overview
- Revenue tracking (daily/monthly)
- Fleet availability calendar
- Today's schedule (pickups & drop-offs)
- Maintenance & insurance alerts

### Fleet Management
- Add, edit, delete vehicles
- Soft delete (preserves rental history)
- Restore deleted vehicles
- Status management (Available/Rented/Maintenance)
- Insurance & document expiry tracking

### Rental Management
- Create new bookings
- Auto-calculate rental amount
- Customer identity documents (PAN, Aadhar, License)
- Invoice generation & printing
- Status updates (Active/Completed/Cancelled)

### Additional Features
- Customer database with rental history
- Payment tracking
- Settings & preferences
- WhatsApp support button
- Dark/Light theme support

## 📋 Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **Authentication:** Supabase Auth
- **API Client:** Axios
- **Icons:** Lucide React
- **Deployment:** Vercel

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Backend API running (see Backend README)
- Supabase project configured

### 1. Clone the Repository

```bash
git clone https://github.com/saianikethreddyp/Car-rental-system.git
cd Car-rental-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=https://backend-car-rental-production-a9db.up.railway.app/api

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Build for Production

```bash
npm run build
```

Build output will be in the `dist/` folder.

## 📁 Project Structure

```
src/
├── api/
│   └── client.js           # Axios API client with auth
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   └── ...
│   ├── cars/                # Car-related components
│   ├── rentals/             # Rental components
│   ├── invoices/            # Invoice components
│   └── Layout.jsx           # Main layout wrapper
├── context/
│   ├── AuthProvider.jsx     # Authentication context
│   └── SettingsContext.jsx  # App settings (currency, etc.)
├── pages/
│   ├── Dashboard.jsx        # Main dashboard
│   ├── Cars.jsx             # Fleet management
│   ├── Rentals.jsx          # Booking management
│   ├── Customers.jsx        # Customer database
│   ├── Payments.jsx         # Payment tracking
│   ├── Settings.jsx         # App settings
│   └── Login.jsx            # Authentication
├── utils/
│   └── date.js              # Date formatting utilities
└── App.jsx                  # Main application
```

## 🔒 Authentication

The portal uses Supabase Auth for authentication:

1. Users log in with email/password
2. JWT token is stored in Supabase session
3. API client automatically includes token in requests
4. Protected routes redirect to login if unauthenticated

### Default Login

Use credentials created in Supabase Auth dashboard.

## 🚀 Deployment (Vercel)

### 1. Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

### 2. Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Auto-Deploy

Pushing to `main` branch triggers automatic deployment.

## 🎨 Customization

### Theme Colors

Edit `tailwind.config.js` to customize the color palette.

### Company Branding

1. Update logo in `src/assets/`
2. Edit company name in `Layout.jsx`
3. Update invoice header in `InvoiceModal.jsx`

### Currency

Change default currency in `SettingsContext.jsx`:

```javascript
currency: 'INR',  // or 'USD', 'EUR', etc.
```

## 📱 Mobile Responsiveness

The portal is fully responsive:
- Desktop: Full sidebar navigation
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation

## 🔧 Configuration

### Adding New CORS Origins

If deploying to a new domain, update the backend CORS whitelist:

```javascript
// In backend/src/app.js
const allowedOrigins = [
    'https://your-new-domain.com',
    // ... existing origins
];
```

## 📞 Support

- **WhatsApp:** Click the support button in the app
- **Email:** Contact development team

## 📄 License

Proprietary - Dhanya Car Rentals
