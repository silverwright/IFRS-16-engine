# IFRS 16 Lease Engine - Backend API

Backend API server for the IFRS 16 Lease Engine application.

## Tech Stack

- **Node.js** with **Express** - REST API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Database for contract storage
- **pg** - PostgreSQL client for Node.js

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)

## PostgreSQL Setup

### Windows

1. **Download PostgreSQL**:
   - Visit https://www.postgresql.org/download/windows/
   - Download and run the installer
   - During installation, remember the password you set for the `postgres` user

2. **Verify Installation**:
   ```bash
   psql --version
   ```

3. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create the database
   CREATE DATABASE ifrs16_db;

   # Exit psql
   \q
   ```

### macOS

1. **Install via Homebrew**:
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Create Database**:
   ```bash
   createdb ifrs16_db
   ```

### Linux

1. **Install PostgreSQL**:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create Database**:
   ```bash
   sudo -u postgres createdb ifrs16_db
   ```

## Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Copy `.env.example` to `.env` and update with your PostgreSQL credentials:
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```
   PORT=3001
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ifrs16_db
   NODE_ENV=development
   ```

   Replace:
   - `your_password` with your PostgreSQL password
   - `localhost` with your database host (if different)
   - `5432` with your PostgreSQL port (if different)

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on http://localhost:3001

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start the production server
npm start
```

## Database Schema

The application automatically creates the following table on first run:

### `contracts` table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| contract_id | VARCHAR(255) | Unique contract identifier |
| lessee_name | VARCHAR(255) | Name of the lessee |
| asset_description | TEXT | Description of the leased asset |
| commencement_date | DATE | Lease commencement date |
| mode | VARCHAR(50) | Contract mode (MINIMAL or FULL) |
| status | VARCHAR(50) | Contract status (pending or approved) |
| data | JSONB | Complete lease data as JSON |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

Indexes:
- `idx_contract_id` on `contract_id` for faster lookups
- `idx_status` on `status` for filtering

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Contracts
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts/:id` - Get single contract by ID
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts/:id` - Update existing contract
- `DELETE /api/contracts/:id` - Delete contract
- `POST /api/contracts/bulk` - Bulk import contracts (for migration)

## Troubleshooting

### Port already in use

If you see "Port 3001 is already in use":

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Database connection errors

1. **Verify PostgreSQL is running**:
   ```bash
   # Windows
   pg_ctl status

   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. **Check your DATABASE_URL** in `.env` file

3. **Test connection manually**:
   ```bash
   psql postgresql://postgres:password@localhost:5432/ifrs16_db
   ```

### TypeScript errors

Make sure TypeScript is properly installed:
```bash
npm install -g typescript
npm install
```

## Migration from localStorage

The backend includes a bulk import endpoint (`POST /api/contracts/bulk`) for migrating existing contracts from localStorage. The frontend automatically handles this migration.

## Development

### Project Structure

```
backend/
├── src/
│   ├── db.ts              # Database connection and initialization
│   ├── server.ts          # Express server setup
│   ├── types.ts           # TypeScript type definitions
│   └── routes/
│       └── contracts.ts   # Contract CRUD endpoints
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment variables
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### Adding New Features

1. Define types in `src/types.ts`
2. Create routes in `src/routes/`
3. Import and use routes in `src/server.ts`

## Support

For issues or questions, please check the main project README or create an issue on the repository.
