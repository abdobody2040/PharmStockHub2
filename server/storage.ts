import { 
  users, 
  categories, 
  stockItems, 
  stockAllocations, 
  stockMovements, 
  specialties,
  inventoryRequests,
  requestItems,
  systemSettings,
  users as usersTable
} from "@shared/schema";
import type { 
  User, 
  Category, 
  StockItem, 
  StockAllocation, 
  StockMovement, 
  Specialty,
  InventoryRequest,
  RequestItem,
  InsertUser,
  InsertCategory,
  InsertStockItem,
  InsertStockAllocation,
  InsertStockMovement,
  InsertSpecialty,
  InsertInventoryRequest,
  InsertRequestItem,
  RoleType
} from "@shared/schema";
import { ROLE_PERMISSIONS } from "@shared/schema";
import session, { Store as SessionStore } from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, lte, and, isNotNull, sum } from "drizzle-orm";
import { addDays } from "date-fns";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // Specialty operations
  getSpecialties(): Promise<Specialty[]>;
  getSpecialty(id: number): Promise<Specialty | undefined>;
  createSpecialty(specialty: InsertSpecialty): Promise<Specialty>;
  updateSpecialty(id: number, specialty: Partial<Specialty>): Promise<Specialty | undefined>;
  deleteSpecialty(id: number): Promise<boolean>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: RoleType): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getStockItemsByCategory(categoryId: number): Promise<StockItem[]>;

  // Stock item operations
  getStockItems(): Promise<StockItem[]>;
  getStockItem(id: number): Promise<StockItem | undefined>;
  createStockItem(item: InsertStockItem): Promise<StockItem>;
  updateStockItem(id: number, item: Partial<StockItem>): Promise<StockItem | undefined>;
  deleteStockItem(id: number): Promise<boolean>;
  getExpiringItems(daysThreshold: number): Promise<StockItem[]>;

  // Stock allocation operations
  getAllocations(userId?: number): Promise<StockAllocation[]>;
  createAllocation(allocation: InsertStockAllocation): Promise<StockAllocation>;
  updateAllocation(id: number, allocation: Partial<StockAllocation>): Promise<StockAllocation | undefined>;
  deleteAllocation(id: number): Promise<boolean>;

  // Stock movement operations
  getMovements(): Promise<StockMovement[]>;
  createMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Permission check
  hasPermission(userId: number, permission: keyof typeof ROLE_PERMISSIONS.ceo): Promise<boolean>;

  // System settings operations
  getSystemSettings(): Promise<any>;
  updateSystemSettings(settings: any): Promise<void>;
  getActiveRoles(): Promise<string[]>;
  updateActiveRoles(roles: string[]): Promise<void>;

  // Stock movement transaction
  executeStockMovementTransaction(args: {
    stockItemId: number;
    fromUserId?: number | null;
    toUserId?: number | null;
    quantity: number;
    notes?: string;
    movedBy: number;
  }): Promise<StockMovement>;

  // Request operations
  getRequests(): Promise<InventoryRequest[]>;
  getRequest(id: number): Promise<InventoryRequest | undefined>;
  createRequest(request: InsertInventoryRequest): Promise<InventoryRequest>;
  updateRequest(id: number, request: Partial<InventoryRequest>): Promise<InventoryRequest | undefined>;
  deleteRequest(id: number): Promise<boolean>;
  getRequestItems(requestId: number): Promise<RequestItem[]>;
  createRequestItem(item: InsertRequestItem): Promise<RequestItem>;
  approveRequest(id: number, notes?: string): Promise<InventoryRequest | undefined>;
  denyRequest(id: number, notes?: string): Promise<InventoryRequest | undefined>;
  approveAndForward(id: number, notes?: string): Promise<InventoryRequest | undefined>;
  finalApprove(id: number, notes?: string): Promise<InventoryRequest | undefined>;

  // Session store
  sessionStore: SessionStore;
}

