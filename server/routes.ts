import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
import { setupAuth, upload } from "./auth";
import multer from "multer";
import { 
  extendedInsertStockItemSchema, 
  insertStockMovementSchema,
  insertCategorySchema
} from "@shared/schema";
import { User } from "@shared/schema";

import { 
  extendedInsertStockItemSchema, 
  insertStockMovementSchema,
  insertCategorySchema,
  insertInventoryRequestSchema,
  insertRequestItemSchema,
  REQUEST_TYPES,
  REQUEST_STATUS
} from "@shared/schema";


// Add multer type extensions to Request
declare global {
  namespace Express {


// Configure multer for Excel file uploads
const excelUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const excelDir = path.join(process.cwd(), 'uploads', 'excel');
      if (!fs.existsSync(excelDir)) {
        fs.mkdirSync(excelDir, { recursive: true });
      }
      cb(null, excelDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, 'request-' + uniqueSuffix + ext);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for Excel files
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (file.mimetype.includes('spreadsheet') || file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});


    // Extend the Request interface to include file property from multer
    interface Request {
      file?: Express.Multer.File; // Type for multer file
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { isAuthenticated, hasPermission } = setupAuth(app);

  // Static route for serving uploaded files
  const uploadDir = path.join(process.cwd(), "uploads");
  app.use('/uploads', express.static('uploads'));

  // System settings endpoints
  app.get('/api/system-settings', async (req, res) => {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  });

  app.post('/api/system-settings', async (req, res) => {
    await storage.updateSystemSettings(req.body);
    res.json({ success: true });
  });

  // API routes

  // Specialties
  app.get("/api/specialties", isAuthenticated, async (req, res, next) => {
    try {
      const specialties = await storage.getSpecialties();
      res.json(specialties);
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/specialties", 
    isAuthenticated, 
    hasPermission("canManageSpecialties"),
    (req, res, next) => {
      // The `isAuthenticated` and `hasPermission` middleware should have already run
      // and ensured req.user is defined. However, to satisfy TypeScript's strict checks
      // in this separate middleware, we add a check.
      if (!req.user) {
        // This case should ideally not be reached if prior middleware worked correctly.
        return res.status(401).json({ message: "Unauthorized: User not authenticated" });
      }
      if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only CEO and Admin can manage specialties" });
      }
      next();
    },
    async (req, res, next) => {
      try {
        const specialty = await storage.createSpecialty(req.body);
        res.status(201).json(specialty);
      } catch (error) {
        next(error);
      }
    }
  );

  app.put(
    "/api/specialties/:id", 
    isAuthenticated, 
    hasPermission("canManageSpecialties"),
    (req, res, next) => {
      // The `isAuthenticated` and `hasPermission` middleware should have already run
      // and ensured req.user is defined. However, to satisfy TypeScript's strict checks
      // in this separate middleware, we add a check.
      if (!req.user) {
        // This case should ideally not be reached if prior middleware worked correctly.
        return res.status(401).json({ message: "Unauthorized: User not authenticated" });
      }
      if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only CEO and Admin can manage specialties" });
      }
      next();
    },
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const updatedSpecialty = await storage.updateSpecialty(id, req.body);

        if (!updatedSpecialty) {
          return res.status(404).json({ message: "Specialty not found" });
        }

        res.json(updatedSpecialty);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/specialties/:id", 
    isAuthenticated, 
    hasPermission("canManageSpecialties"),
    (req, res, next) => {
      // The `isAuthenticated` and `hasPermission` middleware should have already run
      // and ensured req.user is defined. However, to satisfy TypeScript's strict checks
      // in this separate middleware, we add a check.
      if (!req.user) {
        // This case should ideally not be reached if prior middleware worked correctly.
        return res.status(401).json({ message: "Unauthorized: User not authenticated" });
      }
      if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only CEO and Admin can manage specialties" });
      }
      next();
    },
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteSpecialty(id);

        if (!success) {
          return res.status(404).json({ message: "Specialty not found" });
        }

        res.status(204).end();
      } catch (error) {
        next(error);
      }
    }
  );

  // Categories
  app.get("/api/categories", isAuthenticated, async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/categories", isAuthenticated, hasPermission("canAddItems"), async (req, res, next) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/categories/:id", isAuthenticated, hasPermission("canAddItems"), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);

      // Check if the category exists first
      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Update the category
      const updatedCategory = await storage.updateCategory(id, categoryData);
      res.json(updatedCategory);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, hasPermission("canAddItems"), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);

      // Check if category is being used by any stock items
      const stockItems = await storage.getStockItemsByCategory(id);
      if (stockItems.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category that is in use by stock items" 
        });
      }

      // Delete the category
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Stock Items
  app.get("/api/stock-items", isAuthenticated, async (req, res, next) => {
    try {
      const stockItems = await storage.getStockItems();
      res.json(stockItems);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/stock-items/expiring", isAuthenticated, async (req, res, next) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const items = await storage.getExpiringItems(days);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/stock-items/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getStockItem(id);

      if (!item) {
        return res.status(404).json({ message: "Stock item not found" });
      }

      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/stock-items", 
    isAuthenticated, 
    hasPermission("canAddItems"), 
    upload.single("image"), 
    async (req, res, next) => {
      try {
        // Parse form data properly
        const stockData = {
          ...req.body,
          // Ensure numeric fields are properly converted
          quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
          categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : undefined,
          // Convert price from dollars to cents (stored as integer)
          price: req.body.price ? Math.round(parseFloat(req.body.price) * 100) : 0,
          // Add the current user as creator
          createdBy: (req.user as User).id
        };

        // Handle expiry date properly - check for empty strings and invalid dates
        if (stockData.expiry !== undefined) {
          if (stockData.expiry === '' || stockData.expiry === null) {
            // Set to null for empty strings
            stockData.expiry = null;
          } else {
            try {
              const dateObj = new Date(stockData.expiry);
              if (isNaN(dateObj.getTime())) {
                // Invalid date, set to null
                stockData.expiry = null;
              } else {
                stockData.expiry = dateObj.toISOString();
              }
            } catch (e) {
              // If date conversion fails, set to null to prevent errors
              console.error("Date conversion error in creation:", e);
              stockData.expiry = null;
            }
          }
        }

        // Handle image upload
        if (req.file) {
          stockData.imageUrl = `/uploads/${req.file.filename}`;
        }

        console.log("Received stock data:", stockData);

        // Validate data with extended schema
        const validatedData = extendedInsertStockItemSchema.parse(stockData);

        // Create stock item
        const stockItem = await storage.createStockItem(validatedData);
        res.status(201).json(stockItem);
      } catch (error) {
        console.error("Stock item creation error:", error);
        next(error);
      }
    }
  );

  app.put(
    "/api/stock-items/:id", 
    isAuthenticated, 
    hasPermission("canEditItems"), 
    upload.single("image"), 
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);

        // Parse and convert form data
        const updateData = {
          ...req.body,
          // Convert numeric strings to numbers if they exist
          quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : undefined,
          categoryId: req.body.categoryId !== undefined ? parseInt(req.body.categoryId) : undefined,
          // Convert price from dollars to cents (stored as integer)
          price: req.body.price !== undefined ? Math.round(parseFloat(req.body.price) * 100) : undefined,
        };

        // Handle expiry date properly - check for empty strings and invalid dates
        if (updateData.expiry !== undefined) {
          if (updateData.expiry === '' || updateData.expiry === null) {
            // Set to null for empty strings
            updateData.expiry = null;
          } else {
            try {
              // Check if it's already a valid date string in ISO format
              if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(updateData.expiry)) {
                // If not in ISO format, try to convert it
                const dateObj = new Date(updateData.expiry);
                if (isNaN(dateObj.getTime())) {
                  // Invalid date, set to null
                  updateData.expiry = null;
                } else {
                  updateData.expiry = dateObj.toISOString();
                }
              }
            } catch (e) {
              // If date conversion fails, set to null to prevent errors
              console.error("Date conversion error:", e);
              updateData.expiry = null;
            }
          }
        }

        // Handle image upload
        if (req.file) {
          updateData.imageUrl = `/uploads/${req.file.filename}`;

          // Delete old image if exists
          const oldItem = await storage.getStockItem(id);
          if (oldItem?.imageUrl) {
            const oldImagePath = path.join(process.cwd(), oldItem.imageUrl.replace(/^\/uploads\//, 'uploads/'));
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
        }

        console.log("Updating stock item:", id, updateData);

        const updatedItem = await storage.updateStockItem(id, updateData);

        if (!updatedItem) {
          return res.status(404).json({ message: "Stock item not found" });
        }

        res.json(updatedItem);
      } catch (error) {
        console.error("Stock item update error:", error);
        next(error);
      }
    }
  );

  app.delete(
    "/api/stock-items/:id", 
    isAuthenticated, 
    hasPermission("canRemoveItems"), 
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);

        // Get item to check for image
        const item = await storage.getStockItem(id);
        if (!item) {
          return res.status(404).json({ message: "Stock item not found" });
        }

        // Delete associated image if exists
        if (item.imageUrl) {
          const imagePath = path.join(process.cwd(), item.imageUrl.replace(/^\/uploads\//, 'uploads/'));
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }

        const success = await storage.deleteStockItem(id);

        if (!success) {
          return res.status(404).json({ message: "Stock item not found" });
        }

        res.status(204).end();
      } catch (error) {
        next(error);
      }
    }
  );

  // Stock Allocations
  app.get("/api/allocations", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const allocations = await storage.getAllocations(userId);
      res.json(allocations);
    } catch (error) {
      next(error);
    }
  });

  // Stock Movements
  app.get("/api/movements", isAuthenticated, async (req, res, next) => {
    try {
      const movements = await storage.getMovements();
      res.json(movements);
    } catch (error) {
      next(error);
    }
  });

  app.post(
    "/api/movements", 
    isAuthenticated, 
    hasPermission("canMoveStock"), 
    async (req, res, next) => {
      try {
        let movementData = req.body;

        // Convert numeric strings to numbers
        if (movementData.stockItemId) movementData.stockItemId = parseInt(movementData.stockItemId);

        // Ensure fromUserId is null if it's not a valid number or is explicitly meant to be null
        if (movementData.fromUserId && !isNaN(parseInt(movementData.fromUserId))) {
            movementData.fromUserId = parseInt(movementData.fromUserId);
        } else {
            movementData.fromUserId = null; 
        }

        if (movementData.toUserId) movementData.toUserId = parseInt(movementData.toUserId);
        if (movementData.quantity) movementData.quantity = parseInt(movementData.quantity);

        // Set current user as the one who moved the stock
        movementData.movedBy = (req.user as User).id;

        // Validate (this should ideally be more robust, but keep existing for now or ensure it aligns with transaction method's needs)
        const validatedData = insertStockMovementSchema.parse(movementData);

        // Call the new transactional method
        const movement = await storage.executeStockMovementTransaction({
          stockItemId: validatedData.stockItemId,
          quantity: validatedData.quantity,
          fromUserId: validatedData.fromUserId,
          toUserId: validatedData.toUserId,
          movedBy: validatedData.movedBy,
          notes: validatedData.notes || undefined
        });

        res.status(201).json(movement);
      } catch (error) {
        // Errors from executeStockMovementTransaction (e.g., insufficient stock) will be caught here
        next(error);
      }
    }
  );

  // Users
  app.get("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const role = req.query.role as string | undefined;

      let users;
      if (role) {
        users = await storage.getUsersByRole(role as any);
      } else {
        users = await storage.getUsers();
      }

      // Remove passwords from response
      const safeUsers = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });

  // Get a single user
  app.get("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      next(error);
    }
  });

  // Update a user
  app.put(
    "/api/users/:id", 
    isAuthenticated, 
    hasPermission("canManageUsers"), 
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const userData = req.body;

        // If password is provided, hash it
        if (userData.password) {


  // Request System Routes

  // Get all requests (filtered by user role)
  app.get("/api/requests", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as User;
      let requests;

      if (user.role === 'stockKeeper' || user.role === 'ceo' || user.role === 'admin') {
        // Stock keepers and admins can see all requests
        requests = await storage.getRequests();
      } else if (user.role === 'productManager') {
        // Product managers can see their own requests and requests assigned to them
        const userRequests = await storage.getRequests(user.id);
        const assignedRequests = await storage.getRequests(undefined, undefined);
        const assignedToMe = assignedRequests.filter(r => r.assignedTo === user.id);
        
        // Merge and deduplicate
        const allRequests = [...userRequests, ...assignedToMe];
        requests = allRequests.filter((req, index, self) => 
          index === self.findIndex(r => r.id === req.id)
        );
      } else {
        // Other roles can only see their own requests
        requests = await storage.getRequests(user.id);
      }

      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  // Get single request with items
  app.get("/api/requests/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const items = await storage.getRequestItems(id);
      res.json({ ...request, items });
    } catch (error) {
      next(error);
    }
  });

  // Create new request
  app.post(
    "/api/requests", 
    isAuthenticated, 
    hasPermission("canCreateRequests"),
    excelUpload.single("file"),
    async (req, res, next) => {
      try {
        const user = req.user as User;
        
        const requestData = {
          ...req.body,
          requestedBy: user.id,
          assignedTo: req.body.assignedTo ? parseInt(req.body.assignedTo) : null,
        };

        // Handle file upload
        if (req.file) {
          requestData.fileUrl = `/uploads/excel/${req.file.filename}`;
        }

        // Parse request items if provided
        let items = [];
        if (req.body.items) {
          try {
            items = JSON.parse(req.body.items);
          } catch (e) {
            return res.status(400).json({ message: "Invalid items format" });
          }
        }

        const validatedData = insertInventoryRequestSchema.parse(requestData);
        const request = await storage.createRequest(validatedData);

        // Create request items if provided
        if (items.length > 0) {
          for (const item of items) {
            await storage.createRequestItem({
              requestId: request.id,
              stockItemId: item.stockItemId || null,
              itemName: item.itemName || null,
              quantity: parseInt(item.quantity),
              notes: item.notes || null,
            });
          }
        }

        res.status(201).json(request);
      } catch (error) {
        console.error("Request creation error:", error);
        next(error);
      }
    }
  );

  // Update request (approve/deny/complete)
  app.put(
    "/api/requests/:id", 
    isAuthenticated,
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const user = req.user as User;
        const updateData = req.body;

        // Check if user can update this request
        const request = await storage.getRequest(id);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        // Only assigned user, stock keeper, or requester can update
        const canUpdate = request.assignedTo === user.id || 
                         user.role === 'stockKeeper' || 
                         request.requestedBy === user.id ||
                         user.role === 'ceo' ||
                         user.role === 'admin';

        if (!canUpdate) {
          return res.status(403).json({ message: "Not authorized to update this request" });
        }

        // If completing request, set completion timestamp
        if (updateData.status === 'completed') {
          updateData.completedAt = new Date();
        }

        const updatedRequest = await storage.updateRequest(id, updateData);
        res.json(updatedRequest);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete request
  app.delete(
    "/api/requests/:id", 
    isAuthenticated,
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);
        const user = req.user as User;

        const request = await storage.getRequest(id);
        if (!request) {
          return res.status(404).json({ message: "Request not found" });
        }

        // Only requester or admin can delete
        if (request.requestedBy !== user.id && user.role !== 'ceo' && user.role !== 'admin') {
          return res.status(403).json({ message: "Not authorized to delete this request" });
        }

        // Delete associated file if exists
        if (request.fileUrl) {
          const filePath = path.join(process.cwd(), request.fileUrl.replace(/^\/uploads\//, 'uploads/'));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        const success = await storage.deleteRequest(id);
        if (!success) {
          return res.status(404).json({ message: "Request not found" });
        }

        res.status(204).end();
      } catch (error) {
        next(error);
      }
    }
  );

  // Get requests assigned to current user (for stock keepers)
  app.get("/api/requests/assigned/me", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as User;
      const requests = await storage.getRequests();
      const assignedRequests = requests.filter(r => r.assignedTo === user.id);
      res.json(assignedRequests);
    } catch (error) {
      next(error);
    }
  });


          const { hashPassword } = await import('./auth.js');
          userData.password = await hashPassword(userData.password);
        }

        const updatedUser = await storage.updateUser(id, userData);

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Remove password from response
        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete a user
  app.delete(
    "/api/users/:id", 
    isAuthenticated, 
    hasPermission("canManageUsers"), 
    async (req, res, next) => {
      try {
        const id = parseInt(req.params.id);

        // Don't allow deleting the current user
        if (id === (req.user as User).id) {
          return res.status(400).json({ message: "Cannot delete your own account" });
        }

        const success = await storage.deleteUser(id);

        if (!success) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(204).end();
      } catch (error) {
        next(error);
      }
    }
  );

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      await storage.getCategories();
      res.json({ status: "ok", timestamp: new Date().toISOString(), database: "connected" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(503).json({ status: "error", timestamp: new Date().toISOString(), database: "disconnected", error: errorMessage });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}