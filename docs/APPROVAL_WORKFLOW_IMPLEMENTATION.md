# IFRS 16 Approval Workflow - Complete Implementation Guide

## Overview
This document outlines the complete implementation of a 5-status approval workflow with user authentication and role-based access control.

---

## Architecture Overview

### Workflow States
```
draft → pending → under_review → approved/rejected → (back to draft if rejected)
```

### User Roles
- **Creator**: Create and edit draft contracts, submit for approval
- **Approver**: Review and approve/reject contracts
- **Admin**: Full system access, user management

---

## Implementation Phases

### **PHASE 1: Backend Setup** (Days 1-3)

#### 1.1 Database Migration
- [x] Create database migration file (`database-migrations.sql`)
- [ ] Run migration in Supabase SQL Editor
- [ ] Verify tables created correctly
- [ ] Create default admin user with hashed password

#### 1.2 Install Dependencies
```bash
cd backend
npm install bcryptjs jsonwebtoken express-validator
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

#### 1.3 Create Backend Types
**File:** `backend/src/types.ts`
- User interface
- UserRole type
- ApprovalHistory interface
- Extended SavedContract interface
- JWT payload types

#### 1.4 Authentication Middleware
**File:** `backend/src/middleware/auth.ts`
- JWT token verification
- Role-based authorization middleware
- Password hashing utilities

#### 1.5 User Routes & Controllers
**File:** `backend/src/routes/users.ts`
- POST `/api/auth/register` - User registration (admin only)
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user
- GET `/api/users` - List users (admin only)
- PUT `/api/users/:id` - Update user (admin only)
- DELETE `/api/users/:id` - Delete user (admin only)

#### 1.6 Enhanced Contract Routes
**File:** `backend/src/routes/contracts.ts` (update existing)
- Add authentication middleware to all routes
- PATCH `/api/contracts/:id/submit` - Submit for approval
- PATCH `/api/contracts/:id/review` - Start review
- PATCH `/api/contracts/:id/approve` - Approve contract
- PATCH `/api/contracts/:id/reject` - Reject contract
- GET `/api/contracts/:id/history` - Get approval history
- POST `/api/contracts/bulk-approve` - Bulk approve

---

### **PHASE 2: Frontend Authentication** (Days 4-6)

#### 2.1 Install Frontend Dependencies
```bash
npm install axios jwt-decode
```

#### 2.2 Create Auth Context
**File:** `src/context/AuthContext.tsx`
- User state management
- Login/logout functions
- Token storage (localStorage)
- Protected route wrapper
- Role checking utilities

#### 2.3 Create Auth API Client
**File:** `src/api/authApi.ts`
- Login API call
- Register API call
- Logout API call
- Get current user
- Token refresh logic

#### 2.4 Create Auth Components
**Files:**
- `src/components/Auth/LoginForm.tsx` - Login page
- `src/components/Auth/RegisterForm.tsx` - Registration (admin only)
- `src/components/Auth/ProtectedRoute.tsx` - Route guard
- `src/components/Auth/UserMenu.tsx` - User dropdown menu

#### 2.5 Update App Routing
**File:** `src/App.tsx`
- Wrap app in AuthProvider
- Add protected routes
- Add login/register routes
- Redirect logic based on auth state

---

### **PHASE 3: Approval Workflow UI** (Days 7-10)

#### 3.1 Update TypeScript Interfaces
**File:** `src/context/LeaseContext.tsx`
- Update SavedContract status type: `'draft' | 'pending' | 'under_review' | 'approved' | 'rejected'`
- Add approval fields: approver info, dates, notes

#### 3.2 Create Status Badge Component
**File:** `src/components/Contract/StatusBadge.tsx`
- Color-coded status badges
- Icons for each status
- Tooltips with status info

#### 3.3 Enhanced Contract List
**File:** `src/components/Contract/ContractList.tsx` (update)
- Add status badges
- Add status filter dropdown
- Add "Submit for Approval" button
- Add role-based action buttons
- Show approver information

#### 3.4 Create Approval Dashboard
**File:** `src/pages/ApprovalDashboard.tsx` (new)
- List of pending/under_review contracts
- Filter by status, creator, date
- Quick view contract details
- Approve/Reject actions
- Bulk selection and approval
- Comments/notes section

#### 3.5 Create Contract Detail Modal
**File:** `src/components/Contract/ContractDetailModal.tsx`
- Full contract data display
- Approval timeline/history
- Approve/Reject form
- Comments section
- Document preview

#### 3.6 Create Approval History Component
**File:** `src/components/Contract/ApprovalHistory.tsx`
- Timeline view of all status changes
- User who made each change
- Timestamps
- Comments/notes for each action

---

### **PHASE 4: User Management** (Days 11-12)

#### 4.1 Create User Management Page
**File:** `src/pages/UserManagement.tsx` (admin only)
- List all users
- Add new user
- Edit user details
- Deactivate/activate users
- Assign roles

#### 4.2 Create User Components
**Files:**
- `src/components/Users/UserList.tsx` - User table
- `src/components/Users/UserForm.tsx` - Add/Edit user form
- `src/components/Users/RoleSelector.tsx` - Role dropdown

---

### **PHASE 5: Integration & Testing** (Days 13-14)

#### 5.1 Update Contract Initiation
**File:** `src/pages/ContractInitiation.tsx` (update)
- Save contracts as "draft" status
- Add "Submit for Approval" button
- Prevent editing of non-draft contracts
- Show current user as creator

#### 5.2 Update Calculations Page
**File:** `src/pages/LeaseCalculations.tsx` (update)
- Only show approved contracts
- Or show warning if contract not approved
- Prevent calculations on non-approved contracts

#### 5.3 Add Approval Workflow to Navigation
**File:** `src/components/Layout/Header.tsx` (update)
- Add "Approvals" menu item
- Show approval count badge
- Role-based menu visibility

---

## File Structure After Implementation

```
backend/
├── src/
│   ├── middleware/
│   │   └── auth.ts                    # NEW: Auth middleware
│   ├── routes/
│   │   ├── contracts.ts               # UPDATED: Add approval routes
│   │   └── users.ts                   # NEW: User management routes
│   ├── types.ts                       # UPDATED: Add User, ApprovalHistory types
│   ├── db.ts                          # Existing
│   └── server.ts                      # UPDATED: Add user routes
├── database-migrations.sql            # NEW: Database setup
└── package.json                       # UPDATED: New dependencies