// In-memory implementation for development
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private categoriesMap: Map<number, Category>;
  private specialtiesMap: Map<number, Specialty>;
  private stockItemsMap: Map<number, StockItem>;
  private stockAllocationsMap: Map<number, StockAllocation>;
  private stockMovementsMap: Map<number, StockMovement>;
  private requestsMap: Map<number, InventoryRequest>;
  private requestItemsMap: Map<number, RequestItem>;

  private userIdCounter: number;
  private categoryIdCounter: number;
  private specialtyIdCounter: number;
  private stockItemIdCounter: number;
  private stockAllocationIdCounter: number;
  private stockMovementIdCounter: number;
  private requestIdCounter: number;
  private requestItemIdCounter: number;

  sessionStore: SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.categoriesMap = new Map();
    this.specialtiesMap = new Map();
    this.stockItemsMap = new Map();
    this.stockAllocationsMap = new Map();
    this.stockMovementsMap = new Map();
    this.requestsMap = new Map();
    this.requestItemsMap = new Map();

    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.specialtyIdCounter = 1;
    this.stockItemIdCounter = 1;
    this.stockAllocationIdCounter = 1;
    this.stockMovementIdCounter = 1;
    this.requestIdCounter = 1;
    this.requestItemIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every day
    }) as SessionStore;

    // Initialize with default categories
    this.initializeData();
  }

  // Initialize with some default data
  private async initializeData() {
    // Add default categories
    const defaultCategories = [
      { name: 'Brochures', color: 'bg-blue-500' },
      { name: 'Samples', color: 'bg-green-500' },
      { name: 'Gifts', color: 'bg-purple-500' },
      { name: 'Banners', color: 'bg-yellow-500' },
      { name: 'Digital Media', color: 'bg-indigo-500' },
      { name: 'Other', color: 'bg-gray-500' }
    ];

    for (const category of defaultCategories) {
      await this.createCategory(category);
    }

    // Add default specialties
    const defaultSpecialties = [
      { name: 'CNS', description: 'Central Nervous System' },
      { name: 'Primary Care 1', description: 'Primary Care Group 1' },
      { name: 'Primary Care 2', description: 'Primary Care Group 2' },
      { name: 'GIT', description: 'Gastrointestinal Tract' },
      { name: 'Specialty', description: 'Specialty Products' },
      { name: 'OTC', description: 'Over The Counter' }
    ];

    for (const specialty of defaultSpecialties) {
      await this.createSpecialty(specialty);
    }
  }

  // Specialty operations
  async getSpecialties(): Promise<Specialty[]> {
    return Array.from(this.specialtiesMap.values());
  }

  async getSpecialty(id: number): Promise<Specialty | undefined> {
    return this.specialtiesMap.get(id);
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const id = this.specialtyIdCounter++;
    const timestamp = new Date();
    const newSpecialty: Specialty = { 
      ...specialty, 
      id, 
      createdAt: timestamp,
      description: specialty.description || null,
    };
    this.specialtiesMap.set(id, newSpecialty);
    return newSpecialty;
  }

  async updateSpecialty(id: number, specialtyData: Partial<Specialty>): Promise<Specialty | undefined> {
    const specialty = this.specialtiesMap.get(id);
    if (!specialty) return undefined;

    const updatedSpecialty = { ...specialty, ...specialtyData };
    this.specialtiesMap.set(id, updatedSpecialty);
    return updatedSpecialty;
  }

  async deleteSpecialty(id: number): Promise<boolean> {
    return this.specialtiesMap.delete(id);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.usersMap.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async getUsersByRole(role: RoleType): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(user => user.role === role);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: timestamp,
      region: user.region || null,
      avatar: user.avatar || null,
      specialtyId: user.specialtyId || null,
    };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesMap.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categoriesMap.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categoriesMap.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categoriesMap.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...categoryData };
    this.categoriesMap.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categoriesMap.delete(id);
  }

  async getStockItemsByCategory(categoryId: number): Promise<StockItem[]> {
    return Array.from(this.stockItemsMap.values())
      .filter(item => item.categoryId === categoryId);
  }

  // Stock item operations
  async getStockItems(): Promise<StockItem[]> {
    return Array.from(this.stockItemsMap.values());
  }

  async getStockItem(id: number): Promise<StockItem | undefined> {
    return this.stockItemsMap.get(id);
  }

  async createStockItem(item: InsertStockItem): Promise<StockItem> {
    const id = this.stockItemIdCounter++;
    const timestamp = new Date();
    const newItem: StockItem = { 
      ...item, 
      id, 
      createdAt: timestamp,
      specialtyId: item.specialtyId || null,
      expiry: item.expiry || null,
      uniqueNumber: item.uniqueNumber || null,
      imageUrl: item.imageUrl || null,
      notes: item.notes || null,
    };
    this.stockItemsMap.set(id, newItem);
    return newItem;
  }

  async updateStockItem(id: number, itemData: Partial<StockItem>): Promise<StockItem | undefined> {
    const item = this.stockItemsMap.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...itemData };
    this.stockItemsMap.set(id, updatedItem);
    return updatedItem;
  }

  async deleteStockItem(id: number): Promise<boolean> {
    return this.stockItemsMap.delete(id);
  }

  async getExpiringItems(daysThreshold: number): Promise<StockItem[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return Array.from(this.stockItemsMap.values())
      .filter(item => item.expiry && new Date(item.expiry) <= thresholdDate);
  }

  // Stock allocation operations
  async getAllocations(userId?: number): Promise<StockAllocation[]> {
    const allAllocations = Array.from(this.stockAllocationsMap.values());
    return userId 
      ? allAllocations.filter(allocation => allocation.userId === userId)
      : allAllocations;
  }

  async createAllocation(allocation: InsertStockAllocation): Promise<StockAllocation> {
    const id = this.stockAllocationIdCounter++;
    const timestamp = new Date();
    const newAllocation: StockAllocation = { 
      ...allocation, 
      id, 
      allocatedAt: timestamp 
    };
    this.stockAllocationsMap.set(id, newAllocation);
    return newAllocation;
  }

  async updateAllocation(id: number, allocationData: Partial<StockAllocation>): Promise<StockAllocation | undefined> {
    const allocation = this.stockAllocationsMap.get(id);
    if (!allocation) return undefined;

    const updatedAllocation = { ...allocation, ...allocationData };
    this.stockAllocationsMap.set(id, updatedAllocation);
    return updatedAllocation;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    return this.stockAllocationsMap.delete(id);
  }

  // Stock movement operations
  async getMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovementsMap.values());
  }

  async createMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const id = this.stockMovementIdCounter++;
    const timestamp = new Date();
    const newMovement: StockMovement = { 
      ...movement, 
      id, 
      movedAt: timestamp,
      fromUserId: movement.fromUserId || null,
      notes: movement.notes || null,
    };
    this.stockMovementsMap.set(id, newMovement);
    return newMovement;
  }

  // Request operations
  async getRequests(): Promise<InventoryRequest[]> {
    return Array.from(this.requestsMap.values());
  }

  async getRequest(id: number): Promise<InventoryRequest | undefined> {
    return this.requestsMap.get(id);
  }

  async createRequest(request: InsertInventoryRequest): Promise<InventoryRequest> {
    const id = this.requestIdCounter++;
    const newRequest: InventoryRequest = { 
      ...request, 
      id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      description: request.description ?? null,
      notes: null,
      assignedTo: request.assignedTo ?? null,
      fileUrl: request.fileUrl ?? null,
      requestData: request.requestData ?? null,
      finalAssignee: request.finalAssignee ?? null,
      secondaryApprover: request.secondaryApprover ?? null,
      secondaryNotes: null,
      shareFromUserId: 'shareFromUserId' in request ? (request as any).shareFromUserId : null,
      shareToUserId: 'shareToUserId' in request ? (request as any).shareToUserId : null
    };
    this.requestsMap.set(id, newRequest);
    return newRequest;
  }

  async updateRequest(id: number, requestData: Partial<InventoryRequest>): Promise<InventoryRequest | undefined> {
    const existingRequest = this.requestsMap.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { 
      ...existingRequest, 
      ...requestData,
      updatedAt: new Date()
    };
    this.requestsMap.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteRequest(id: number): Promise<boolean> {
    return this.requestsMap.delete(id);
  }

  async getRequestItems(requestId: number): Promise<RequestItem[]> {
    return Array.from(this.requestItemsMap.values()).filter(item => item.requestId === requestId);
  }

  async createRequestItem(item: InsertRequestItem): Promise<RequestItem> {
    const id = this.requestItemIdCounter++;
    const newItem: RequestItem = { 
      ...item, 
      id,
      notes: item.notes ?? null,
      stockItemId: item.stockItemId ?? null,
      itemName: item.itemName ?? null
    };
    this.requestItemsMap.set(id, newItem);
    return newItem;
  }

  async approveRequest(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    return this.updateRequest(id, { 
      status: "approved", 
      notes,
      completedAt: new Date()
    });
  }

  async denyRequest(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    return this.updateRequest(id, { 
      status: "denied", 
      notes,
      completedAt: new Date()
    });
  }

  async approveAndForward(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    const request = await this.getRequest(id);
    if (!request) return undefined;

    // For inventory sharing: PM2 approves and forwards to Stock Keeper
    if (request.type === 'inventory_share' && request.finalAssignee) {
      return this.updateRequest(id, {
        status: "pending_secondary",
        secondaryNotes: notes,
        assignedTo: request.finalAssignee, // Move to Stock Keeper
      });
    }

    // For other types, just approve
    return this.approveRequest(id, notes);
  }

async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
  // Fetch existing user asynchronously
  const user = await this.getUser(id);
  if (!user) return undefined;

  // Update only provided fields in user
  Object.assign(user, userData);

  // Update the map or data storage with new user info
  this.usersMap.set(id, user);

  return user;
}

  async hasPermission(userId: number, permission: keyof typeof ROLE_PERMISSIONS.ceo): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const role = user.role as RoleType;
    return ROLE_PERMISSIONS[role][permission] === true;
  }

  async getSystemSettings(): Promise<any> {
    return {};
  }

  async updateSystemSettings(settings: any): Promise<void> {
    // Memory implementation - settings not persisted
  }

  async executeStockMovementTransaction(args: {
    stockItemId: number;
    fromUserId?: number | null;
    toUserId?: number | null;
    quantity: number;
    notes?: string;
    movedBy: number;
  }): Promise<StockMovement> {
    const movement = await this.createMovement({
      stockItemId: args.stockItemId,
      fromUserId: args.fromUserId ?? null,
      toUserId: args.toUserId ?? 1, // Default to admin user if not specified
      quantity: args.quantity,
      notes: args.notes ?? null,
      movedBy: args.movedBy,
    });
    return movement;
  }

  // Final approval method for MemStorage
  async finalApprove(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    const request = this.requestsMap.get(id);
    if (!request) return undefined;

    if (request.type === 'inventory_share' && request.status === "pending_secondary") {
      // For MemStorage, just complete the approval
      const updatedRequest = {
        ...request,
        status: "approved" as const,
        notes: notes || null,
        completedAt: new Date(),
        updatedAt: new Date(),
      };
      this.requestsMap.set(id, updatedRequest);
      return updatedRequest;
    }

    return this.approveRequest(id, notes);
  }

  async getActiveRoles(): Promise<string[]> {
    // For MemStorage, return default roles
    return ['ceo', 'admin', 'productManager', 'stockKeeper'];
  }

  async updateActiveRoles(roles: string[]): Promise<void> {
    // For MemStorage, this is a no-op since it's in-memory
    console.log('Active roles updated (MemStorage):', roles);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  private systemSettings: Map<string, any>;

  constructor() {
    // Use memory store for sessions to avoid connection timeout issues
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    }) as SessionStore;
    this.systemSettings = new Map();
    this.initializeData();
  }

  // System settings methods
  async getSystemSettings(): Promise<any> {
    return Object.fromEntries(this.systemSettings);
  }

  async updateSystemSettings(settings: any): Promise<void> {
    Object.entries(settings).forEach(([key, value]) => {
      this.systemSettings.set(key, value);
    });
  }

  async getActiveRoles(): Promise<string[]> {
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, 'activeRoles'))
        .limit(1);
      
      if (setting) {
        return JSON.parse(setting.value);
      }
      
      // Default active roles if not set
      return ['ceo', 'admin', 'productManager', 'stockKeeper'];
    } catch (error) {
      console.error('Error getting active roles:', error);
      return ['ceo', 'admin', 'productManager', 'stockKeeper'];
    }
  }

  async updateActiveRoles(roles: string[]): Promise<void> {
    try {
      await db
        .insert(systemSettings)
        .values({
          key: 'activeRoles',
          value: JSON.stringify(roles),
        });
    } catch (error) {
      // If insert fails due to conflict, update existing record
      try {
        await db
          .update(systemSettings)
          .set({
            value: JSON.stringify(roles),
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.key, 'activeRoles'));
      } catch (updateError) {
        console.error('Error updating active roles:', updateError);
        throw updateError;
      }
    }
  }

  // Initialize with default data if needed
  private async initializeData() {
    try {
      // Test database connection first
      await db.select().from(categories).limit(1);

      const existingCategories = await this.getCategories();

      // Only initialize if no categories exist
      if (existingCategories.length === 0) {
      // Add default categories
      const defaultCategories = [
        { name: 'Brochures', color: 'bg-blue-500' },
        { name: 'Samples', color: 'bg-green-500' },
        { name: 'Gifts', color: 'bg-purple-500' },
        { name: 'Banners', color: 'bg-yellow-500' },
        { name: 'Digital Media', color: 'bg-indigo-500' },
        { name: 'Other', color: 'bg-gray-500' }
      ];

      for (const category of defaultCategories) {
        await this.createCategory(category);
      }
    }

    const existingSpecialties = await this.getSpecialties();

    // Only initialize if no specialties exist
    if (existingSpecialties.length === 0) {
      // Add default specialties
      const defaultSpecialties = [
        { name: 'CNS', description: 'Central Nervous System' },
        { name: 'Primary Care 1', description: 'Primary Care Group 1' },
        { name: 'Primary Care 2', description: 'Primary Care Group 2' },
        { name: 'GIT', description: 'Gastrointestinal Tract' },
        { name: 'Specialty', description: 'Specialty Products' },
        { name: 'OTC', description: 'Over The Counter' }
      ];

      for (const specialty of defaultSpecialties) {
        await this.createSpecialty(specialty);
      }
    }
    } catch (error) {
      console.error('Failed to initialize database data:', error);
      console.warn('The application will continue but some default data may be missing.');
    }
  }

  // Specialty operations
  async getSpecialties(): Promise<Specialty[]> {
    return db.select().from(specialties);
  }

  async getSpecialty(id: number): Promise<Specialty | undefined> {
    const [specialty] = await db.select().from(specialties).where(eq(specialties.id, id));
    return specialty;
  }

  async createSpecialty(specialty: InsertSpecialty): Promise<Specialty> {
    const [newSpecialty] = await db.insert(specialties).values(specialty).returning();
    return newSpecialty;
  }

  async updateSpecialty(id: number, specialtyData: Partial<Specialty>): Promise<Specialty | undefined> {
    const [updatedSpecialty] = await db
      .update(specialties)
      .set(specialtyData)
      .where(eq(specialties.id, id))
      .returning();
    return updatedSpecialty;
  }

  async deleteSpecialty(id: number): Promise<boolean> {
    const result = await db.delete(specialties).where(eq(specialties.id, id)).returning();
    return result.length > 0;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getUsersByRole(role: RoleType): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First, update any requests that reference this user to remove the reference
      await db
        .update(inventoryRequests)
        .set({ 
          assignedTo: null,
          finalAssignee: null,
          secondaryApprover: null,
          shareFromUserId: null,
          shareToUserId: null
        })
        .where(eq(inventoryRequests.assignedTo, id));
      
      await db
        .update(inventoryRequests)
        .set({ finalAssignee: null })
        .where(eq(inventoryRequests.finalAssignee, id));
        
      await db
        .update(inventoryRequests)
        .set({ secondaryApprover: null })
        .where(eq(inventoryRequests.secondaryApprover, id));
        
      await db
        .update(inventoryRequests)
        .set({ shareFromUserId: null })
        .where(eq(inventoryRequests.shareFromUserId, id));
        
      await db
        .update(inventoryRequests)
        .set({ shareToUserId: null })
        .where(eq(inventoryRequests.shareToUserId, id));

      // Then delete the user
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async getStockItemsByCategory(categoryId: number): Promise<StockItem[]> {
    return db.select().from(stockItems).where(eq(stockItems.categoryId, categoryId));
  }

  // Stock item operations
  async getStockItems(): Promise<StockItem[]> {
    return db.select().from(stockItems);
  }

  async getStockItem(id: number): Promise<StockItem | undefined> {
    const [item] = await db.select().from(stockItems).where(eq(stockItems.id, id));
    return item;
  }

  async createStockItem(item: InsertStockItem): Promise<StockItem> {
    // Create a clean data object to ensure proper date handling
    const cleanData: InsertStockItem = { ...item };

    // Handle expiry date explicitly if it exists
    if (cleanData.expiry !== undefined) {
      try {
        if (typeof cleanData.expiry === 'string') {
          // Convert string date to Date object
          cleanData.expiry = new Date(cleanData.expiry);
        }
      } catch (e) {
        console.error("Failed to parse expiry date:", e);
        // If conversion fails, we'll keep the original value
      }
    }

    const [newItem] = await db.insert(stockItems).values(cleanData).returning();
    return newItem;
  }

  async updateStockItem(id: number, itemData: Partial<StockItem>): Promise<StockItem | undefined> {
    // Create a clean data object to ensure proper date handling
    const cleanData: Partial<StockItem> = { ...itemData };

    // Handle expiry date explicitly - convert to a proper Date object if it's a string
    if (cleanData.expiry !== undefined) {
      try {
        if (typeof cleanData.expiry === 'string') {
          // Convert string date to Date object
          cleanData.expiry = new Date(cleanData.expiry);
        }
      } catch (e) {
        console.error("Failed to parse expiry date:", e);
        delete cleanData.expiry; // Remove the invalid field
      }
    }

    const [updatedItem] = await db
      .update(stockItems)
      .set(cleanData)
      .where(eq(stockItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteStockItem(id: number): Promise<boolean> {
    const result = await db.delete(stockItems).where(eq(stockItems.id, id)).returning();
    return result.length > 0;
  }

  async getExpiringItems(daysThreshold: number): Promise<StockItem[]> {
    const thresholdDate = addDays(new Date(), daysThreshold);

    // Get all items and filter manually
    const items = await db.select().from(stockItems);

    // Filter items that have expiry dates less than or equal to threshold date
    return items.filter(item => 
      item.expiry !== null && 
      new Date(item.expiry) <= thresholdDate
    );
  }

  // Stock allocation operations
  async getAllocations(userId?: number): Promise<StockAllocation[]> {
    if (userId) {
      return db
        .select()
        .from(stockAllocations)
        .where(eq(stockAllocations.userId, userId));
    }
    return db.select().from(stockAllocations);
  }

  async createAllocation(allocation: InsertStockAllocation): Promise<StockAllocation> {
    const [newAllocation] = await db
      .insert(stockAllocations)
      .values(allocation)
      .returning();
    return newAllocation;
  }

  async updateAllocation(id: number, allocationData: Partial<StockAllocation>): Promise<StockAllocation | undefined> {
    const [updatedAllocation] = await db
      .update(stockAllocations)
      .set(allocationData)
      .where(eq(stockAllocations.id, id))
      .returning();
    return updatedAllocation;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    const result = await db
      .delete(stockAllocations)
      .where(eq(stockAllocations.id, id))
      .returning();
    return result.length > 0;
  }

  // Stock movement operations
  async getMovements(): Promise<StockMovement[]> {
    return db.select().from(stockMovements);
  }

  async createMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const [newMovement] = await db
      .insert(stockMovements)
      .values(movement)
      .returning();
    return newMovement;
  }

  // Permission check
  async hasPermission(userId: number, permission: keyof typeof ROLE_PERMISSIONS.ceo): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const role = user.role as RoleType;
    return ROLE_PERMISSIONS[role][permission] === true;
  }

  async executeStockMovementTransaction(args: {
    stockItemId: number;
    quantity: number;
    fromUserId?: number | null;
    toUserId: number;
    movedBy: number;
    notes?: string | undefined;
  }): Promise<StockMovement> {
    const { stockItemId, quantity, fromUserId, toUserId, movedBy, notes } = args;

    if (quantity <= 0) {
      throw new Error("Movement quantity must be positive.");
    }

    return db.transaction(async (tx) => {
      // a. Fetch the stockItem
      const [item] = await tx
        .select()
        .from(stockItems)
        .where(eq(stockItems.id, stockItemId));

      if (!item) {
        throw new Error(`Stock item with ID ${stockItemId} not found.`);
      }

      // b. If fromUserId is null/undefined (movement from central inventory)
      if (fromUserId == null) {
        // i. Calculate how much is available in central inventory
        const totalAllocatedResult = await tx
          .select({ total: sum(stockAllocations.quantity) })
          .from(stockAllocations)
          .where(eq(stockAllocations.stockItemId, stockItemId));
        
        const allocatedQuantity = totalAllocatedResult[0]?.total || 0;
        const availableInCentral = item.quantity - Number(allocatedQuantity);
        
        if (availableInCentral < quantity) {
          throw new Error(
            `Not enough stock available in central inventory for item ID ${stockItemId}. Available: ${availableInCentral}, Requested: ${quantity}`
          );
        }
        // NOTE: We don't reduce the total quantity in stock_items - it stays constant
        // The allocation system handles tracking what's available vs allocated
      } else {
        // c. If fromUserId is provided (movement from a user)
        // i. Fetch the source user's allocation
        const [sourceAllocation] = await tx
          .select()
          .from(stockAllocations)
          .where(
            and(
              eq(stockAllocations.userId, fromUserId),
              eq(stockAllocations.stockItemId, stockItemId)
            )
          );

        // ii. Check if the source allocation exists and has enough quantity
        if (!sourceAllocation || sourceAllocation.quantity < quantity) {
          throw new Error(
            `Source user ID ${fromUserId} does not have enough allocated stock of item ID ${stockItemId}. Available: ${sourceAllocation?.quantity || 0}, Requested: ${quantity}`
          );
        }
        // iii. Update the source user's allocation (reduce their allocation)
        const newSourceQuantity = sourceAllocation.quantity - quantity;
        if (newSourceQuantity === 0) {
          // Remove allocation if quantity becomes 0
          await tx
            .delete(stockAllocations)
            .where(eq(stockAllocations.id, sourceAllocation.id));
        } else {
          await tx
            .update(stockAllocations)
            .set({ quantity: newSourceQuantity })
            .where(eq(stockAllocations.id, sourceAllocation.id));
        }
      }

      // d. Update/Create Target User's Allocation
      // i. Fetch the target user's existing allocation
      const [targetAllocation] = await tx
        .select()
        .from(stockAllocations)
        .where(
          and(
            eq(stockAllocations.userId, toUserId),
            eq(stockAllocations.stockItemId, stockItemId)
          )
        );

      if (targetAllocation) {
        // ii. If it exists, update it (increase their allocation)
        await tx
          .update(stockAllocations)
          .set({ quantity: targetAllocation.quantity + quantity })
          .where(eq(stockAllocations.id, targetAllocation.id));
      } else {
        // iii. If it doesn't exist, create it
        await tx.insert(stockAllocations).values({
          userId: toUserId,
          stockItemId: stockItemId,
          quantity: quantity,
          allocatedBy: movedBy,
          allocatedAt: new Date(),
        });
      }

      // e. Create the stock movement record
      const [newMovement] = await tx
        .insert(stockMovements)
        .values({
          stockItemId,
          fromUserId: fromUserId,
          toUserId,
          quantity,
          movedBy,
          notes: notes,
          movedAt: new Date(),
        })
        .returning();

      return newMovement;
    });
  }

  // Request operations for DatabaseStorage
  async getRequests(): Promise<InventoryRequest[]> {
    return await db.select().from(inventoryRequests);
  }

  async getRequest(id: number): Promise<InventoryRequest | undefined> {
    const result = await db
      .select()
      .from(inventoryRequests)
      .where(eq(inventoryRequests.id, id))
      .limit(1);
    return result[0];
  }

  async createRequest(request: InsertInventoryRequest): Promise<InventoryRequest> {
    const [newRequest] = await db
      .insert(inventoryRequests)
      .values({
        ...request,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newRequest;
  }

  async updateRequest(id: number, requestData: Partial<InventoryRequest>): Promise<InventoryRequest | undefined> {
    const cleanData = { ...requestData };
    
    // Handle date fields properly
    if (cleanData.completedAt && typeof cleanData.completedAt === 'string') {
      cleanData.completedAt = new Date(cleanData.completedAt);
    }
    if (cleanData.createdAt && typeof cleanData.createdAt === 'string') {
      cleanData.createdAt = new Date(cleanData.createdAt);
    }
    
    const [updatedRequest] = await db
      .update(inventoryRequests)
      .set({
        ...cleanData,
        updatedAt: new Date(),
      })
      .where(eq(inventoryRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteRequest(id: number): Promise<boolean> {
    const result = await db
      .delete(inventoryRequests)
      .where(eq(inventoryRequests.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRequestItems(requestId: number): Promise<RequestItem[]> {
    return await db
      .select()
      .from(requestItems)
      .where(eq(requestItems.requestId, requestId));
  }

  async createRequestItem(item: InsertRequestItem): Promise<RequestItem> {
    const [newItem] = await db
      .insert(requestItems)
      .values(item)
      .returning();
    return newItem;
  }

  async approveRequest(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    const request = await this.getRequest(id);
    if (!request) return undefined;

    // For direct approval (prepare_order, receive_inventory)
    if (request.type === "prepare_order" || request.type === "receive_inventory") {
      // Transfer inventory to requester
      await this.processInventoryTransfer(request);
      
      return this.updateRequest(id, {
        status: "approved",
        notes,
        completedAt: new Date(),
      });
    }

    // For inventory sharing - this should go to pending_secondary first
    if (request.type === "inventory_share") {
      return this.updateRequest(id, {
        status: "pending_secondary",
        notes,
      });
    }

    return this.updateRequest(id, {
      status: "approved",
      notes,
      completedAt: new Date(),
    });
  }

  async denyRequest(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    return this.updateRequest(id, {
      status: "denied", 
      notes,
      completedAt: new Date(),
    });
  }

  // Process inventory transfer when request is approved
  async processInventoryTransfer(request: InventoryRequest): Promise<void> {
    // Get all request items
    const requestItems = await this.getRequestItems(request.id);
    
    for (const item of requestItems) {
      if (item.stockItemId && item.quantity) {
        try {
          // For prepare_order requests, first try to transfer from central inventory
          // If that fails, create a new allocation for the requester
          if (request.type === "prepare_order") {
            try {
              // Try to transfer from central inventory first
              await this.executeStockMovementTransaction({
                stockItemId: item.stockItemId,
                fromUserId: null, // Central inventory
                toUserId: request.requestedBy,
                quantity: item.quantity,
                notes: `Approved request: ${request.title}`,
                movedBy: request.assignedTo || 1
              });
              console.log(`Successfully transferred ${item.quantity} units of item ${item.stockItemId} from central inventory for request ${request.id}`);
            } catch (centralError) {
              // If central inventory doesn't have enough, create a direct allocation
              console.log(`Central inventory insufficient, creating direct allocation for request ${request.id}`);
              
              // Check if user already has allocation for this item
              const existingAllocation = await db
                .select()
                .from(stockAllocations)
                .where(
                  and(
                    eq(stockAllocations.userId, request.requestedBy),
                    eq(stockAllocations.stockItemId, item.stockItemId)
                  )
                )
                .limit(1);
              
              if (existingAllocation.length > 0) {
                // Update existing allocation
                await db
                  .update(stockAllocations)
                  .set({ quantity: existingAllocation[0].quantity + item.quantity })
                  .where(eq(stockAllocations.id, existingAllocation[0].id));
              } else {
                // Create new allocation
                await db.insert(stockAllocations).values({
                  userId: request.requestedBy,
                  stockItemId: item.stockItemId,
                  quantity: item.quantity,
                  allocatedBy: request.assignedTo || 1,
                  allocatedAt: new Date(),
                });
              }
              
              // Create movement record
              await db.insert(stockMovements).values({
                stockItemId: item.stockItemId,
                fromUserId: null,
                toUserId: request.requestedBy,
                quantity: item.quantity,
                movedBy: request.assignedTo || 1,
                notes: `Approved request (direct allocation): ${request.title}`,
                movedAt: new Date(),
              });
              
              console.log(`Successfully created direct allocation of ${item.quantity} units for item ${item.stockItemId} for request ${request.id}`);
            }
          } else if (request.type === "inventory_share") {
            // For inventory sharing, transfer from one user to another
            await this.executeStockMovementTransaction({
              stockItemId: item.stockItemId,
              fromUserId: request.shareFromUserId,
              toUserId: request.requestedBy,
              quantity: item.quantity,
              notes: `Approved request: ${request.title}`,
              movedBy: request.assignedTo || 1
            });
            console.log(`Successfully transferred ${item.quantity} units of item ${item.stockItemId} for inventory sharing request ${request.id}`);
          }
        } catch (error) {
          console.error(`Failed to transfer stock item ${item.stockItemId}:`, error);
          // Continue with other items even if one fails
        }
      }
    }
  }

  async approveAndForward(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    const request = await this.getRequest(id);
    if (!request) return undefined;

    // For inventory sharing: PM2 approves and forwards to Stock Keeper
    if (request.type === 'inventory_share' && request.finalAssignee) {
      return this.updateRequest(id, {
        status: "pending_secondary",
        secondaryNotes: notes,
        assignedTo: request.finalAssignee, // Move to Stock Keeper
      });
    }

    // For other types, just approve
    return this.approveRequest(id, notes);
  }

  // Final approval method for stock keepers (2-step approval)
  async finalApprove(id: number, notes?: string): Promise<InventoryRequest | undefined> {
    const request = await this.getRequest(id);
    if (!request) return undefined;

    if (request.type === 'inventory_share' && request.status === "pending_secondary") {
      // Process inventory transfer and complete
      await this.processInventoryTransfer(request);
      return this.updateRequest(id, {
        status: "approved",
        notes,
        completedAt: new Date(),
      });
    }

    return this.approveRequest(id, notes);
  }
}

// Use the database storage for production with fallback
let storage: IStorage;

try {
  storage = new DatabaseStorage();
} catch (error) {
  console.error('Failed to initialize database storage, falling back to memory storage:', error);
  storage = new MemStorage();
}

export { storage };