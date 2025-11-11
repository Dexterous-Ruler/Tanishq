/**
 * Session Service
 * Handles user session creation, validation, and management
 */

import { Request, Response } from "express";
import { storage } from "../storage";
import { config } from "../config";
import { randomBytes } from "crypto";

/**
 * Create a new user session
 * @param userId - User ID to create session for
 * @param req - Express request object
 * @returns Session token
 */
export async function createUserSession(
  userId: string,
  req: Request
): Promise<string> {
  console.log(`[SessionService] ========== createUserSession CALLED ==========`);
  console.log(`[SessionService] UserId: ${userId}`);
  console.log(`[SessionService] Request session ID: ${req.sessionID}`);
  console.log(`[SessionService] Request has session: ${!!req.session}`);
  console.log(`[SessionService] Existing session data:`, {
    hasUserId: !!req.session.userId,
    hasToken: !!req.session.token,
  });
  
  // Generate a new session token for our custom storage
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.session.maxAge);

  console.log(`[SessionService] Creating session for user ${userId}`);
  console.log(`[SessionService] Token: ${token.substring(0, 8)}...`);
  console.log(`[SessionService] Expires at: ${expiresAt.toISOString()}`);

  // Create session in our custom storage (Supabase) first
  try {
    console.log(`[SessionService] Saving session to Supabase storage...`);
    await storage.createSession(userId, token, config.session.maxAge);
    console.log(`[SessionService] ✅ Session saved to Supabase storage`);
  } catch (storageError: any) {
    console.error(`[SessionService] ❌ Failed to save session to Supabase storage:`, storageError);
    throw new Error(`Failed to save session to storage: ${storageError.message}`);
  }

  // Set session data in express-session
  // IMPORTANT: These values will be serialized as JSON and stored in PostgreSQL session table
  // The session store (connect-pg-simple) handles serialization/deserialization automatically
  req.session.userId = userId;
  req.session.token = token;
  
  // Mark session as modified so express-session knows to save it
  req.session.touch();
  
  console.log(`[SessionService] Session data set in req.session:`, {
    userId: req.session.userId,
    token: req.session.token ? `${req.session.token.substring(0, 8)}...` : 'missing',
    sessionId: req.sessionID,
    cookieName: config.session.cookieName,
  });

  // CRITICAL: Save the session to PostgreSQL store
  // This will:
  // 1. Serialize session data (userId, token) to JSON
  // 2. Store it in PostgreSQL session table with the session ID
  // 3. Set the session ID cookie in the response (when response is sent)
  return new Promise<string>((resolve, reject) => {
    console.log(`[SessionService] Saving express-session to PostgreSQL store...`);
    req.session.save((err) => {
      if (err) {
        console.error(`[SessionService] ❌ Express session save error:`, err);
        console.error(`[SessionService] Error details:`, err.message, err.stack);
        reject(err);
        return;
      }
      
      // Session saved successfully to PostgreSQL
      console.log(`[SessionService] ✅ Express session saved to PostgreSQL store`);
      console.log(`[SessionService] Session ID: ${req.sessionID}`);
      console.log(`[SessionService] Session cookie name: ${config.session.cookieName}`);
      console.log(`[SessionService] Cookie will be set when response is sent`);
      
      // Verify session data is still in req.session after save
      // This confirms the data is ready to be serialized
      const sessionData = {
        hasUserId: !!req.session.userId,
        hasToken: !!req.session.token,
        userId: req.session.userId,
        token: req.session.token ? `${req.session.token.substring(0, 8)}...` : 'missing',
      };
      console.log(`[SessionService] Verified session data after save:`, sessionData);
      
      // Double-check: If session data is missing, something went wrong
      if (!req.session.userId || !req.session.token) {
        console.error(`[SessionService] ⚠️  WARNING: Session data missing after save!`);
        console.error(`[SessionService] This indicates a serialization issue`);
        reject(new Error("Session data lost during save"));
        return;
      }
      
      console.log(`[SessionService] ✅ Session creation complete - ready to set cookie`);
      resolve(token);
    });
  });
}

/**
 * Get user ID from session
 * @param req - Express request object
 * @returns User ID or null if not authenticated
 */
export async function getSessionUser(req: Request): Promise<string | null> {
  console.log(`[SessionService] Getting session user...`);
  console.log(`[SessionService] Session ID: ${req.sessionID}`);
  console.log(`[SessionService] Session data:`, {
    userId: req.session.userId || 'missing',
    token: req.session.token ? `${req.session.token.substring(0, 8)}...` : 'missing'
  });
  console.log(`[SessionService] Cookies in request:`, req.headers.cookie ? 'yes' : 'no');
  
  const token = req.session.token;
  if (!token) {
    console.log(`[SessionService] ❌ No token in req.session`);
    return null;
  }

  console.log(`[SessionService] Looking up session in storage for token: ${token.substring(0, 8)}...`);
  // Get session from storage
  const session = await storage.getSession(token);
  if (!session) {
    console.log(`[SessionService] ❌ Session not found in storage`);
    return null;
  }

  console.log(`[SessionService] ✅ Session found, expires at: ${session.expiresAt.toISOString()}`);
  
  // Check if session expired
  const now = new Date();
  if (now > session.expiresAt) {
    console.log(`[SessionService] ❌ Session expired (now: ${now.toISOString()}, expires: ${session.expiresAt.toISOString()})`);
    await storage.deleteSession(token);
    return null;
  }

  // Update last activity
  await storage.updateSessionActivity(token);
  console.log(`[SessionService] ✅ Session valid, userId: ${session.userId}`);

  return session.userId;
}

/**
 * Destroy user session
 * @param req - Express request object
 * @param res - Express response object
 */
export async function destroySession(
  req: Request,
  res: Response
): Promise<void> {
  const token = req.session.token;
  if (token) {
    await storage.deleteSession(token);
  }

  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        reject(err);
      } else {
        res.clearCookie(config.session.cookieName);
        resolve();
      }
    });
  });
}

/**
 * Refresh session expiry
 * @param req - Express request object
 */
export async function refreshSession(req: Request): Promise<void> {
  const token = req.session.token;
  if (token) {
    await storage.updateSessionActivity(token);
  }
}

