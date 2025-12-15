# IFRS 16 Lease Accounting System

A comprehensive web-based solution for managing lease accounting in compliance with IFRS 16 standards. This full-stack application streamlines lease contract management, calculations, approvals, and financial reporting.

## Features

### Core Modules

- **Contract Initiation & Approval** - Streamlined lease contract creation with comprehensive data capture and multi-tier approval workflow
- **Lease Calculation Engine** - Advanced calculations for lease liability and right-of-use assets with automated amortization schedules
- **Disclosure & Journal Entries** - Generate compliant disclosures and accounting journal entries automatically
- **Reports & Analytics** - Comprehensive reporting and analytics for lease portfolio management
- **Dashboard** - Interactive visualizations and portfolio insights
- **IFRS 16 Methodology** - Comprehensive methodology guide covering assumptions and best practices
- **Learn IFRS 16** - Self-paced e-learning platform with interactive quizzes
- **IBMR Calculator** - Calculate Incremental Borrowing Rate with precision

### Key Features

- **Role-Based Access Control (RBAC)** - Three-tier access system (User, Approver, Admin)
- **Multi-Step Approval Workflow** - Draft → Pending → Under Review → Approved/Rejected
- **Dark Mode Support** - Full theme customization
- **Supabase Authentication** - Secure user authentication and authorization
- **Real-time Updates** - Live data synchronization
- **Responsive Design** - Mobile-friendly interface

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend
- **Node.js** with Express
- **TypeScript** - Type-safe backend
- **Supabase** - PostgreSQL database with authentication
- **JWT** - Token-based authentication

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ifrs-16-engine.git
cd ifrs-16-engine
```

### 2. Set Up Environment Variables

#### Frontend Configuration

Create `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
# Backend API URL (used by frontend)
VITE_API_URL=http://localhost:3001/api

# Supabase Configuration (for frontend auth)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Backend Configuration

Create `.env` in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your Supabase credentials:

```env
PORT=3001
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=development
```

### 3. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 4. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration script: `backend/database-migrations-supabase-auth.sql`
4. Run the role update script: `fix-user-roles-corrected.sql`

### 5. Run the Application

#### Development Mode

Open two terminal windows:

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend will run on http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

#### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
```

## Project Structure

```
ifrs-16-engine/
├── src/
│   ├── api/              # API client services
│   ├── components/       # React components
│   │   ├── Auth/        # Authentication components
│   │   ├── Calculations/ # Calculation components
│   │   ├── Contract/    # Contract management components
│   │   └── Layout/      # Layout components
│   ├── context/         # React context providers
│   ├── data/            # Static data and content
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library configurations
│   ├── pages/           # Page components
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── backend/
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   └── types/       # TypeScript types
│   └── database-migrations-supabase-auth.sql
├── public/              # Static assets
└── docs/               # Documentation files
    ├── ROLE-BASED-ACCESS-CONTROL.md
    ├── APPROVAL_WORKFLOW_IMPLEMENTATION.md
    ├── SUPABASE-SETUP.md
    └── QUICK_START_CHECKLIST.md
```

## User Roles & Permissions

### User (Default Role)
- Create and edit draft contracts
- Submit contracts for approval
- View own contracts
- Access all educational modules

### Approver
- All User permissions
- View contracts pending approval
- Review and approve/reject contracts
- Add review comments

### Admin
- All Approver permissions
- Manage user roles
- Access admin dashboard
- View all system data

## Documentation

- [RBAC Documentation](ROLE-BASED-ACCESS-CONTROL.md) - Detailed role-based access control guide
- [Approval Workflow](APPROVAL_WORKFLOW_IMPLEMENTATION.md) - Contract approval process
- [Supabase Setup](SUPABASE-SETUP.md) - Database and authentication setup
- [Quick Start Checklist](QUICK_START_CHECKLIST.md) - Getting started guide

## Testing

### Create Test Users

After setting up Supabase, create test users with different roles:

```sql
-- Admin user
UPDATE user_profiles SET role = 'admin' 
WHERE email = 'admin@test.com';

-- Approver user
UPDATE user_profiles SET role = 'approver' 
WHERE email = 'approver@test.com';

-- Regular user (default)
-- No update needed - users are created with 'user' role by default
```

## API Endpoints

### Contracts
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts/:id` - Get contract by ID
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract

### Approval Actions
- `POST /api/contracts/:id/submit` - Submit contract for approval
- `POST /api/contracts/:id/approve` - Approve contract
- `POST /api/contracts/:id/reject` - Reject contract

### User Management
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile (Admin only)

## Security Features

- JWT-based authentication
- Row Level Security (RLS) policies in Supabase
- Role-based access control
- Secure credential management with .env files
- Input validation and sanitization
- CORS protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the inline code comments

## Acknowledgments

- IFRS Foundation for accounting standards
- Supabase for backend infrastructure
- React and TypeScript communities

---

**Note:** This application is designed for educational and professional use. Ensure compliance with your organization's accounting policies and consult with qualified accountants for production use.
