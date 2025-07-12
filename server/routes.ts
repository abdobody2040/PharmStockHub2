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

  // Role activation endpoints
  app.get('/api/active-roles', isAuthenticated, async (req, res, next) => {
    try {
      const activeRoles = await storage.getActiveRoles();
      res.json(activeRoles);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/active-roles', isAuthenticated, hasPermission("canAccessSettings"), async (req, res, next) => {
    try {
      const { roles } = req.body;
      await storage.updateActiveRoles(roles);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
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
      const updateData = { ...req.body };
      
      // If password is being updated, hash it first
      if (updateData.password) {
        const { hashPassword } = require('./auth');
        updateData.password = await hashPassword(updateData.password);
      }
      
      const user = await storage.updateUser(id, updateData);
      
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
      const user = req.user;
      
      // Filter inventory based on user role and allocations
      if (user && (user.role === 'marketer' || user.role === 'salesManager' || user.role === 'medicalRep')) {
        // Get allocated stock for this user
        const userAllocations = await storage.getAllocations(user.id);
        const allocatedItemIds = userAllocations.map(a => a.stockItemId);
        
        // Return only items allocated to this user
        const allocatedItems = stockItems.filter(item => allocatedItemIds.includes(item.id));
        res.json(allocatedItems);
      } else {
        // Admin, CEO, Stock Keeper, etc. see all items
        res.json(stockItems);
      }
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

  app.post("/api/stock-items", isAuthenticated, upload.single('image'), async (req, res, next) => {
    try {
      // Parse form data - convert string values to appropriate types
      const formData = req.body;
      
      const stockItemData = {
        name: formData.name,
        categoryId: parseInt(formData.categoryId),
        specialtyId: formData.specialtyId ? parseInt(formData.specialtyId) : null,
        quantity: parseInt(formData.quantity),
        price: parseInt(formData.price) || 0,
        expiry: formData.expiry ? new Date(formData.expiry) : null,
        uniqueNumber: formData.uniqueNumber || null,
        notes: formData.notes || null,
        createdBy: req.user?.id || 1, // Add the current user as creator
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };
      
      const validatedData = extendedInsertStockItemSchema.parse(stockItemData);
      const stockItem = await storage.createStockItem(validatedData);
      res.json(stockItem);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/stock-items/:id", isAuthenticated, upload.single('image'), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const formData = req.body;
      
      const updateData: any = {};
      
      if (formData.name) updateData.name = formData.name;
      if (formData.categoryId) updateData.categoryId = parseInt(formData.categoryId);
      if (formData.specialtyId !== undefined) {
        updateData.specialtyId = formData.specialtyId ? parseInt(formData.specialtyId) : null;
      }
      if (formData.quantity) updateData.quantity = parseInt(formData.quantity);
      if (formData.price !== undefined) updateData.price = parseInt(formData.price) || 0;
      if (formData.expiry !== undefined) {
        updateData.expiry = formData.expiry ? new Date(formData.expiry) : null;
      }
      if (formData.uniqueNumber !== undefined) updateData.uniqueNumber = formData.uniqueNumber || null;
      if (formData.notes !== undefined) updateData.notes = formData.notes || null;
      if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
      
      const validatedData = extendedInsertStockItemSchema.partial().parse(updateData);
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

  // Get allocated inventory for current user
  app.get("/api/my-allocated-inventory", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Admin and stockKeeper see all items
      if (user.role === 'admin' || user.role === 'stockKeeper' || user.role === 'ceo') {
        const allItems = await storage.getStockItems();
        return res.json(allItems);
      }

      // Other roles see only their allocated inventory
      const allocations = await storage.getAllocations(user.id);
      const allocatedItemIds = allocations.map(a => a.stockItemId);
      
      if (allocatedItemIds.length === 0) {
        return res.json([]);
      }

      const allItems = await storage.getStockItems();
      const allocatedItems = allItems.filter(item => allocatedItemIds.includes(item.id));
      
      // Adjust quantities to show only allocated amounts
      const adjustedItems = allocatedItems.map(item => {
        const userAllocations = allocations.filter(a => a.stockItemId === item.id);
        const allocatedQuantity = userAllocations.reduce((sum, a) => sum + a.quantity, 0);
        return {
          ...item,
          quantity: allocatedQuantity
        };
      });

      res.json(adjustedItems);
    } catch (error) {
      next(error);
    }
  });

  // Get inventory by specialty for current user
  app.get("/api/my-specialty-inventory", isAuthenticated, async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Admin and stockKeeper see all items
      if (user.role === 'admin' || user.role === 'stockKeeper' || user.role === 'ceo') {
        const allItems = await storage.getStockItems();
        return res.json(allItems);
      }

      // For Product Managers and other roles, show both specialty items AND allocated items
      const allItems = await storage.getStockItems();
      const allocations = await storage.getAllocations(user.id);
      const allocatedItemIds = allocations.map(a => a.stockItemId);
      
      console.log(`Debug: User ${user.id} has specialtyId: ${user.specialtyId}`);
      console.log(`Debug: Found ${allItems.length} total items`);
      console.log(`Debug: User has ${allocations.length} allocations: ${allocatedItemIds.join(', ')}`);
      
      // Get items that match either specialty OR are allocated to user
      const relevantItems = allItems.filter(item => {
        const matchesSpecialty = user.specialtyId && item.specialtyId === user.specialtyId;
        const isAllocated = allocatedItemIds.includes(item.id);
        
        console.log(`Debug: Item ${item.id} (${item.name}) - specialtyId: ${item.specialtyId}, matches: ${matchesSpecialty}, allocated: ${isAllocated}`);
        
        return matchesSpecialty || isAllocated;
      });
      
      console.log(`Debug: Returning ${relevantItems.length} items`);
      res.json(relevantItems);
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
      
      // Use the transaction method to properly handle stock movements
      const movement = await storage.executeStockMovementTransaction({
        stockItemId: validatedData.stockItemId,
        fromUserId: validatedData.fromUserId,
        toUserId: validatedData.toUserId,
        quantity: validatedData.quantity,
        notes: validatedData.notes,
        movedBy: validatedData.movedBy
      });
      
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
      
      // Get request items
      const items = await storage.getRequestItems(id);
      
      res.json({
        ...request,
        items
      });
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

  // Final approval for 2-step workflows (stock keeper final approval)
  app.post("/api/requests/:id/final-approve", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const request = await storage.finalApprove(id, notes);
      
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  // Dedicated file upload endpoint for existing requests
  app.post("/api/requests/:id/upload", isAuthenticated, upload.single('attachment'), async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Update the request with the file URL
      const updatedRequest = await storage.updateRequest(id, {
        fileUrl: req.file.path
      });
      
      if (!updatedRequest) {
        return res.status(404).json({ error: "Request not found" });
      }
      
      res.json({
        message: "File uploaded successfully",
        fileUrl: req.file.path,
        request: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  });

  const server = createServer(app);
  return server;
}