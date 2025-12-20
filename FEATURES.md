# Dhanya CRM - Feature Documentation

A comprehensive Car Rental Management System built with React and Supabase.

---

## 📊 Dashboard

### Stats Overview
- **Available Cars** - Count of cars ready for rental
- **Active Rentals** - Currently ongoing rentals
- **Monthly Revenue** - Total earnings this month
- **Total Customers** - Complete customer count

### Fleet Availability Calendar
- 7-day visual calendar showing car availability
- Click any date to view scheduled pickups/returns

### Today's Schedule
- Pickups and drop-offs for the selected date
- Quick view of customer and vehicle details

### Maintenance Alerts
Shows alerts for:
- 🔧 Cars in maintenance status
- 🛡️ Insurance expiry (expired or within 30 days)
- 📄 RC Certificate expiry
- 📄 Pollution Certificate expiry
- 📄 Fitness Certificate expiry

### Recent Activity
- Latest rental bookings and status changes

---

## 🚗 Fleet Management

### Car Inventory
- Grid view of all vehicles with status badges
- Status: Available, Rented, Maintenance, Disabled
- Daily rate display

### Add/Edit Vehicle
- Make, Model, Year
- License Plate (auto-capitalized, validated for uniqueness)
- Daily Rate
- Status management

### Car Actions
- Enable/Disable vehicles
- Mark for maintenance
- View rental history

---

## 📅 Rentals

### Rental Management
- Filter by: All, Active, Completed, Cancelled
- Search by customer name or phone
- Sort by date

### New Booking
- Customer name and phone
- Vehicle selection (shows only available cars)
- Start/End date with time
- From/To location
- Total amount (auto-calculated, editable)

### Identity Documents (Optional)
- PAN Card number + photo upload/camera capture
- Aadhar Card number + photo upload/camera capture
- Driving License number + photo upload/camera capture

### View Rental Details
- Complete booking information
- Customer details
- Vehicle information
- Identity documents with photo preview

### Rental Actions
- Mark as Complete
- Cancel Rental
- View Details

---

## 👥 Customers

### Customer List
- Name, Phone, Status badge
- Click any row for detailed profile

### Customer Profile Modal
- Avatar with initials
- "Loyal Customer" badge (5+ rentals)
- **Stats:**
  - Total Bookings
  - Total Amount Spent
  - Active Rentals

### Rental History
- Complete list of all rentals by customer
- Vehicle, dates, amount, status
- Quick link to view rental details

---

## 🛡️ Insurance

### Insurance Overview
Stat cards showing:
- 🔴 Expired (past due)
- 🟡 Expiring Soon (within 30 days)
- 🟢 Valid
- ⚪ Not Set

### Vehicle Insurance Table
- Click stat cards to filter
- Search by vehicle
- Insurance provider, policy number, expiry date

### Edit Insurance
- Expiry date
- Provider name
- Policy number
- Document upload (PDF/image)

---

## 💰 Payments

### Payment Stats
- **Total Billed** - Sum of all rental amounts
- **Collected** - Amount received
- **Outstanding** - Pending balance
- **Paid Rentals** - Count of fully paid

### Payment Filters
- All, Pending, Partial, Paid

### Payment Table
- Customer, Vehicle, Dates
- Total amount, Paid amount, Balance
- Payment status badge

### Update Payment
- Change status: Pending → Partial → Paid
- Enter amount paid
- Auto-calculates balance

---

## ⚙️ Settings

### General Tab
**Profile**
- Name, Email
- Administrator badge

**Preferences**
- Theme: Dark / Light / System
- Currency: INR, USD, EUR
- Tax Rate %

### Business Tab
**Business Profile**
- Company Name
- Business Phone
- Business Email
- Address

**Rental Defaults**
- Default Daily Rate
- Security Deposit
- Late Fee %
- Minimum Rental Days

**Invoice Settings**
- Invoice Prefix (e.g., INV-)
- Payment Terms
- Footer Notes
- Show Tax Breakdown toggle

### Notifications Tab
- Email Notifications
- Push Notifications
- Rental Updates
- Fleet Status Alerts

### Security Tab
- Update Password

### Data Tab
Export to CSV:
- 📅 Export Rentals
- 👥 Export Customers
- 🚗 Export Fleet

---

## 🔐 Authentication

- Email/Password Login
- User Registration
- Forgot Password Recovery
- Protected Routes

---

## 🗄️ Database Schema

### Tables Required

```sql
-- Cars Table
cars (
  id, make, model, year, license_plate, daily_rate, status,
  insurance_expiry_date, insurance_provider, insurance_policy_number,
  insurance_document_url, rc_expiry_date, pollution_expiry_date,
  fitness_expiry_date, created_at
)

-- Rentals Table
rentals (
  id, car_id, customer_name, customer_phone,
  start_date, end_date, start_time, end_time,
  from_location, to_location, total_amount,
  status, payment_status, amount_paid,
  pan_number, pan_image_url,
  aadhar_number, aadhar_image_url,
  license_number, license_image_url,
  created_at
)

-- Customers Table
customers (
  id, name, phone, created_at
)
```

---

## 🎨 Design System

- Dark theme by default
- Responsive layout
- Glass-morphism cards
- Lucide icons
- Toast notifications

---

**Built with:** React, Vite, Supabase, Tailwind CSS, Lucide Icons
