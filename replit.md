# Pharmaceutical Promotional Materials Management Platform

## Overview
A comprehensive pharmaceutical promotional materials management platform designed to streamline inventory tracking, access control, and reporting for field representatives and administrators.

### Key Features
- Role-based access control (CEO, Marketers, Sales Managers, Stock Managers, Admins, Medical Reps)
- Specialty-based inventory filtering (CNS, Primary Care 1, Primary Care 2, GIT, Specialty, OTC)
- Stock item management with expiry tracking
- Movement tracking and allocation management
- Multi-format report generation (PDF, Excel, CSV)
- Admin-controlled user registration system

## Project Architecture

### Tech Stack
- **Frontend**: React 18.3.1, TypeScript 5.7.2, Vite 5.4.19, Tailwind CSS 3.4.17
- **Routing**: Wouter 3.3.6
- **Backend**: Node.js 20, Express 4.21.2, TypeScript 5.7.2
- **Database**: PostgreSQL 16, Drizzle ORM 0.39.1, Neon Database 0.10.4
- **UI Components**: Radix UI suite, Lucide React 0.468.0
- **Charts**: Chart.js 4.4.9, Recharts 2.15.2
- **Authentication**: Passport.js with local strategy
- **Data Validation**: Zod 3.24.2, React Hook Form 7.55.0

### Key Components
- **Authentication System**: Admin-only user creation, role-based permissions
- **Specialty Management**: Database-driven specialty categories with role filtering
- **Stock Management**: Items with specialty association, expiry tracking, movement history
- **User Management**: Six distinct roles with granular permissions
- **Reporting**: Multi-format export capabilities

## Recent Changes

### July 13, 2025 - Request Management UI/UX Improvements
- **Request Details Button**: Changed approve button (Check icon) to show request details instead of direct approval
- **Enhanced Request Details Modal**: Added comprehensive request details including requested items table with quantities and notes
- **Stock Item Integration**: Request details now show both stock items (from inventory) and custom items with proper item name resolution
- **File Upload Fix**: Fixed file upload to accept CSV and Excel files for requests
- **UI Alignment**: Improved "Expected Incoming Items" section layout with better grid spacing
- **Download Functionality**: Fixed file download URLs to use proper relative paths
- **Button Handlers**: Added missing approve/deny handlers across all request management tabs
- **Stock Movement Transaction**: Fixed stock movement system to properly update inventory quantities and create allocations

### July 2, 2025 - Enhanced Product Manager Inventory Access
- **Specialty-Based Inventory Display**: Product Managers now see all inventory items matching their specialty for ordering purposes
- **Sample Data Added**: Added Primary Care 1 specialty items to demonstrate complete inventory visibility
- **Comprehensive Inventory Access**: Product Managers can view and order from their entire specialty inventory, not just allocated items
- **Enhanced User Experience**: Product Managers see consistent inventory across dashboard and inventory management pages
- **Cross-Specialty Allocation Support**: Users can also see items allocated to them regardless of specialty mismatch

### July 2, 2025 - Complete Role-Based Inventory Access Implementation (Previous)
- **Dual Inventory API System**: Implemented two distinct inventory filtering approaches
  - `/api/my-allocated-inventory`: Shows only items allocated to specific users (used in Dashboard)
  - `/api/my-specialty-inventory`: Shows all items matching user's specialty (used in Inventory Management)
- **Role-Based Access Logic**: 
  - **Dashboard**: Product Managers see statistics for only their allocated inventory
  - **Inventory Management**: Product Managers see all items in their specialty (e.g., CNS, Primary Care 1)
  - **Admins/Stock Keepers**: Continue to see all inventory across both views
- **Fixed Stock Movement Issues**: Resolved getRoleName import errors and API submission bugs
- **Enhanced Quantity Editing**: Made stock quantity fields directly editable with number input
- **Inventory Allocation System**: Created comprehensive admin interface for assigning inventory to users
- **Role Activation Controls**: CEO can control which roles appear in navigation
- **Mobile App Integration**: Applied same role-based filtering to mobile inventory views

### June 30, 2025 - Request Approval System Implementation and Fixes (Previous)
- **Complete Request Management System**: Implemented comprehensive 3-workflow system
  - `prepare_order`: Product Manager → Stock Keeper direct requests
  - `inventory_share`: Product Manager → Product Manager → Stock Keeper (multi-step approval)
  - `receive_inventory`: Product Manager → Stock Keeper notifications
