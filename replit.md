# WeatherScope - Climate Analytics Platform

## Overview

WeatherScope is a full-stack weather data analysis and prediction web application designed for academic and research purposes. The platform enables users to upload historical weather datasets (CSV format), perform statistical analysis, visualize climate trends, and generate AI-powered forecasts for temperature, rainfall, and humidity patterns.

The application includes:
- **Current Weather Widget**: Real-time weather data for any city using Open-Meteo API (no API key required)
- **Admin Panel**: For monitoring user registrations, tracking app usage, and managing platform analytics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state caching and synchronization
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Charts**: Recharts for data visualization (line, bar, area charts)
- **CSV Parsing**: PapaParse for client-side CSV file processing
- **Date Handling**: date-fns for formatting and manipulation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints with Zod schema validation
- **Session Management**: express-session with cookie-based authentication
- **Build**: esbuild for production bundling with dependency optimization

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Database Schema
Three main tables:
1. **weather_data**: Stores uploaded meteorological records (date, temperature, rainfall, humidity)
2. **app_users**: User registration tracking (name, email, status, timestamps)
3. **usage_logs**: Activity logging for analytics (user actions, access times, IP addresses)

### Project Structure
```
├── client/           # React frontend application
│   └── src/
│       ├── components/   # UI components (Shadcn + custom)
│       ├── pages/        # Route pages (Home, Upload, Analysis, etc.)
│       ├── hooks/        # Custom React hooks (use-weather, use-toast)
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle table definitions
│   └── routes.ts     # API contract types
└── migrations/       # Database migrations
```

### Authentication
- Admin authentication via session-based login
- Credentials configured through environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
- Session secret via SESSION_SECRET environment variable
- User registration stored in database for analytics tracking

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_USERNAME`: Admin panel login (default: "admin")
- `ADMIN_PASSWORD`: Admin panel password (default: "weatherscope2024")
- `SESSION_SECRET`: Express session encryption key

### Key NPM Packages
- **Frontend**: react, @tanstack/react-query, recharts, papaparse, wouter, date-fns
- **Backend**: express, express-session, drizzle-orm, zod, pg
- **UI**: @radix-ui components, tailwindcss, class-variance-authority
- **Build**: vite, esbuild, tsx

### Development Tools
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)
- TypeScript with strict mode enabled