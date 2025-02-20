# Skip Go Fast Backend

Backend service for the Skip Go Fast UI, providing data aggregation and API endpoints for solver metrics.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- PostgreSQL 12+
- Moralis API key
- RPC endpoints for supported chains

## Setup

1. Install dependencies:

```bash
bun install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/skip_go_fast_db?schema=public"

# Server
PORT=3000

# Moralis API Key for blockchain data
MORALIS_API_KEY=your_api_key

# Solver configuration
SOLVER_ADDRESS=your_solver_address

# RPC URLs for supported chains
ETH_RPC_URL=
AVALANCHE_RPC_URL=
OPTIMISM_RPC_URL=
ARBITRUM_RPC_URL=
BASE_RPC_URL=
POLYGON_RPC_URL=

# Etherscan API Key
ETHERSCAN_API_KEY=
SNOWTRACE_API_KEY=
OPTIMISM_API_KEY=
ARBISCAN_API_KEY=
BASESCAN_API_KEY=
POLYGONSCAN_API_KEY=

# API Key for private frontend connection
API_KEY=
```

> We utilize the Moralis API to fetch price data and etherscan api's to fetch native token deposit history. You can sign up for all accounts for free and they provide a generous limit. We also use a private API key to establish a secure connection between the frontend and backend. This can be generated with `openssl rand -base64 32`

3. Set up the database:

```bash
# Create the database
createdb skip_go_fast_db

# Run migrations
bun migrate

# Generate Prisma client
bun generate
```

### Moralis API Key

You can get a Moralis API key [here](https://moralis.io/api-key-for-moralis-dapps/).

## Available Scripts

- `bun dev` - Start development server with hot reload
- `bun build` - Build TypeScript files
- `bun start` - Start production server
- `bun migrate` - Run Prisma migrations
- `bun generate` - Generate Prisma client
- `bun delete` - Reset database and regenerate schema
- `bun remove` - Clean up node_modules and cache
- `bun update-deps` - Check for dependency updates

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: ethers.js, Moralis
- **Scheduling**: node-cron
- **Logging**: Winston
- **Development**: TypeScript, ts-node-dev

## API Endpoints

### Settlements

- `GET /api/settlements` - Get settlement data

### Chain Status

- `GET /api/sync-status` - Get current sync status for all chains
- `GET /api/gas-info` - Get gas info for all chains

## Architecture

The service follows these key principles:

1. **Data Safety**:

   - Database transactions for atomic operations
   - Retry mechanisms for failed operations
   - Data validation before storage
   - Prisma schema migrations

2. **Performance**:

   - Batch processing of blockchain events
   - Optimized database queries with proper indexing
   - Rate limiting for RPC calls
   - Connection pooling for database

3. **Monitoring**:
   - Winston logging with levels (error.log, combined.log)
   - Chain sync status tracking
   - RPC health monitoring

## Project Structure

```
src/
  ├── services/     # Business logic
  ├── utils/        # Helper functions
  ├── types/        # TypeScript types
  └── index.ts      # API routes
prisma/
  ├── schema.prisma # Database schema
  └── migrations/   # Database migrations
```

## Logging

Logs are stored in:

- `error.log` - Error level logs
- `combined.log` - All logs (info, warn, error)

Configure log level in `.env` with `LOG_LEVEL` (default: info)
