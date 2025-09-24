# ScrapeFlow - Instagram Scraping Platform

## Overview

ScrapeFlow is a professional Instagram data collection platform that leverages the Apify API for web scraping. The application allows users to perform hashtag-based Instagram scraping through a credit-based system, providing data export capabilities and subscription management. Built as a full-stack TypeScript application with a modern React frontend and Express.js backend, it features comprehensive user authentication, payment processing via Stripe, and real-time campaign monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Authentication Flow**: Session-based authentication with automatic redirects and error handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: OpenID Connect (OIDC) integration with Replit authentication system using Passport.js
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with consistent error handling and request logging middleware

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Core Tables**:
  - Users: Profile information, credits, Stripe integration data
  - Campaigns: Scraping job tracking with status and progress
  - Credit Transactions: Audit trail for credit usage and purchases
  - Sessions: Secure session storage for authentication

### Payment Integration
- **Payment Processor**: Stripe with subscription and one-time payment support
- **Subscription Model**: Credit-based system (50 credits for €5/month)
- **Frontend Integration**: Stripe Elements for secure payment collection
- **Webhook Support**: Real-time payment status updates and subscription management

### Web Scraping Integration
- **Service Provider**: Apify Client for Instagram hashtag scraping
- **Data Processing**: Automated result collection and Excel export generation
- **Campaign Management**: Asynchronous job processing with status tracking
- **Export Functionality**: ExcelJS for structured data export with styling

### Development and Deployment
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development Tools**: Hot module replacement, runtime error overlays, TypeScript checking
- **Environment Configuration**: Environment variable management for API keys and database connections
- **Asset Management**: Static file serving with proper MIME type handling

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **Authentication**: Replit OIDC provider for user authentication and authorization
- **Payment Processing**: Stripe API for subscription management and payment collection

### Third-Party APIs
- **Web Scraping**: Apify Instagram Hashtag Scraper actor for data collection
- **Font Resources**: Google Fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Development Platform
- **Runtime Environment**: Replit with cartographer and dev banner plugins for development experience
- **Session Storage**: PostgreSQL-backed session management with connect-pg-simple

### Key Libraries and Frameworks
- **UI Components**: Radix UI primitives for accessible component foundation
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Data Validation**: Zod for runtime type checking and schema validation
- **Utilities**: Class variance authority for component styling, clsx for conditional classes
- **Export Processing**: ExcelJS for spreadsheet generation with formatting capabilities