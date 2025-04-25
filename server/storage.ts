import { users, categories, stockItems, stockAllocations, stockMovements } from "@shared/schema";
import type { 
  User, InsertUser, 
  Category, InsertCategory,
  StockItem, InsertStockItem,
  StockAllocation, InsertStockAllocation,
  StockMovement, InsertStockMovement,
  RoleType
} from "@shared/schema";
import { ROLE_PERMISSIONS } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, lte, and, isNotNull } from "drizzle-orm";
import { addDays } from "date-fns";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
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
  
  // Session store
  sessionStore: session.SessionStore;
}

// In-memory implementation for development
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private categoriesMap: Map<number, Category>;
  private stockItemsMap: Map<number, StockItem>;
  private stockAllocationsMap: Map<number, StockAllocation>;
  private stockMovementsMap: Map<number, StockMovement>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private stockItemIdCounter: number;
  private stockAllocationIdCounter: number;
  private stockMovementIdCounter: number;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.usersMap = new Map();
    this.categoriesMap = new Map();
    this.stockItemsMap = new Map();
    this.stockAllocationsMap = new Map();
    this.stockMovementsMap = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.stockItemIdCounter = 1;
    this.stockAllocationIdCounter = 1;
    this.stockMovementIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every day
    });
    
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
    const newUser: User = { ...user, id, createdAt: timestamp };
    this.usersMap.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
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
      movedAt: timestamp 
    };
    this.stockMovementsMap.set(id, newMovement);
    return newMovement;
  }
  
  // Permission check
  async hasPermission(userId: number, permission: keyof typeof ROLE_PERMISSIONS.ceo): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    const role = user.role as RoleType;
    return ROLE_PERMISSIONS[role][permission] === true;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    this.initializeData();
  }

  // Initialize with default data if needed
  private async initializeData() {
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
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
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
    const [newItem] = await db.insert(stockItems).values(item).returning();
    return newItem;
  }
  
  async updateStockItem(id: number, itemData: Partial<StockItem>): Promise<StockItem | undefined> {
    const [updatedItem] = await db
      .update(stockItems)
      .set(itemData)
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
}

// Use the database storage for production
export const storage = new DatabaseStorage();
