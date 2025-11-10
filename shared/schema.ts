import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - Extended for OTP-based authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  username: text("username"),
  email: text("email"),
  abhaId: text("abha_id"),
  isGuest: boolean("is_guest").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Keep password for backward compatibility (optional for OTP users)
  password: text("password"),
  // Profile fields
  name: text("name"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // 'male' | 'female' | 'other'
  bloodGroup: text("blood_group"), // 'A+', 'B+', 'O+', etc.
  address: text("address"),
  // Settings (stored as JSON for flexibility)
  settings: text("settings"), // JSON string: { language: 'en' | 'hi', guidedMode: boolean }
  // Onboarding completion
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
});

// OTP Sessions table - For OTP verification
export const otpSessions = pgTable("otp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

// Sessions table - For user authentication sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
});

// Documents table - For storing medical documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'prescription' | 'lab' | 'imaging' | 'billing'
  provider: text("provider"), // Hospital/Doctor name
  date: timestamp("date"), // Document date
  fileUrl: text("file_url").notNull(), // Path to stored file
  fileType: text("file_type"), // 'PDF' | 'JPG' | 'PNG' | 'DICOM'
  fileSize: integer("file_size"), // Size in bytes
  tags: text("tags"), // JSON array of tags
  syncStatus: varchar("sync_status", { length: 20 }).default("synced").notNull(), // 'synced' | 'pending'
  extractedText: text("extracted_text"), // OCR-extracted text from document
  embedding: text("embedding"), // OpenAI embedding stored as JSON array
  ocrProcessed: boolean("ocr_processed").default(false).notNull(), // Whether OCR has been processed
  ocrProcessedAt: timestamp("ocr_processed_at"), // Timestamp when OCR was processed
  aiInsight: text("ai_insight"), // Cached AI insight stored as JSON string
  aiInsightGeneratedAt: timestamp("ai_insight_generated_at"), // Timestamp when AI insight was generated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document versions table - For version history
export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").references(() => documents.id).notNull(),
  version: varchar("version", { length: 20 }).notNull(), // 'v1.0', 'v1.1', etc.
  fileUrl: text("file_url").notNull(),
  note: text("note"), // Version note
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Consents table - For managing document sharing and access permissions
export const consents = pgTable("consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientRole: varchar("recipient_role", { length: 50 }).notNull(), // 'doctor' | 'lab' | 'insurance' | 'family' | 'other'
  scopes: text("scopes").notNull(), // JSON array: ['documents', 'emergency', 'insights', 'timeline']
  durationType: varchar("duration_type", { length: 20 }).notNull(), // '24h' | '7d' | 'custom'
  customExpiryDate: timestamp("custom_expiry_date"), // Only used when durationType is 'custom'
  purpose: text("purpose").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'expired' | 'revoked'
  shareableToken: text("shareable_token").notNull().unique(), // Unique token for shareable link
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
});

