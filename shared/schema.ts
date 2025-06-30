import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Specialties schema
export const specialties = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User and Auth schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  region: text("region"),
  avatar: text("avatar"),
  specialtyId: integer("specialty_id").references(() => specialties.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSpecialtySchema = createInsertSchema(specialties).pick({
  name: true,
  description: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  region: true,
  avatar: true,
  specialtyId: true,
});

// Stock categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
});

export const insertCategorySchema = createInsertSchema(categories);

// Stock items
export const stockItems = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
  specialtyId: integer("specialty_id").references(() => specialties.id),
  quantity: integer("quantity").notNull().default(0),
  price: integer("price").default(0), // Price in cents (e.g. $10.99 = 1099)
  expiry: timestamp("expiry"),
  uniqueNumber: text("unique_number"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(), // User ID
});

export const insertStockItemSchema = createInsertSchema(stockItems).pick({
  name: true,
  categoryId: true,
  specialtyId: true,
  quantity: true,
  price: true,
  expiry: true,
  uniqueNumber: true,
  imageUrl: true,
  notes: true,
  createdBy: true,
});

// Stock allocations - tracks which user has which stock items
export const stockAllocations = pgTable("stock_allocations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockItemId: integer("stock_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  allocatedAt: timestamp("allocated_at").defaultNow(),
  allocatedBy: integer("allocated_by").notNull(), // User ID who allocated
});

export const insertStockAllocationSchema = createInsertSchema(stockAllocations).pick({
  userId: true,
  stockItemId: true,
  quantity: true,
  allocatedBy: true,
});


// Request types enum
export const REQUEST_TYPES = {
  PREPARE_ORDER: "prepare_order",           // PM → Stock Keeper: Request to prepare order
  INVENTORY_SHARE: "inventory_share",       // PM1 → PM2 → Stock Keeper: Share quota between PMs
  RECEIVE_INVENTORY: "receive_inventory"    // PM → Stock Keeper: Inform about incoming inventory
} as const;

export const REQUEST_STATUS = {
  PENDING: "pending",
  PENDING_SECONDARY: "pending_secondary", // For inventory_share: waiting for PM2 approval
  APPROVED: "approved", 
  DENIED: "denied",
  COMPLETED: "completed"
} as const;

// Inventory requests table
export const inventoryRequests = pgTable("inventory_requests", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // prepare_order, inventory_share, receive_inventory
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  assignedTo: integer("assigned_to").references(() => users.id), // Current assignee (PM2 or Stock Keeper)
  finalAssignee: integer("final_assignee").references(() => users.id), // Final Stock Keeper assignee
  secondaryApprover: integer("secondary_approver").references(() => users.id), // PM2 for sharing requests
  status: text("status").notNull().default("pending"),
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"), // For approver/denier notes
  secondaryNotes: text("secondary_notes"), // Notes from PM2 in sharing workflow
  fileUrl: text("file_url"), // For Excel uploads
  requestData: text("request_data"), // JSON data for specific request details
  shareFromUserId: integer("share_from_user_id").references(() => users.id), // For sharing: PM1
  shareToUserId: integer("share_to_user_id").references(() => users.id), // For sharing: PM2
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Request items table (for detailed item requests)
export const requestItems = pgTable("request_items", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => inventoryRequests.id, { onDelete: "cascade" }),
  stockItemId: integer("stock_item_id").references(() => stockItems.id),
  itemName: text("item_name"), // For items not yet in system
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
});

// File uploads table (for better file management)
export const requestFiles = pgTable("request_files", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => inventoryRequests.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Insert schemas for requests
export const insertInventoryRequestSchema = createInsertSchema(inventoryRequests).pick({
  type: true,
  requestedBy: true,
  assignedTo: true,
  title: true,
  description: true,
  fileUrl: true,
  requestData: true,
});

export const insertRequestItemSchema = createInsertSchema(requestItems).pick({
  requestId: true,
  stockItemId: true,
  itemName: true,
  quantity: true,
  notes: true,
});

export const insertRequestFileSchema = createInsertSchema(requestFiles).pick({
  requestId: true,
  filePath: true,
  originalName: true,
  fileSize: true,
  mimeType: true,
});

// Types
export type InventoryRequest = typeof inventoryRequests.$inferSelect;
export type InsertInventoryRequest = typeof inventoryRequests.$inferInsert;
export type RequestItem = typeof requestItems.$inferSelect;
export type InsertRequestItem = typeof requestItems.$inferInsert;
export type RequestFile = typeof requestFiles.$inferSelect;
export type InsertRequestFile = typeof requestFiles.$inferInsert;



// Stock movements - tracks movement history
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  stockItemId: integer("stock_item_id").notNull(),
  fromUserId: integer("from_user_id"), // Null if from central inventory
  toUserId: integer("to_user_id").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  movedAt: timestamp("moved_at").defaultNow(),
  movedBy: integer("moved_by").notNull(), // User ID who initiated the move
  // Temporarily removed type field to match existing database schema
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).pick({
  stockItemId: true,
  fromUserId: true,
  toUserId: true,
  quantity: true,
  notes: true,
  movedBy: true,
  // type: true, // Temporarily removed to match schema
});

