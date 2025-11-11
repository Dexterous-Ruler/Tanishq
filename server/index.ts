// Load environment variables first
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config } from "./config";
import { reminderScheduler } from "./services/reminderScheduler";
import * as path from "path";

const { Pool } = pg;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Session middleware with PostgreSQL store
// Railway uses a proxy, so we need to trust the proxy for secure cookies
const isProduction = process.env.NODE_ENV === "production";
const trustProxy = process.env.TRUST_PROXY !== "false"; // Default to true in production

if (trustProxy) {
  app.set("trust proxy", 1); // Trust first proxy (Railway's load balancer)
  // Railway passes X-Forwarded-Proto header, so we can detect HTTPS correctly
}

// Middleware to debug protocol detection (for Railway)
app.use((req, res, next) => {
  // Log protocol detection for auth endpoints in production
  if (isProduction && req.path.includes("/auth")) {
    const forwardedProto = req.get('X-Forwarded-Proto');
    const isSecure = req.secure || forwardedProto === 'https';
    console.log(`[Protocol Debug] Path: ${req.path}`);
    console.log(`[Protocol Debug] req.protocol: ${req.protocol}`);
    console.log(`[Protocol Debug] req.secure: ${req.secure}`);
    console.log(`[Protocol Debug] X-Forwarded-Proto: ${forwardedProto || 'not set'}`);
    console.log(`[Protocol Debug] Determined secure: ${isSecure}`);
  }
  next();
});

// Configure PostgreSQL session store
let sessionStore: session.Store;

// Get Supabase PostgreSQL connection string
// Priority: DATABASE_URL > SUPABASE_DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
const useDatabase = process.env.USE_DATABASE === "true";

if (databaseUrl && useDatabase) {
  try {
    // Use PostgreSQL session store (Supabase)
    const PgSession = connectPgSimple(session);
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      // Connection pool settings for better performance
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    });

    sessionStore = new PgSession({
      pool: pool,
      tableName: "session", // Table name for sessions (connect-pg-simple will create it)
      createTableIfMissing: true, // Automatically create table if it doesn't exist
      // Clean up expired sessions every hour
      pruneSessionInterval: 60 * 60, // 1 hour in seconds
    });

    log("✅ Using PostgreSQL session store (Supabase) - Sessions will persist across restarts");
    
    // Test the connection
    pool.query("SELECT NOW()", (err) => {
      if (err) {
        log(`⚠️  PostgreSQL connection test failed: ${err.message}`);
        log("⚠️  Sessions may not persist correctly");
      } else {
        log("✅ PostgreSQL session store connection verified");
      }
    });
  } catch (error: any) {
    log(`❌ Failed to initialize PostgreSQL session store: ${error.message}`);
    log("⚠️  Falling back to MemoryStore (sessions will not persist)");
    log("⚠️  Check DATABASE_URL and USE_DATABASE environment variables");
    sessionStore = new session.MemoryStore();
  }
} else {
  // Fallback to MemoryStore if database not configured
  if (!databaseUrl) {
    log("⚠️  WARNING: DATABASE_URL not set - Using MemoryStore for sessions (not persistent)");
    log("⚠️  Set DATABASE_URL (Supabase PostgreSQL connection string) to use persistent sessions");
  } else if (!useDatabase) {
    log("⚠️  WARNING: USE_DATABASE is not 'true' - Using MemoryStore for sessions (not persistent)");
    log("⚠️  Set USE_DATABASE=true to use persistent sessions");
  }
  sessionStore = new session.MemoryStore();
}

app.use(
  session({
    store: sessionStore,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    name: config.session.cookieName,
    cookie: {
      // Railway always uses HTTPS, so secure should be true in production
      // With trust proxy set, Express will correctly detect HTTPS from X-Forwarded-Proto
      secure: isProduction, // true in production (HTTPS), false in development (HTTP)
      httpOnly: true,
      maxAge: config.session.maxAge,
      // Use "lax" for same-site requests (frontend and backend on same domain)
      // Railway serves everything from the same domain, so "lax" works
      sameSite: "lax",
      // Don't set domain - let browser use current domain (works for Railway)
      // Don't set path - use default "/"
    },
    // Force save even if session wasn't modified
    rolling: true,
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      // Log cookie information for auth endpoints
      if (path.includes("/auth")) {
        const setCookieHeader = res.getHeader('Set-Cookie');
        log(`[Cookie Debug] ${path} - Set-Cookie: ${setCookieHeader ? 'present' : 'missing'}`);
        if (setCookieHeader) {
          const cookieValue = Array.isArray(setCookieHeader) ? setCookieHeader[0] : String(setCookieHeader);
          log(`[Cookie Debug] ${path} - Cookie: ${cookieValue.substring(0, 150)}...`);
          // Check if cookie has Secure flag
          const hasSecure = cookieValue.includes('Secure');
          const hasHttpOnly = cookieValue.includes('HttpOnly');
          const hasSameSite = cookieValue.includes('SameSite');
          log(`[Cookie Debug] ${path} - Cookie flags: Secure=${hasSecure}, HttpOnly=${hasHttpOnly}, SameSite=${hasSameSite}`);
        } else {
          log(`[Cookie Debug] ${path} - ⚠️  NO SET-COOKIE HEADER - Cookie not being set!`);
        }
        log(`[Cookie Debug] ${path} - Request cookies: ${req.headers.cookie || 'none'}`);
        log(`[Cookie Debug] ${path} - Request protocol: ${req.protocol}, secure: ${req.secure}`);
        log(`[Cookie Debug] ${path} - X-Forwarded-Proto: ${req.get('X-Forwarded-Proto') || 'not set'}`);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handler (must be last)
  const { errorHandler } = await import("./middleware/errorHandler");
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    
    // Start reminder scheduler
    reminderScheduler.start();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully...');
    reminderScheduler.stop();
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('SIGINT received, shutting down gracefully...');
    reminderScheduler.stop();
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
})();
