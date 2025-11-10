import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import documentRoutes from "./routes/documents";
import translationRoutes from "./routes/translations";
import healthRoutes from "./routes/health";
import consentRoutes from "./routes/consents";
import clinicRoutes from "./routes/clinics";
import emergencyRoutes from "./routes/emergency";
import adminRoutes from "./routes/admin";
import nomineeRoutes from "./routes/nominees";
import medicationRoutes from "./routes/medications";
import pushNotificationRoutes from "./routes/pushNotifications";
import chatbotRoutes from "./routes/chatbot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes
  // All routes are prefixed with /api

  // Authentication routes
  app.use("/api/auth", authRoutes);

  // User profile routes
  app.use("/api/user", userRoutes);

  // Document routes
  app.use("/api/documents", documentRoutes);

  // Health insights routes
  app.use("/api/health", healthRoutes);

  // Consent routes
  app.use("/api/consents", consentRoutes);

  // Clinics routes (public, no auth required for location-based search)
  app.use("/api/clinics", clinicRoutes);

  // Emergency routes (some endpoints are public for QR viewing)
  app.use("/api/emergency", emergencyRoutes);

  // Translation routes (public, no auth required)
  app.use("/api/translations", translationRoutes);

  // Admin routes (for setup/maintenance)
  app.use("/api/admin", adminRoutes);

  // Nominee routes (requires authentication)
  app.use("/api/nominees", nomineeRoutes);

  // Medication routes (requires authentication)
  app.use("/api/medications", medicationRoutes);

  // Push notification routes (requires authentication)
  app.use("/api/push", pushNotificationRoutes);

  // Chatbot routes (requires authentication)
  app.use("/api/chatbot", chatbotRoutes);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