// Extended schemas with validation
export const extendedInsertUserSchema = insertUserSchema.extend({
  role: z.enum(['ceo', 'marketer', 'salesManager', 'stockManager', 'admin', 'medicalRep']),
});

export const extendedInsertStockItemSchema = insertStockItemSchema.extend({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  categoryId: z.number().int().positive("Category is required"),
  // Add specialtyId validation to handle both number and string conversion
  specialtyId: z.union([
    z.number().int().positive(),
    z.string().transform(val => {
      if (!val) return null;
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    }),
    z.null(),
  ]).nullable().optional(),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  price: z.number().int().min(0, "Price cannot be negative").default(0),
  // Allow null, empty strings, and Date objects for expiry
  expiry: z.union([
    z.date(),
    z.string().transform(val => {
      if (!val) return null;
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }),
    z.null(),
  ]).nullable().optional(),
});

// Types
export type InsertUser = z.infer<typeof extendedInsertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialties.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertStockItem = z.infer<typeof extendedInsertStockItemSchema>;
export type StockItem = typeof stockItems.$inferSelect;

export type InsertStockAllocation = z.infer<typeof insertStockAllocationSchema>;
export type StockAllocation = typeof stockAllocations.$inferSelect;

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// Role permissions
export const ROLE_PERMISSIONS = {
  ceo: {
    canViewAll: true,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canManageSpecialties: true,
    canSeeAllSpecialties: true,
    canCreateRequests: true,
    canUploadFiles: true,
    canShareInventory: true,
    canManageRequests: true,
    canRestockInventory: true,
    canValidateInventory: true
  },
  marketer: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageSpecialties: false,
    canSeeAllSpecialties: false,
    canCreateRequests: false,
    canUploadFiles: false,
    canShareInventory: false,
    canManageRequests: false,
    canRestockInventory: false,
    canValidateInventory: false
  },
  salesManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageSpecialties: false,
    canSeeAllSpecialties: false,
    canCreateRequests: false,
    canUploadFiles: false,
    canShareInventory: false,
    canManageRequests: false,
    canRestockInventory: false,
    canValidateInventory: false
  },
  stockManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: true,
    canManageSpecialties: false,
    canSeeAllSpecialties: false,
    canCreateRequests: false,
    canUploadFiles: false,
    canShareInventory: false,
    canManageRequests: false,
    canRestockInventory: false,
    canValidateInventory: false
  },
  admin: {
    canViewAll: true,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: false,
    canManageUsers: true,
    canViewReports: true,
    canAccessSettings: true,
    canManageSpecialties: true,
    canSeeAllSpecialties: true,
    canCreateRequests: true,
    canUploadFiles: true,
    canShareInventory: true,
    canManageRequests: true,
    canRestockInventory: true,
    canValidateInventory: true
  },
  medicalRep: {
    canViewAll: false,
    canAddItems: false,
    canEditItems: false,
    canRemoveItems: false,
    canMoveStock: false,
    canManageUsers: false,
    canViewReports: false,
    canAccessSettings: false,
    canManageSpecialties: false,
    canSeeAllSpecialties: false,
    canCreateRequests: false,
    canUploadFiles: false,
    canShareInventory: false,
    canManageRequests: false,
    canRestockInventory: false,
    canValidateInventory: false
  },
  productManager: {
    canViewAll: false,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: false,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: true,
    canAccessSettings: false,
    canManageSpecialties: false,
    canSeeAllSpecialties: false,
    canCreateRequests: true,
    canUploadFiles: true,
    canShareInventory: true,
    canManageRequests: false,
    canRestockInventory: false,
    canValidateInventory: false
  },
  stockKeeper: {
    canViewAll: true,
    canAddItems: true,
    canEditItems: true,
    canRemoveItems: true,
    canMoveStock: true,
    canManageUsers: false,
    canViewReports: true,
    canAccessSettings: false,
    canManageSpecialties: false,
    canSeeAllSpecialties: false,
    canCreateRequests: false,
    canUploadFiles: false,
    canShareInventory: false,
    canManageRequests: true,
    canRestockInventory: true,
    canValidateInventory: true
  }
};

export type RoleType = keyof typeof ROLE_PERMISSIONS;