- **Enhanced Database Schema**: Added request files table for better file management
- **Robust API Endpoints**: Implemented all required routes including:
  - `GET /api/requests/:id` for individual request details
  - `POST /api/requests/:id/upload` for dedicated file uploads
  - Multi-stage approval workflows with proper state management
- **Fixed Critical Issues**: Resolved JSON parsing errors, TypeScript validation, and form data handling
- **File Upload System**: Excel file support with proper validation and storage
- **Role-Based Request Filtering**: Users see only relevant requests based on their role
- **Request Status Management**: Comprehensive status tracking (pending, approved, denied, completed)

### June 30, 2025 - Comprehensive UI/UX Enhancements and Advanced Features (Previous)
- **Role-Based Dashboard System**: Implemented customized dashboards for Product Managers, Stock Keepers, and Administrators
  - Product Manager dashboard focuses on request management and tracking
  - Stock Keeper dashboard emphasizes inventory health and approval workflows
  - Admin dashboard provides system-wide oversight and user management
- **Visual Inventory Health Indicators**: Added comprehensive health monitoring with:
  - Real-time health score calculations
  - Low stock alerts and expiring items tracking
  - Color-coded status indicators and progress bars
  - Category-wise inventory breakdown
- **Personalized User Onboarding Flow**: Created role-specific onboarding experiences
  - Interactive step-by-step guides tailored to user roles
  - Progress tracking with completion indicators
  - Quick tips and best practices for each role
  - Dismissible interface with persistent progress storage
- **Smart Search and Filter System**: Implemented advanced filtering capabilities
  - Multi-criteria search across name, item number, and notes
  - Category, specialty, stock level, and expiry status filters
  - Real-time result filtering with active filter indicators
  - Smart filter summary and quick clear options
- **Export and Print Functionality**: Added comprehensive report generation
  - PDF export with formatted tables and headers
  - CSV export for data analysis
  - Direct print functionality with optimized layouts
  - Multiple export formats with date stamping
- **Enhanced Request Management Workflows**: Previous implementation refined
  - Fixed API call issues and improved error handling
  - Restricted Product Manager permissions for security
  - Improved multi-stage approval processes

### June 30, 2025 - Enhanced Request Management Workflows (Previous)
- Implemented three specific request workflows for Product Managers
- Added approve and forward functionality for inventory sharing workflow
- Enhanced database schema with workflow routing fields
- Updated request form to dynamically show appropriate fields based on request type
- Added role-based permissions for Product Manager and Stock Keeper roles

### June 14, 2025 - Dependency Updates and TypeScript Fixes
- Updated core dependencies to latest compatible versions
- Fixed stock item creation bug related to specialtyId validation
- Enhanced schema validation for specialty ID handling
- Updated React Query to v5.67.0
- Updated Lucide React icons to v0.468.0
- Updated Framer Motion to v11.14.0
- Fixed TypeScript compilation errors across the application
- Resolved date handling issues in stock item updates
- Fixed barcode scanner ref type compatibility
- Corrected user management specialty type handling
- Addressed security vulnerabilities in dependencies
- Fixed database connection error handling and configuration

### Previous Updates
- Completed specialty management system with database migrations
- Integrated specialty selection into stock item forms
- Removed public registration, implemented admin-only user creation
- Enhanced role-based access control for specialty management
- Fixed critical schema validation bugs

## User Preferences
- Prioritize visual elements and user-friendly interfaces
- Database persistence required for all data
- Admin-controlled user registration model
- Role-based specialty filtering essential
- Professional pharmaceutical industry standards

## Development Notes
- Using DatabaseStorage for production with PostgreSQL
- MemStorage available for development/testing
- Stock items require specialty association for proper filtering
- All forms use Zod validation with proper type conversion
- Authentication uses Passport.js with session management

## Current Status
✅ Application running successfully with updated dependencies
✅ Stock item creation working with specialty validation
✅ Role-based access control functioning
✅ Database connectivity established
⚠️ Minor security vulnerabilities in transitive dependencies (non-critical)

## Next Steps
- Monitor application performance with updated dependencies
- Consider additional security hardening
- Potential UI/UX enhancements based on user feedback