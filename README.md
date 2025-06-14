
# Inventory Management System

A full-stack inventory management system built with React, Express, and PostgreSQL.

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- shadcn/ui components
- React Query for data fetching
- Chart.js for analytics
- Zod for form validation
- React Hook Form
- Wouter for routing

### Backend
- Express.js with TypeScript
- PostgreSQL (Replit Database or external)
- Drizzle ORM
- Passport authentication
- Multer for file uploads
- Real-time updates

### Development Tools
- TypeScript
- ESBuild
- Prettier
- ESLint

## Features

- User Authentication & Authorization
- Role-based Access Control
- Inventory Management
- Stock Movement Tracking
- Barcode/QR Code Scanning
- Analytics Dashboard
- Report Generation
- Mobile-responsive Design
- Real-time Updates
- File Upload Support

## Prerequisites

- Node.js 18+ 
- NPM or Yarn
- PostgreSQL Database

## Environment Variables

Create the following environment variables in your Replit Secrets:

```env
DATABASE_URL=your_postgresql_database_url
SESSION_SECRET=your_session_secret
```

## Installation & Setup

1. Fork this Repl to your account

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at your Repl's URL.

## Database Migrations

This project uses Drizzle Kit for managing database schema migrations.

The typical workflow for making schema changes is as follows:

1.  **Modify Schema:** Make your desired changes to the schema definition in `shared/schema.ts`.
2.  **Generate Migrations:** Run the following command to generate SQL migration files based on your schema changes. These files will be placed in the `./drizzle` directory.
    ```bash
    npm run db:generate
    ```
    This script executes `drizzle-kit generate pg --schema shared/schema.ts --out ./drizzle`.
3.  **Review Migrations:** Before applying, it's crucial to review the generated SQL migration files in the `./drizzle` directory to ensure they accurately reflect your intended changes and to understand potential impacts.
4.  **Apply Migrations:** Once you've reviewed and are satisfied with the generated SQL, apply the migrations to your database by running:
    ```bash
    npm run db:migrate
    ```
    This script executes `drizzle-kit migrate pg`. This command will apply any pending migration files to the database. It relies on the same `drizzle.config.ts` used by other `drizzle-kit` commands, which should already be configured with your database connection details.

### Alternative for Development: `db:push`

For simpler development scenarios, you can use the `npm run db:push` script, which executes `drizzle-kit push`. This command attempts to directly synchronize your database schema with the definitions in `shared/schema.ts` without creating explicit migration files.

**Caution:** `npm run db:push` can be destructive as it may lead to data loss if not used carefully (e.g., when dropping tables or columns). While convenient for rapid iteration during development, the `db:generate` and `db:migrate` workflow is strongly recommended for managing schema changes in staging and production environments to ensure safety and control.

## Deployment

1.  In your Repl, go to the "Deployment" tab

2. Click "Deploy" to create a new deployment

3. Your app will be available at your deployment URL

The deployment will automatically:
- Build the frontend assets
- Compile TypeScript files
- Start the production server

## Development Workflow

1. Development Mode:
```bash
npm run dev
```

2. Build for Production:
```bash
npm run build
```

3. Start Production Server:
```bash
npm start
```

## Project Structure

```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Page components
│   │   └── lib/        # Utility functions
├── server/           # Backend Express application
│   ├── routes.ts    # API routes
│   ├── auth.ts      # Authentication logic
│   └── db.ts        # Database configuration
└── shared/          # Shared types and utilities
```

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/user

### Inventory
- GET /api/stock-items
- POST /api/stock-items
- PUT /api/stock-items/:id
- DELETE /api/stock-items/:id

### Stock Movements
- GET /api/stock-movements
- POST /api/stock-movements
- GET /api/stock-movements/:id

### Categories
- GET /api/categories
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id

## Security

- JWT-based authentication
- Password hashing
- Role-based access control
- Input validation
- File upload restrictions
- SQL injection protection

## Contributing

1. Fork the Repl
2. Create your feature branch
3. Commit your changes
4. Push to your fork
5. Create a Pull Request

## License

This project is licensed under the MIT License.
