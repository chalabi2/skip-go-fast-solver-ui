# Skip Go Fast Frontend

Vite React frontend for the Skip Go Fast UI

## Prerequisites

- [Bun](https://bun.sh/) runtime
- Firebase project credentials
- Backend service running (for data fetching)

## Setup

1. Install dependencies:

```bash
bun install
```

2. Configure environment variables:

Create a `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

3. Start the development server:

```bash
bun dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Create production build
- `bun lint` - Run ESLint
- `bun format` - Format code with Prettier
- `bun preview` - Preview production build locally
- `bun remove` - Clean up node_modules and cache
- `bun update-deps` - Check for dependency updates

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with HeadlessUI components
- **State Management**: React Query
- **Data Grid**: AG Grid Community
- **Charts**: Recharts
- **Authentication**: Firebase
- **Icons**: Remix Icons

## Project Structure

```
src/
  ├── components/     # React components
  ├── constants/      # Constants
  ├── contexts/       # Auth context
  ├── hooks/          # Custom React hooks
  ├── pages/          # React pages
  ├── styles/         # Tailwind styles
  ├── types/          # TypeScript types
  ├── utils/          # Utility functions
  ├── App.tsx         # Main App component
  ├── env.d.ts        # Environment variable types
  ├── index.css       # Global styles
  ├── main.tsx        # ReactDOM entry point
  └── types.ts      # TypeScript types
```

## Building for Production

```bash
bun run build
```
