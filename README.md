
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
- PostgreSQL (Neon Database)
- Drizzle ORM
- JWT authentication
- Multer for file uploads
- WebSocket for real-time updates

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
- PostgreSQL Database (Neon)

## Environment Variables

Create the following environment variables in your Replit Secrets:

```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_jwt_secret
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

## Deployment

1. In your Repl, go to the "Deployment" tab

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
