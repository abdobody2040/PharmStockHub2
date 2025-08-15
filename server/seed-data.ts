
import { db } from "./db";
import { users, specialties } from "../shared/schema";
import bcrypt from "bcryptjs";

export async function seedInitialData() {
  try {
    // Check if we already have users
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Users already exist, skipping seed data");
      return;
    }

    // Create default specialties
    const [cnsSpecialty] = await db.insert(specialties).values([
      { name: "CNS", description: "Central Nervous System" },
      { name: "Primary Care", description: "Primary Healthcare" },
      { name: "Cardiology", description: "Cardiovascular Medicine" },
    ]).returning();

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await db.insert(users).values([
      {
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        role: "admin",
        region: "Global",
        specialtyId: null,
      },
      {
        username: "stockkeeper",
        password: await bcrypt.hash("stock123", 10),
        name: "Stock Keeper",
        role: "stockKeeper",
        region: "Main",
        specialtyId: cnsSpecialty.id,
      },
      {
        username: "productmanager",
        password: await bcrypt.hash("product123", 10),
        name: "Product Manager",
        role: "productManager",
        region: "North",
        specialtyId: cnsSpecialty.id,
      },
    ]);

    console.log("Seed data created successfully!");
    console.log("Login credentials:");
    console.log("Admin: username=admin, password=admin123");
    console.log("Stock Keeper: username=stockkeeper, password=stock123");
    console.log("Product Manager: username=productmanager, password=product123");
    
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}
