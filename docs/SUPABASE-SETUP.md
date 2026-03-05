# Supabase Setup Guide for IFRS 16 Lease Engine

## Step 1: Create a Supabase Project

1. **Go to Supabase**: https://supabase.com
2. **Sign up** or **Log in** with GitHub, Google, or email
3. **Create a new project**:
   - Click "New Project"
   - Choose your organization (or create one)
   - Enter project details:
     - **Name**: `ifrs-16-engine` (or any name you prefer)
     - **Database Password**: Create a strong password (save it!)
     - **Region**: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

## Step 2: Create the Database Table

1. **Open SQL Editor**:
   - In your Supabase dashboard, click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Copy and paste** the entire contents of [`backend/supabase-setup.sql`](backend/supabase-setup.sql)

3. **Run the SQL**:
   - Click "Run" or press `Ctrl + Enter`
   - You should see "Success. No rows returned"

## Step 3: Get Your API Credentials

1. **Go to Settings**:
   - Click the gear icon (⚙️) in the left sidebar
   - Click "API" under "Project Settings"

2. **Copy your credentials**:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **service_role key** (NOT anon key): Click "Reveal" next to "service_role", then copy

   ⚠️ **Important**: Use the `service_role` key, NOT the `anon` key. The service_role key bypasses RLS for backend operations.

## Step 4: Configure Backend Environment

1. **Edit** [`backend/.env`](backend/.env)

2. **Replace** the placeholder values:
   ```env
   PORT=3001
   SUPABASE_URL=https://your-actual-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
   NODE_ENV=development
   ```

3. **Save** the file

## Step 5: Test the Backend

1. **Start the backend**:
   ```bash
   npm run dev:backend
   ```

2. **Check for success**:
   - You should see: `✅ Database connection successful`
   - Server should be running on: `http://localhost:3001`

3. **Test the API**:
   ```bash
   # In a new terminal, test the health endpoint
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","message":"IFRS 16 Backend API is running"}`

## Step 6: Start Both Frontend and Backend

```bash
npm run dev:all
```

This runs:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you updated `backend/.env` with your actual credentials
- Check that variable names match exactly: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### "relation 'contracts' does not exist"
- Run the SQL from `backend/supabase-setup.sql` in Supabase SQL Editor
- Make sure you clicked "Run" and saw success message

### "Invalid API key"
- Make sure you're using the `service_role` key, NOT the `anon` key
- Check for any extra spaces when copying the key

### Backend won't start
- Check Node.js version (you're on v16, which shows warnings but should still work)
- Try: `cd backend && npm install` to reinstall dependencies

## Next Steps

Once everything is running:
1. Any contracts you create will be saved to Supabase
2. You can view your data in Supabase dashboard under "Table Editor"
3. The backend will automatically sync with the database
4. Frontend will load contracts from the API

## Free Tier Limits

Supabase free tier includes:
- 500MB database storage
- 2GB bandwidth per month
- 50,000 monthly active users
- Unlimited API requests

This is more than enough for development and small-scale production use!

## Switching to Local PostgreSQL Later

If you want to switch to local PostgreSQL later, you only need to:
1. Install PostgreSQL
2. Change `backend/.env` to use local connection string
3. Run the same SQL to create tables

The backend code works with both Supabase and local PostgreSQL - zero code changes needed!
