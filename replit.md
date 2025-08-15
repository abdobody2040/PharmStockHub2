# Pharmaceutical Promotional Materials Management Platform

## Overview
A comprehensive pharmaceutical promotional materials management platform designed to streamline inventory tracking, access control, and reporting for pharmaceutical promotional materials. Its main purpose is to empower field representatives and administrators with tools for efficient stock management, allocation, and multi-format report generation, enhancing operational efficiency and compliance within the pharmaceutical industry.

## User Preferences
- Prioritize visual elements and user-friendly interfaces
- Database persistence required for all data
- Admin-controlled user registration model
- Role-based specialty filtering essential
- Professional pharmaceutical industry standards

## System Architecture
The platform is built with a React, TypeScript, and Vite frontend, utilizing Wouter for routing, Tailwind CSS for styling, and Radix UI components for a modern UI/UX. The backend is powered by Node.js and Express, written in TypeScript. PostgreSQL is the chosen database, managed with Drizzle ORM and hosted on Neon Database. Authentication is handled by Passport.js with a local strategy, and data validation is robustly managed with Zod and React Hook Form.

Key architectural decisions include:
- **Role-Based Access Control (RBAC):** Six distinct roles (CEO, Marketers, Sales Managers, Stock Managers, Admins, Medical Reps) with granular permissions control access to features and data, including specialty-based inventory filtering (CNS, Primary Care 1 & 2, GIT, Specialty, OTC).
- **Comprehensive Stock Management:** Features include stock item management with expiry tracking, movement tracking, and allocation management. Items are associated with specialties for filtered views.
- **Advanced Reporting:** Multi-format report generation capabilities (PDF, Excel, CSV) are implemented, with analytics dashboards showing stock health, low stock alerts, and expiring items.
- **Request Management Workflows:** A robust system supports three distinct request workflows (`prepare_order`, `inventory_share`, `receive_inventory`) with multi-stage approval, file uploads, and atomic department transfers.
- **Dual Inventory Access System:** `/api/my-allocated-inventory` shows items allocated to specific users, while `/api/my-specialty-inventory` shows all items matching a user's specialty, ensuring role-appropriate data visibility.
- **Mobile-First Responsive Design:** The UI is designed to be fully responsive across various devices, with adaptive layouts, typography scaling, and optimized spacing.
- **Admin-Controlled User Registration:** User accounts are created and managed exclusively by administrators.

## External Dependencies
- **Database:** PostgreSQL (via Drizzle ORM), Neon Database
- **UI Libraries:** Radix UI, Lucide React
- **Charting Libraries:** Chart.js, Recharts
- **Authentication:** Passport.js