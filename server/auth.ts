import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SharedUser, ROLE_PERMISSIONS } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

declare global {
  namespace Express {
    interface User extends SharedUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Configure multer storage for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

export const upload = multer({
  storage: storage_config,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    // Accept images, Excel files, and CSV files
    const allowedMimes = [
      'image/',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/csv'
    ];
    
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime) || file.mimetype === mime);
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only image files, Excel files, and CSV files are allowed'));
    }
  }
});

// Export for use in other modules
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(plaintext: string, hash: string): Promise<boolean> {
  try {
    // Handle case where password is not properly hashed (legacy plain text)
    if (!hash || !hash.includes('.')) {
      console.warn('Password appears to be in plain text format, which is insecure');
      // For security, we should not allow plain text comparison in production
      // but for development/migration purposes, we'll temporarily allow it
      return plaintext === hash;
    }

    const [hashed, salt] = hash.split('.');

    if (!salt || !hashed) {
      console.error('Missing salt or hash component');
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(plaintext, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret || sessionSecret.trim() === "") {
    throw new Error(
      "CRITICAL ERROR: SESSION_SECRET is not defined in environment variables. " +
      "This secret is required for application security. Please set it to a long, random string."
    );
  }

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Permission middleware for checking role-based permissions
  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS.ceo) => {
    return async (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // CEO always has all permissions
      if ((req.user as SharedUser).role === 'ceo') {
        return next();
      }

      const hasPermission = await storage.hasPermission((req.user as SharedUser).id, permission);
      if (hasPermission) {
        return next();
      }

      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    };
  };

  // Authentication routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, role, region, specialtyId } = req.body;

      if (!username || !password || !name || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Handle specialtyId conversion
      let processedSpecialtyId = null;
      if (specialtyId && specialtyId !== "" && specialtyId !== "0") {
        processedSpecialtyId = typeof specialtyId === 'string' ? parseInt(specialtyId) : specialtyId;
      }

      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        role,
        region: region || null,
        specialtyId: processedSpecialtyId,
      });

      // Remove password from response
      const { password: _, ...safeUser } = user;

      res.status(201).json(safeUser);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error | null, user: SharedUser | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Login failed" });

      // Check if password needs to be rehashed (plain text passwords)
      if (user.password && !user.password.includes('.')) {
        console.log('Rehashing plain text password for user:', user.username);
        const hashedPassword = await hashPassword(user.password);
        await storage.updateUser(user.id, { password: hashedPassword });
        user.password = hashedPassword;
      }

      req.login(user, (loginErr) => { // Renamed err to loginErr to avoid conflict
        if (loginErr) return next(loginErr);

        // User is now guaranteed to be a SharedUser object here, not false
        const { password, ...userWithoutPassword } = user; 
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as SharedUser;
    res.json(userWithoutPassword);
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = { ...req.body };

      // If password is being updated, hash it first
      if (updateData.password) {
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

  return { isAuthenticated, hasPermission };
}