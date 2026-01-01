# GCMN Library Management System

## Overview

A full-stack library management system for Government College For Men Nazimabad (GCMN). The application provides book browsing and borrowing, library card applications, study notes distribution, rare book archives, contact messaging, and a comprehensive admin dashboard. Built with React frontend and Express backend, using PostgreSQL for data persistence.

## Recent Changes

### December 30, 2025
- **Rare Books Upload Fix**: Increased server timeout and request body size limits to 1GB to support large PDF uploads. Fixed multipart form handling for the `coverImage` field in the Rare Books module.
- **Security Enhancements**: Implemented an embedded PDF viewer for Rare Books with enhanced security headers and watermarking to prevent unauthorized downloads.
- **System Stability**: Standardized upload directory permissions and optimized server-side file streaming.

### December 29, 2025
- **Events Feature**: Implemented a complete Events module with backend CRUD operations, multi-image upload support, and a public-facing events page.
- **Rare Books Preview Fix**: Resolved issues with PDF rendering in the Rare Books collection by implementing a secure stream-based preview with enhanced security headers and an embedded viewer.
- **Layout Adjustments**: Fixed navbar occlusion issue on the Library Card page by adding responsive top padding.
- **Security Enhancements**: Strengthened Rare Books security by disabling common download/copy interactions (context menu, keyboard shortcuts, pointer events) and adding watermarks.
- **Upload Optimization**: Standardized upload directory structure and verified multi-part form data handling across all modules.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Routing**: React Router DOM v6 with animated page transitions (Framer Motion)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom Pakistan-themed design system (green color palette)
- **Theme Support**: next-themes for light/dark mode switching

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx
- **Session Management**: express-session with memorystore for development
- **File Uploads**: Multer for PDF uploads (notes, study materials)
- **Password Hashing**: bcryptjs for secure password storage

### Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables using Drizzle's PostgreSQL dialect
- **Fallback Storage**: JSON file storage in `.data/` directory for local development without database
- **Migrations**: Drizzle Kit for schema migrations (`npm run db:push`)

### Authentication System
- **Admin Login**: Email/password with secret key verification (hardcoded admin credentials)
- **Student Login**: Library card ID-based authentication (card must be approved)
- **Non-Student Login**: Email/password registration with role selection
- **Session Storage**: Server-side sessions with configurable SESSION_SECRET

### API Structure
All API routes are prefixed with `/api/` and include:
- `/api/auth/*` - Authentication endpoints (register, login, logout, session check)
- `/api/contact-messages` - Contact form submissions (CRUD)
- `/api/book-borrows` - Book borrowing records
- `/api/library-card-applications` - Library card applications and approvals
- `/api/donations` - Donation tracking
- `/api/notes` - Study notes with PDF uploads
- `/api/rare-books` - Rare book archive management
- `/api/users` - User management (students, non-students)

### Key Design Decisions

1. **Dual Storage Strategy**: The app supports both PostgreSQL (production) and JSON file storage (development fallback). The `server/json-storage.ts` provides a complete storage implementation that mirrors the database schema.

2. **Shared Schema**: Database schema is defined in `shared/schema.ts` using Drizzle ORM, making it accessible to both frontend (for type definitions) and backend (for database operations).

3. **Component Architecture**: UI components follow the shadcn/ui pattern - unstyled Radix primitives wrapped with Tailwind CSS classes, located in `src/components/ui/`.

4. **Admin Dashboard**: Comprehensive admin interface at `/admin-dashboard` with modular sub-pages for messages, library cards, borrowed books, donations, and user management.

5. **PDF Generation**: Client-side PDF generation using jsPDF for library cards and reports, with Excel export via xlsx library.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Third-Party Services
- **QR Code Generation**: External API at `api.qrserver.com` for library card QR codes
- **Google Fonts**: Inter font family loaded from Google Fonts CDN

### Key NPM Packages
- `@tanstack/react-query` - Server state management
- `framer-motion` - Page transitions and animations
- `jspdf` - PDF document generation
- `xlsx` - Excel file export
- `multer` - File upload handling
- `bcryptjs` - Password hashing
- `connect-pg-simple` - PostgreSQL session store (available for production)
- `memorystore` - In-memory session store for development

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required for database mode)
- `SESSION_SECRET` - Session encryption key (defaults to development value)