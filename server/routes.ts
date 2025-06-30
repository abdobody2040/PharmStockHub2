import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from './storage';
import path from 'path';
import fs from 'fs';
import { setupAuth, upload } from "./auth";
import multer from "multer";
import { 
  extendedInsertStockItemSchema, 
  insertStockMovementSchema,
  insertCategorySchema,
  insertInventoryRequestSchema,
  insertRequestItemSchema,
  REQUEST_TYPES,
  REQUEST_STATUS,
  User
} from "@shared/schema";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { isAuthenticated, hasPermission } = setupAuth(app);

  // Static route for serving uploaded files
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

  // Specialties
  app.get("/api/specialties", isAuthenticated, async (req, res, next) => {
    try {
      const specialties = await storage.getSpecialties();
      res.json(specialties);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/specialties", isAuthenticated, async (req, res, next) => {
    try {
      const specialty = await storage.createSpecialty(req.body);
      res.json(specialty);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/specialties/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const specialty = await storage.updateSpecialty(id, req.body);
      
      if (!specialty) {
        return res.status(404).json({ error: "Specialty not found" });
      }
      
      res.json(specialty);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/specialties/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSpecialty(id);
      
      if (!success) {
        return res.status(404).json({ error: "Specialty not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Categories
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Users
  app.get("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(({ password, ...user }) => user));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", isAuthenticated, async (req, res, next) => {
    try {
      const user = await storage.createUser(req.body);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Stock items
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
      const expiringItems = await storage.getExpiringItems(days);
      res.json(expiringItems);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/stock-items", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = extendedInsertStockItemSchema.parse(req.body);
      const stockItem = await storage.createStockItem(validatedData);
      res.json(stockItem);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/stock-items/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = extendedInsertStockItemSchema.partial().parse(req.body);
      const stockItem = await storage.updateStockItem(id, validatedData);
      
      if (!stockItem) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      
      res.json(stockItem);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/stock-items/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStockItem(id);
      
      if (!success) {
        return res.status(404).json({ error: "Stock item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Stock allocations
  app.get("/api/allocations", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const allocations = await storage.getAllocations(userId);
      res.json(allocations);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/allocations", isAuthenticated, async (req, res, next) => {
    try {
      const allocation = await storage.createAllocation(req.body);
      res.json(allocation);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/allocations/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const allocation = await storage.updateAllocation(id, req.body);
      
      if (!allocation) {
        return res.status(404).json({ error: "Allocation not found" });
      }
      
      res.json(allocation);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/allocations/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAllocation(id);
      
      if (!success) {
        return res.status(404).json({ error: "Allocation not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Stock movements
  app.get("/api/movements", isAuthenticated, async (req, res, next) => {
    try {
      const movements = await storage.getMovements();
      res.json(movements);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/movements", isAuthenticated, async (req, res, next) => {
    try {
      const validatedData = insertStockMovementSchema.parse(req.body);
      const movement = await storage.createMovement(validatedData);
      res.json(movement);
    } catch (error) {
      next(error);
    }
  });

  // Inventory requests
  app.get("/api/requests", isAuthenticated, async (req, res, next) => {
    try {
      const requests = await storage.getRequests();
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/requests/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRequest(id);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests", isAuthenticated, upload.single('attachment'), async (req, res, next) => {
    try {
      let requestData;
      
      // Handle both FormData and JSON formats
      if (req.body.requestData) {
        // FormData format with requestData field
        requestData = JSON.parse(req.body.requestData);
      } else {
        // Direct JSON format
        requestData = req.body;
      }
      
      console.log('Raw request data:', requestData);
      
      // Add the current user as requestedBy
      requestData.requestedBy = req.user?.id;
      
      // Convert string numbers to integers, handle empty strings
      if (requestData.assignedTo && requestData.assignedTo !== "" && requestData.assignedTo !== "undefined") {
        requestData.assignedTo = parseInt(requestData.assignedTo);
      } else {
        requestData.assignedTo = null;
      }
      
      // Handle other numeric fields
      if (requestData.shareToUserId && requestData.shareToUserId !== "" && requestData.shareToUserId !== "undefined") {
        requestData.shareToUserId = parseInt(requestData.shareToUserId);
      } else {
        requestData.shareToUserId = null;
      }
      
      if (requestData.finalAssignee && requestData.finalAssignee !== "" && requestData.finalAssignee !== "undefined") {
        requestData.finalAssignee = parseInt(requestData.finalAssignee);
      } else {
        requestData.finalAssignee = null;
      }
      
      const validatedData = insertInventoryRequestSchema.parse(requestData);
      
      if (req.file) {
        validatedData.fileUrl = req.file.path;
      }
      
      const request = await storage.createRequest(validatedData);
      
      if (requestData.items && requestData.items.length > 0) {
        for (const item of requestData.items) {
          if (item.stockItemId !== "none" && item.itemName && item.quantity) {
            await storage.createRequestItem({
              requestId: request.id,
              stockItemId: item.stockItemId !== "none" ? parseInt(item.stockItemId) : null,
              itemName: item.itemName,
              quantity: parseInt(item.quantity),
              notes: item.notes || null
            });
          }
        }
      }
      
      res.json(request);
    } catch (error) {
      console.error('Request creation error:', error);
      next(error);
    }
  });

  app.put("/api/requests/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateRequest(id, req.body);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests/:id/approve", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const request = await storage.approveRequest(id, notes);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests/:id/deny", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const request = await storage.denyRequest(id, notes);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/requests/:id/approve-and-forward", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const request = await storage.approveAndForward(id, notes);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  const server = createServer(app);
  return server;
}