// Consent audit logs table - For tracking all consent-related activities
export const consentAuditLogs = pgTable("consent_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consentId: varchar("consent_id").references(() => consents.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // User who performed the action
  action: varchar("action", { length: 50 }).notNull(), // 'grant' | 'revoke' | 'view' | 'access'
  actorId: text("actor_id"), // ID of the person/entity who accessed (for access logs)
  actorType: varchar("actor_type", { length: 50 }), // 'user' | 'recipient' | 'system'
  details: text("details"), // JSON object with additional details
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Emergency cards table - For storing emergency medical information
export const emergencyCards = pgTable("emergency_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  patientName: text("patient_name").notNull(),
  bloodGroup: text("blood_group"),
  allergies: text("allergies"),
  chronicConditions: text("chronic_conditions"),
  currentMedications: text("current_medications"),
  age: integer("age"),
  address: text("address"),
  qrCodeToken: text("qr_code_token").notNull().unique(), // Unique token for QR code
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Nominees table - For managing trusted contacts who can access emergency information
export const nominees = pgTable("nominees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(), // 'Parent' | 'Sibling' | 'Spouse' | 'Friend' | 'Other'
  phoneNumber: text("phone_number").notNull(),
  email: text("email"), // Optional email
  accessScope: varchar("access_scope", { length: 50 }).notNull(), // 'emergency-only' | 'emergency-limited'
  expiryType: varchar("expiry_type", { length: 20 }).notNull(), // '24h' | '7d' | 'custom' | 'lifetime'
  customExpiryDate: timestamp("custom_expiry_date"), // Only used when expiryType is 'custom'
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'expiring-soon' | 'pending' | 'revoked'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Medications table - For storing medication information
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(), // e.g., "500mg", "1 tablet"
  frequency: text("frequency").notNull(), // e.g., "twice daily", "3 times a day"
  timing: text("timing").notNull(), // JSON array of times in HH:MM format, e.g., ["08:00", "20:00"]
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"), // Nullable for indefinite medications
  source: varchar("source", { length: 20 }).notNull(), // 'ai' | 'manual'
  sourceDocumentId: varchar("source_document_id").references(() => documents.id), // Nullable, only for AI-extracted
  status: varchar("status", { length: 20 }).default("active").notNull(), // 'active' | 'stopped' | 'completed'
  instructions: text("instructions"), // Optional instructions (e.g., "with food", "before meals")
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Medication reminders table - For scheduling email reminders
export const medicationReminders = pgTable("medication_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  medicationId: varchar("medication_id").references(() => medications.id).notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending' | 'sent' | 'skipped'
  sentAt: timestamp("sent_at"), // Nullable, set when reminder is sent
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Push subscriptions table - For browser push notifications
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  endpoint: text("endpoint").notNull().unique(), // Push subscription endpoint URL
  p256dh: text("p256dh").notNull(), // Encryption key (base64)
  auth: text("auth").notNull(), // Authentication secret (base64)
  userAgent: text("user_agent"), // Browser/device info
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat conversations table - For storing chatbot conversation sessions
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title"), // Auto-generated from first message, nullable initially
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat messages table - For storing individual messages in conversations
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chatConversations.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(), // Message content
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validation
export const insertUserSchema = createInsertSchema(users).pick({
  phoneNumber: true,
  username: true,
  email: true,
  abhaId: true,
  isGuest: true,
  password: true,
  name: true,
  dateOfBirth: true,
  gender: true,
  bloodGroup: true,
  address: true,
  settings: true,
  onboardingCompleted: true,
});

export const insertOTPSessionSchema = createInsertSchema(otpSessions).pick({
  phoneNumber: true,
  otp: true,
  expiresAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

// Document schema validation
export const insertDocumentSchema = createInsertSchema(documents).pick({
  userId: true,
  title: true,
  type: true,
  provider: true,
  date: true,
  fileUrl: true,
  fileType: true,
  fileSize: true,
  tags: true,
  syncStatus: true,
  extractedText: true,
  embedding: true,
  ocrProcessed: true,
  ocrProcessedAt: true,
  aiInsight: true,
  aiInsightGeneratedAt: true,
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).pick({
  documentId: true,
  version: true,
  fileUrl: true,
  note: true,
});

// Consent schema validation
export const insertConsentSchema = createInsertSchema(consents).pick({
  userId: true,
  recipientName: true,
  recipientRole: true,
  scopes: true,
  durationType: true,
  customExpiryDate: true,
  purpose: true,
  status: true,
  shareableToken: true,
  expiresAt: true,
  revokedAt: true,
});

export const insertConsentAuditLogSchema = createInsertSchema(consentAuditLogs).pick({
  consentId: true,
  userId: true,
  action: true,
  actorId: true,
  actorType: true,
  details: true,
  timestamp: true,
});

// Emergency card schema validation
export const insertEmergencyCardSchema = createInsertSchema(emergencyCards).pick({
  userId: true,
  patientName: true,
  bloodGroup: true,
  allergies: true,
  chronicConditions: true,
  currentMedications: true,
  age: true,
  address: true,
  qrCodeToken: true,
});

// Nominee schema validation
export const insertNomineeSchema = createInsertSchema(nominees).pick({
  userId: true,
  name: true,
  relationship: true,
  phoneNumber: true,
  email: true,
  accessScope: true,
  expiryType: true,
  customExpiryDate: true,
  status: true,
});

// Medication schema validation
export const insertMedicationSchema = createInsertSchema(medications).pick({
  userId: true,
  name: true,
  dosage: true,
  frequency: true,
  timing: true,
  startDate: true,
  endDate: true,
  source: true,
  sourceDocumentId: true,
  status: true,
  instructions: true,
});

// Medication reminder schema validation
export const insertMedicationReminderSchema = createInsertSchema(medicationReminders).pick({
  medicationId: true,
  scheduledTime: true,
  status: true,
  sentAt: true,
});

// Push subscription schema validation
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).pick({
  userId: true,
  endpoint: true,
  p256dh: true,
  auth: true,
  userAgent: true,
});

// Chat conversation schema validation
export const insertChatConversationSchema = createInsertSchema(chatConversations).pick({
  userId: true,
  title: true,
});

// Chat message schema validation
export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  conversationId: true,
  role: true,
  content: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type OTPSession = typeof otpSessions.$inferSelect;
export type InsertOTPSession = z.infer<typeof insertOTPSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type Consent = typeof consents.$inferSelect;
export type InsertConsent = z.infer<typeof insertConsentSchema>;
export type ConsentAuditLog = typeof consentAuditLogs.$inferSelect;
export type InsertConsentAuditLog = z.infer<typeof insertConsentAuditLogSchema>;
export type EmergencyCard = typeof emergencyCards.$inferSelect;
export type InsertEmergencyCard = z.infer<typeof insertEmergencyCardSchema>;
export type Nominee = typeof nominees.$inferSelect;
export type InsertNominee = z.infer<typeof insertNomineeSchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type MedicationReminder = typeof medicationReminders.$inferSelect;
export type InsertMedicationReminder = z.infer<typeof insertMedicationReminderSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
