# Eye Clinic Database Structure

This directory contains the complete database structure for the Eye Clinic application, organized into logical sections that align with the application's functionality.

## 📁 **Directory Structure**

```
supabase/
├── schema/                    # Database schema definitions
│   ├── 01-core-schema.sql    # Core tables (profiles, patients, appointments, case notes)
│   ├── 02-inventory-schema.sql  # Inventory tables (drugs, glasses, dispensing)
│   ├── 03-payments-schema.sql    # Payment tables (payments, subscriptions, billing)
│   └── 04-communications-schema.sql  # Communication tables (messages, notifications, audit)
├── security/                  # Security policies and configurations
│   └── 01-rls-policies.sql   # Row Level Security policies for all tables
├── migrations/               # Database migration files
│   └── 01-initial-migration.sql  # Initial migration setup and helper functions
├── seeds/                    # Seed data for development and testing
│   └── 01-seed-data.sql     # Sample data for testing and development
└── README.md                 # This file
```

## 🚀 **Execution Order**

When setting up the database, execute the files in this order:

1. **Schema Files** (in order):
   - `schema/01-core-schema.sql`
   - `schema/02-inventory-schema.sql`
   - `schema/03-payments-schema.sql`
   - `schema/04-communications-schema.sql`

2. **Security Policies**:
   - `security/01-rls-policies.sql`

3. **Migration Setup**:
   - `migrations/01-initial-migration.sql`

4. **Seed Data** (for development/testing):
   - `seeds/01-seed-data.sql`

## 🗄️ **Database Sections**

### **Core Schema** (`schema/01-core-schema.sql`)
- **Profiles**: User profiles extending Supabase Auth
- **Patients**: Patient records and medical information
- **Appointments**: Appointment scheduling and management
- **Case Notes**: Medical case notes and ophthalmology-specific data
- **Prescriptions**: Optical prescriptions and lens specifications

### **Inventory Schema** (`schema/02-inventory-schema.sql`)
- **Drugs**: Pharmacy inventory management
- **Glasses Inventory**: Frame and glasses inventory
- **Inventory Others**: Non-drug, non-glasses items
- **Dispensing**: Drug and item dispensing records
- **Glasses Orders**: Glasses order tracking

### **Payments Schema** (`schema/03-payments-schema.sql`)
- **Payments**: Payment records and receipts
- **Subscriptions**: Patient subscription management
- **Invoices**: Billing and invoicing system
- **Daily Summary**: Daily financial and operational summaries

### **Communications Schema** (`schema/04-communications-schema.sql`)
- **Messages**: Internal messaging system
- **Notifications**: User notifications and alerts
- **Outreach Log**: Patient communication tracking
- **Settings**: System configuration and user preferences
- **Push Subscriptions**: Push notification subscriptions
- **Audit Logs**: System audit trail

## 🔐 **Security Features**

### **Row Level Security (RLS)**
- All tables have RLS enabled
- Role-based access control for all operations
- Data isolation between user roles
- Secure data access patterns

### **Role-Based Permissions**
- **Doctor**: Case notes, appointments, patient access
- **Frontdesk**: Patients, appointments, inventory management
- **Admin**: Full system access and management
- **Manager**: User management, reports, audit access

## 🎯 **Key Features**

### **Ophthalmology-Specific**
- Comprehensive case notes with ophthalmology fields
- Visual acuity tracking
- Prescription management
- Glasses order tracking
- Eye examination data

### **Inventory Management**
- Multi-category inventory (drugs, glasses, other items)
- Low stock alerts
- Dispensing tracking
- Supplier management
- Expiry date tracking

### **Financial Management**
- Multiple payment types and methods
- Subscription billing
- Daily financial summaries
- Receipt tracking
- Invoice generation

### **Communication System**
- Internal messaging
- Notification system
- Patient outreach tracking
- Audit logging
- System settings

## 🛠️ **Development Setup**

### **Local Development**
1. Set up Supabase project
2. Execute schema files in order
3. Apply RLS policies
4. Run seed data for testing
5. Configure environment variables

### **Production Deployment**
1. Execute schema files in order
2. Apply RLS policies
3. Run migration tracking
4. Configure production settings
5. Set up backup procedures

## 📊 **Data Relationships**

```
Profiles (Users) ──┐
                  ├──► Appointments ──► Case Notes ──► Prescriptions
                  ├──► Patients ───────┘
                  ├──► Payments
                  ├──► Messages
                  ├──► Notifications
                  └── Settings

Patients ──► Appointments ──► Case Notes ──► Prescriptions
Patients ──► Payments
Patients ──► Subscriptions
Patients ──► Outreach Log

Drugs ──► Drug Dispensing
Glasses Inventory ──► Glasses Orders
Inventory Others ──► Inventory Dispensing
```

## 🔄 **Maintenance**

### **Regular Tasks**
- Monitor low stock alerts
- Review audit logs
- Update system settings
- Backup database regularly
- Check subscription renewals

### **Performance Optimization**
- Monitor query performance
- Optimize indexes
- Clean up old audit logs
- Archive historical data
- Update statistics

## 🧪 **Testing**

### **Test Data**
- Seed data includes sample patients, appointments, payments
- Test users for each role
- Sample inventory items
- Test messages and notifications

### **Validation**
- Use `validate_database_setup()` function
- Check RLS policies
- Verify role permissions
- Test data integrity

## 📝 **Notes**

- All tables use UUID primary keys
- Timestamps use TIMESTAMPTZ for timezone awareness
- RLS policies ensure data security
- Audit logging tracks all data changes
- Real-time subscriptions enabled for key tables

## 🚨 **Important**

- Always execute files in the specified order
- Test RLS policies thoroughly
- Backup before major changes
- Monitor performance after deployment
- Keep seed data updated for testing
