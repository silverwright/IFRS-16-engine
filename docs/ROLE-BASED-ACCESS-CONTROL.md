# Role-Based Access Control Implementation Guide

## Overview
This document describes the role-based access control (RBAC) system implemented for the IFRS 16 Lease Engine application.

## Access Control Structure

### User Roles

#### 1. **User** (`role: 'user'`)
- **Contract Access**: Can only view and edit their own contracts
- **Create**: Can create new contracts (auto-assigned as creator)
- **Read**: Can only see contracts they created
- **Update**: Can only update their own contracts
- **Delete**: Can only delete their own **draft** contracts
- **Approvals**: Cannot access the approval dashboard
- **Reports/Dashboard**: Can only see data from their own contracts

#### 2. **Approver** (`role: 'approver'`)
- **Contract Access**: Can view ALL contracts (read-only for others' contracts)
- **Create**: Can create their own contracts
- **Read**: Can see all contracts in the system
- **Update**: Can only update their own contracts
- **Delete**: Can only delete their own draft contracts
- **Approvals**: Full access to approval dashboard
  - Can start review on pending contracts
  - Can approve/reject contracts under review
- **Reports/Dashboard**: Can see all contract data

#### 3. **Admin** (`role: 'admin'`)
- **Contract Access**: Full access to ALL contracts
- **Create**: Can create contracts
- **Read**: Can see all contracts
- **Update**: Can update ANY contract
- **Delete**: Can delete ANY contract (regardless of status)
- **Approvals**: Full access to approval dashboard
- **Reports/Dashboard**: Can see all data

## Implementation Components

### 1. Database Layer - Row-Level Security (RLS)

**File**: `contracts-rls-policies.sql`

Implements PostgreSQL Row-Level Security policies on the `contracts` table:

```sql
-- Users can only read their own contracts
-- Approvers can read all contracts
-- Admins can read all contracts

-- Apply same logic for INSERT, UPDATE, DELETE
```

**To Apply**:
```bash
psql -h your-supabase-host -U postgres -d postgres -f contracts-rls-policies.sql
```

### 2. Backend Layer - API Authentication & Authorization

#### Authentication Middleware
**File**: `backend/src/middleware/auth.ts`

**Functions**:
- `authenticateUser`: Verifies JWT token from Supabase
- `requireRole(...roles)`: Restricts endpoints to specific roles
- `optionalAuth`: For public/hybrid endpoints

**Usage**:
```typescript
// All routes require authentication
router.use(authenticateUser);

// Specific endpoint restricted to approvers and admins
router.patch('/:id/approve', requireRole('approver', 'admin'), async (req, res) => {
  // Handler code
});
```

#### Contracts Route Protection
**File**: `backend/src/routes/contracts.ts`

**Key Changes**:
- All routes now require authentication
- GET endpoints filter results by user role
- UPDATE/DELETE endpoints check ownership
- Approval endpoints restricted to approvers/admins

**Examples**:
```typescript
// GET all contracts - filtered by role
if (userRole === 'user') {
  query = query.eq('created_by', userId);
}

// UPDATE - ownership check
if (userRole !== 'admin' && existing.created_by !== userId) {
  return res.status(403).json({ error: 'Permission denied' });
}
```

### 3. Frontend Layer - API Client Updates

**File**: `src/api/contractsApi.ts`

**Key Changes**:
- Added `getAuthHeaders()` helper function
- Fetches current user's session token from Supabase
- Includes `Authorization: Bearer <token>` header in all API requests

**Implementation**:
```typescript
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}
```

### 4. Frontend Layer - Route & UI Protection

#### Route Protection
**File**: `src/App.tsx`

**Changes**:
- Approval Dashboard restricted to approvers and admins

```typescript
<Route
  path="/approvals"
  element={
    <ProtectedRoute requiredRoles={['approver', 'admin']}>
      <ApprovalDashboard />
    </ProtectedRoute>
  }
/>
```

#### Navigation Visibility
**File**: `src/components/Layout/Header.tsx`

**Changes**:
- Navigation items can specify `requiredRoles`
- Items are filtered based on current user's role
- "Approvals" link only visible to approvers and admins

```typescript
const navigation = [
  { name: "Approvals", href: "/approvals", requiredRoles: ['approver', 'admin'] },
  // ...
];

// Filter navigation based on user role
navigation.filter((item) => {
  if ('requiredRoles' in item && item.requiredRoles) {
    return userProfile?.role && item.requiredRoles.includes(userProfile.role);
  }
  return true;
})
```

## Testing the Implementation

### Step 1: Apply Database Policies

```bash
# Connect to your Supabase database
psql -h <your-supabase-host> -U postgres -d postgres

# Run the RLS policies file
\i contracts-rls-policies.sql

# Verify policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'contracts';
```

### Step 2: Create Test Users

Create test users with different roles in your Supabase dashboard or via SQL:

```sql
-- After creating users via Supabase Auth, update their profiles
UPDATE user_profiles SET role = 'user' WHERE email = 'user@test.com';
UPDATE user_profiles SET role = 'approver' WHERE email = 'approver@test.com';
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@test.com';
```

### Step 3: Test Access Control

#### As Regular User:
1. ✅ Can create contracts
2. ✅ Can see only their own contracts
3. ✅ Can edit only their own contracts
4. ✅ Can delete only their own draft contracts
5. ❌ Cannot see "Approvals" in navigation
6. ❌ Cannot access `/approvals` route
7. ❌ Cannot see other users' contracts

#### As Approver:
1. ✅ Can create contracts
2. ✅ Can see ALL contracts
3. ✅ Can edit only their own contracts
4. ✅ Can see "Approvals" in navigation
5. ✅ Can access approval dashboard
6. ✅ Can approve/reject contracts
7. ❌ Cannot edit other users' contracts

#### As Admin:
1. ✅ Can create contracts
2. ✅ Can see ALL contracts
3. ✅ Can edit ANY contract
4. ✅ Can delete ANY contract
5. ✅ Full access to approvals
6. ✅ Full access to all features

### Step 4: Verify Backend API

Test API endpoints with different user tokens:

```bash
# Get user token from browser developer tools or Supabase
TOKEN="your-jwt-token-here"

# Test GET contracts (should filter by role)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/contracts

# Test unauthorized access
curl -H "Authorization: Bearer $USER_TOKEN" \
  -X PATCH \
  http://localhost:3001/api/contracts/{id}/approve
# Should return 403 Forbidden for regular users
```

## Security Considerations

### Defense in Depth
This implementation provides multiple layers of security:

1. **Database Layer (RLS)**: PostgreSQL enforces access at the database level
2. **API Layer**: Express middleware verifies tokens and checks permissions
3. **Frontend Layer**: UI hides unauthorized features (UX only, not security)

### Important Notes

- ⚠️ **Frontend filtering is NOT a security measure** - it only improves UX
- ✅ **Always enforce security at the backend** - never trust the frontend
- ✅ **RLS provides database-level protection** - even if backend is compromised
- ✅ **Use HTTPS in production** - to protect JWT tokens in transit
- ✅ **Tokens expire** - Supabase handles automatic token refresh

## Troubleshooting

### Issue: "Failed to fetch contracts" (401 Unauthorized)

**Cause**: Authentication token not being sent or is invalid

**Solution**:
1. Check that user is logged in
2. Verify token in browser dev tools (Application > Local Storage)
3. Check that `getAuthHeaders()` is being called
4. Verify Supabase environment variables are set

### Issue: "You do not have permission" (403 Forbidden)

**Cause**: User lacks required role for the action

**Solution**:
1. Verify user's role in `user_profiles` table
2. Check that role matches required roles for the endpoint
3. For approval endpoints, user must be 'approver' or 'admin'

### Issue: Can't see other users' contracts as approver

**Cause**: Role not set correctly or RLS policies not applied

**Solution**:
1. Verify role in database: `SELECT * FROM user_profiles WHERE id = 'user-id';`
2. Ensure RLS policies are applied: `SELECT * FROM pg_policies WHERE tablename = 'contracts';`
3. Check backend filtering logic in `backend/src/routes/contracts.ts`

### Issue: Approvals link not showing for approver

**Cause**: Frontend role filtering not working

**Solution**:
1. Check `userProfile?.role` in browser dev tools
2. Verify Header.tsx filtering logic
3. Ensure AuthContext is providing userProfile correctly

## Future Enhancements

### Recommended Additions:

1. **Audit Logging**: Log all access attempts and permission denials
2. **Role Assignment UI**: Admin interface to assign/change user roles
3. **Department-Based Access**: Filter by department in addition to role
4. **Temporary Permissions**: Time-limited access grants
5. **Approval Workflows**: Multi-level approval chains
6. **Activity Monitoring**: Track who viewed/edited which contracts

## Related Files

### Backend
- `backend/src/middleware/auth.ts` - Authentication middleware
- `backend/src/routes/contracts.ts` - Protected contract routes
- `contracts-rls-policies.sql` - Database RLS policies

### Frontend
- `src/api/contractsApi.ts` - API client with auth headers
- `src/App.tsx` - Route-level protection
- `src/components/Layout/Header.tsx` - Navigation filtering
- `src/components/Auth/ProtectedRoute.tsx` - Route guard component

### Database
- `user_profiles` table - Stores user roles
- `contracts` table - Has RLS policies applied
- `approval_history` table - Tracks approval actions

## Summary

The role-based access control system is now fully implemented across all layers:
- ✅ Database-level security with RLS policies
- ✅ Backend API authentication and authorization
- ✅ Frontend token management and UI filtering
- ✅ Role-specific route protection

This provides a secure, scalable foundation for multi-user lease contract management with proper separation of duties and audit trails.