frontend/
├── src/
│   ├── api/
│   │   ├── authApi.ts                 # NEW: Auth API calls
│   │   └── contractsApi.ts            # UPDATED: Add approval endpoints
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx          # NEW
│   │   │   ├── RegisterForm.tsx       # NEW
│   │   │   ├── ProtectedRoute.tsx     # NEW
│   │   │   └── UserMenu.tsx           # NEW
│   │   ├── Contract/
│   │   │   ├── StatusBadge.tsx        # NEW
│   │   │   ├── ContractList.tsx       # UPDATED
│   │   │   ├── ContractDetailModal.tsx # NEW
│   │   │   └── ApprovalHistory.tsx    # NEW
│   │   └── Users/
│   │       ├── UserList.tsx           # NEW
│   │       ├── UserForm.tsx           # NEW
│   │       └── RoleSelector.tsx       # NEW
│   ├── context/
│   │   ├── AuthContext.tsx            # NEW
│   │   └── LeaseContext.tsx           # UPDATED
│   ├── pages/
│   │   ├── Login.tsx                  # NEW
│   │   ├── ApprovalDashboard.tsx      # NEW
│   │   ├── UserManagement.tsx         # NEW
│   │   ├── ContractInitiation.tsx     # UPDATED
│   │   └── LeaseCalculations.tsx      # UPDATED
│   └── App.tsx                        # UPDATED: Add routes
└── package.json                       # UPDATED: New dependencies
```

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user (admin)
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Contracts (Protected)
- `GET /api/contracts` - List contracts (filter by status, creator)
- `GET /api/contracts/:id` - Get contract
- `POST /api/contracts` - Create contract (draft)
- `PUT /api/contracts/:id` - Update contract (draft only)
- `DELETE /api/contracts/:id` - Delete contract
- `PATCH /api/contracts/:id/submit` - Submit for approval
- `PATCH /api/contracts/:id/review` - Start review (approver)
- `PATCH /api/contracts/:id/approve` - Approve (approver)
- `PATCH /api/contracts/:id/reject` - Reject (approver)
- `GET /api/contracts/:id/history` - Approval history
- `POST /api/contracts/bulk-approve` - Bulk approve (approver)

---

## Workflow State Transitions

| From Status   | To Status     | Who Can Do It | Action                |
|---------------|---------------|---------------|-----------------------|
| draft         | pending       | Creator       | Submit for Approval   |
| pending       | under_review  | Approver      | Start Review          |
| under_review  | approved      | Approver      | Approve               |
| under_review  | rejected      | Approver      | Reject                |
| rejected      | draft         | Creator       | Revise & Resubmit     |
| approved      | -             | -             | (Read-only, final)    |

---

## Security Considerations

1. **Password Security**
   - Use bcrypt for password hashing (10+ rounds)
   - Enforce strong password policy
   - Never store plain text passwords

2. **JWT Tokens**
   - Use secure secret key (store in .env)
   - Set appropriate expiration (1-24 hours)
   - Implement refresh tokens for long sessions
   - Store tokens securely in httpOnly cookies or localStorage

3. **API Security**
   - All endpoints require authentication
   - Role-based authorization checks
   - Input validation on all endpoints
   - Rate limiting on auth endpoints

4. **Data Access**
   - Creators can only edit their own drafts
   - Approvers can view all, approve any
   - Admins have full access
   - Audit log all approval actions

---

## Testing Checklist

### Backend
- [ ] User registration works
- [ ] Login returns valid JWT
- [ ] Protected routes reject unauthenticated requests
- [ ] Role-based access control works
- [ ] Contract status transitions follow rules
- [ ] Approval history is logged correctly
- [ ] Bulk approval works

### Frontend
- [ ] Login/logout flow works
- [ ] Token persists across page refresh
- [ ] Protected routes redirect to login
- [ ] Role-based UI elements show/hide correctly
- [ ] Status badges display correctly
- [ ] Approval dashboard shows pending contracts
- [ ] Approve/reject actions work
- [ ] History timeline displays correctly

---

## Next Steps

1. **Run Database Migration**
   - Copy SQL from `database-migrations.sql`
   - Run in Supabase SQL Editor
   - Create default admin user with hashed password

2. **Start Backend Implementation**
   - Install dependencies
   - Create auth middleware
   - Create user routes
   - Update contract routes

3. **Start Frontend Implementation**
   - Install dependencies
   - Create AuthContext
   - Create login page
   - Create protected routes

Would you like me to start implementing any specific phase?
