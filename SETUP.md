
# Project Setup Guide

## Prerequisites
- Node.js 18+
- NPM or Yarn
- PostgreSQL Database

## Environment Variables
Create these variables in Replit Secrets:

```env
DATABASE_URL=postgresql://user:password@host:port/dbname
SESSION_SECRET=your-secure-session-secret
```

## Database Schema
The database schema is managed through Drizzle ORM. Key tables:

- Users
- Categories
- StockItems 
- StockMovements
- StockAllocations

## Setup Steps

1. Fork the Repl

2. Set Environment Variables
   - Go to "Secrets" tool
   - Add required environment variables

3. Install Dependencies
   ```bash
   npm install
   ```

4. Initialize Database
   ```bash
   npm run db:push
   ```

5. Start Development Server
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Update database schema

## Deployment
1. Go to "Deployment" tab in Replit
2. Click "Deploy" to publish changes
3. Access your app at the deployment URL
