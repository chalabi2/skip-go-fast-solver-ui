# Skip Go Fast Solver Dashboard

A real-time dashboard for monitoring the Skip Go Fast Solver's performance, balances, and profitability metrics.

## Features

- Real-time order tracking
- Chain-specific USDC balances
- Profitability metrics
- Success rate monitoring
- Average latency tracking

## Prerequisites

- Node.js 16+
- Skip Go Fast Solver running with Prometheus metrics enabled
- Access to chain RPC endpoints

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your RPC endpoints (optional, defaults provided)

3. Start the development server:

```bash
npm run dev
```

The dashboard will be available at http://localhost:3000

## Configuration

The dashboard connects to:

- Prometheus metrics at http://localhost:8001
- Various chain RPC endpoints for balance checking

## Building for Production

```bash
npm run build
```

This will create a production build in the `dist` directory.

## Architecture

The dashboard is built with:

- React + TypeScript
- Vite for building
- ethers.js for blockchain interaction
- Tailwind CSS for styling

It queries both Prometheus metrics and on-chain data to provide a comprehensive view of the solver's operation.
