/**
 * Supabase Storage Implementation
 * Implements IStorage interface using Supabase as the backend
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  type User,
  type InsertUser,
  type OTPSession,
  type Session,
  type Document,
  type InsertDocument,
  type DocumentVersion,
  type InsertDocumentVersion,
  type Consent,
  type ConsentAuditLog,
  type EmergencyCard,
  type Nominee,
  type Medication,
  type InsertMedication,
  type MedicationReminder,
  type InsertMedicationReminder,
  type PushSubscription,
  type InsertPushSubscription,
  type ChatConversation,
  type InsertChatConversation,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { IStorage } from "./storage";
import { randomUUID } from "crypto";

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("phone_number", phoneNumber)
      .single();

    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const userData = {
      id,
      phone_number: insertUser.phoneNumber,
      username: insertUser.username ?? null,
      email: insertUser.email ?? null,
      abha_id: insertUser.abhaId ?? null,
      is_guest: insertUser.isGuest ?? false,
      password: insertUser.password ?? null,
      name: insertUser.name ?? null,
      date_of_birth: insertUser.dateOfBirth ?? null,
      gender: insertUser.gender ?? null,
      blood_group: insertUser.bloodGroup ?? null,
      address: insertUser.address ?? null,
      settings: insertUser.settings ?? null,
      onboarding_completed: insertUser.onboardingCompleted ?? false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data, error } = await this.supabase
      .from("users")
      .insert(userData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.mapUserFromDb(data);
  }

  async createOrUpdateUser(
    phoneNumber: string,
    data?: Partial<User>
  ): Promise<User> {
    const existing = await this.getUserByPhoneNumber(phoneNumber);
    if (existing) {
      return this.updateUserProfile(existing.id, data || {});
    }

    return this.createUser({
      phoneNumber,
      ...data,
      isGuest: data?.isGuest ?? false,
    } as InsertUser);
  }

  // OTP Session methods
  async createOTPSession(
    phoneNumber: string,
    otp: string,
    expiresIn: number
  ): Promise<OTPSession> {
    // Delete existing session for this phone number
    await this.deleteOTPSession(phoneNumber);

    const id = randomUUID();
    const expiresAt = new Date(Date.now() + expiresIn);
    const otpData = {
      id,
      phone_number: phoneNumber,
      otp,
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      verified: false,
      created_at: new Date().toISOString(),
      verified_at: null,
    };

    const { data, error } = await this.supabase
      .from("otp_sessions")
      .insert(otpData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create OTP session: ${error.message}`);
    return this.mapOTPSessionFromDb(data);
  }

  async getOTPSession(phoneNumber: string): Promise<OTPSession | undefined> {
    const { data, error } = await this.supabase
      .from("otp_sessions")
      .select("*")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(`[Supabase] Error getting OTP session for ${phoneNumber}:`, error);
      return undefined;
    }
    
    if (!data || data.length === 0) {
      console.log(`[Supabase] No OTP session found for phone: ${phoneNumber}`);
      return undefined;
    }
    
    const session = this.mapOTPSessionFromDb(data[0]);
    console.log(`[Supabase] Found OTP session for ${phoneNumber}, OTP: ${session.otp}, Expires: ${session.expiresAt}`);
    return session;
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const session = await this.getOTPSession(phoneNumber);
    if (!session) return false;
    if (session.verified) return false;
    if (new Date() > session.expiresAt) return false;
    // Ensure both are strings for comparison
    return String(session.otp).trim() === String(otp).trim();
  }

  async incrementOTPAttempts(phoneNumber: string): Promise<void> {
    const session = await this.getOTPSession(phoneNumber);
    if (!session) return;

    const { error } = await this.supabase
      .from("otp_sessions")
      .update({ attempts: session.attempts + 1 })
      .eq("id", session.id);

    if (error) throw new Error(`Failed to increment OTP attempts: ${error.message}`);
  }

  async markOTPVerified(phoneNumber: string): Promise<void> {
    const session = await this.getOTPSession(phoneNumber);
    if (!session) return;

    const { error } = await this.supabase
      .from("otp_sessions")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (error) throw new Error(`Failed to mark OTP as verified: ${error.message}`);
  }

  async deleteOTPSession(phoneNumber: string): Promise<void> {
    await this.supabase
      .from("otp_sessions")
      .delete()
      .eq("phone_number", phoneNumber);
  }

  // Session methods
  async createSession(
    userId: string,
    token: string,
    expiresIn: number
  ): Promise<Session> {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + expiresIn);
    const sessionData = {
      id,
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("sessions")
      .insert(sessionData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return this.mapSessionFromDb(data);
  }

  async getSession(token: string): Promise<Session | undefined> {
    const { data, error } = await this.supabase
      .from("sessions")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) return undefined;
    return this.mapSessionFromDb(data);
  }

  async deleteSession(token: string): Promise<void> {
    await this.supabase.from("sessions").delete().eq("token", token);
  }

  async updateSessionActivity(token: string): Promise<void> {
    const { error } = await this.supabase
      .from("sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("token", token);

    if (error) throw new Error(`Failed to update session activity: ${error.message}`);
  }

  // User profile methods
  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.dateOfBirth !== undefined)
      updateData.date_of_birth = data.dateOfBirth?.toISOString() ?? null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.bloodGroup !== undefined) updateData.blood_group = data.bloodGroup;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.onboardingCompleted !== undefined)
      updateData.onboarding_completed = data.onboardingCompleted;

    const { data: updated, error } = await this.supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user profile: ${error.message}`);
    return this.mapUserFromDb(updated);
  }

  async updateUserSettings(
    userId: string,
    settings: { language?: string; guidedMode?: boolean }
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const currentSettings = user.settings ? JSON.parse(user.settings) : {};
    const updatedSettings = { ...currentSettings, ...settings };

    const { data: updated, error } = await this.supabase
      .from("users")
      .update({
        settings: JSON.stringify(updatedSettings),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user settings: ${error.message}`);
    return this.mapUserFromDb(updated);
  }

  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const documentData = {
      id,
      user_id: insertDocument.userId,
      title: insertDocument.title,
      type: insertDocument.type,
      provider: insertDocument.provider ?? null,
      date: insertDocument.date?.toISOString() ?? null,
      file_url: insertDocument.fileUrl,
      file_type: insertDocument.fileType ?? null,
      file_size: insertDocument.fileSize ?? null,
      tags: insertDocument.tags ?? null,
      sync_status: insertDocument.syncStatus ?? "synced",
      extracted_text: insertDocument.extractedText ?? null,
      embedding: insertDocument.embedding ?? null,
      ocr_processed: insertDocument.ocrProcessed ?? false,
      ocr_processed_at: insertDocument.ocrProcessedAt?.toISOString() ?? null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data, error } = await this.supabase
      .from("documents")
      .insert(documentData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return this.mapDocumentFromDb(data);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return this.mapDocumentFromDb(data);
  }

  async getDocumentsByUserId(
    userId: string,
    filters?: { type?: string; search?: string }
  ): Promise<Document[]> {
    let query = this.supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId);

    if (filters?.type && filters.type !== "all") {
      query = query.eq("type", filters.type);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get documents: ${error.message}`);
    if (!data) return [];

    let documents = data.map((d) => this.mapDocumentFromDb(d));

    // Apply search filter if provided
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      documents = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          (doc.provider && doc.provider.toLowerCase().includes(searchLower)) ||
          (doc.tags && doc.tags.toLowerCase().includes(searchLower))
      );
    }

    return documents;
  }

  async updateDocument(id: string, data: Partial<Document>): Promise<Document> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.date !== undefined)
      updateData.date = data.date?.toISOString() ?? null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.syncStatus !== undefined) updateData.sync_status = data.syncStatus;
    if (data.aiInsight !== undefined) updateData.ai_insight = data.aiInsight;
    if (data.aiInsightGeneratedAt !== undefined)
      updateData.ai_insight_generated_at = data.aiInsightGeneratedAt?.toISOString() ?? null;

    const { data: updated, error } = await this.supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update document: ${error.message}`);
    return this.mapDocumentFromDb(updated);
  }

  async deleteDocument(id: string): Promise<void> {
    // Delete versions first (cascade should handle this, but being explicit)
    await this.supabase.from("document_versions").delete().eq("document_id", id);

    const { error } = await this.supabase.from("documents").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  // Document version methods
  async createDocumentVersion(
    insertVersion: InsertDocumentVersion
  ): Promise<DocumentVersion> {
    const id = randomUUID();
    const versionData = {
      id,
      document_id: insertVersion.documentId,
      version: insertVersion.version,
      file_url: insertVersion.fileUrl,
      note: insertVersion.note ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from("document_versions")
      .insert(versionData)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create document version: ${error.message}`);
    return this.mapDocumentVersionFromDb(data);
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await this.supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get document versions: ${error.message}`);
    if (!data) return [];

    return data.map((v) => this.mapDocumentVersionFromDb(v));
  }

  // Helper methods to map database rows to TypeScript types
  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      phoneNumber: row.phone_number,
      username: row.username,
      email: row.email,
      abhaId: row.abha_id,
      isGuest: row.is_guest,
      password: row.password,
      name: row.name,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
      gender: row.gender,
      bloodGroup: row.blood_group,
      address: row.address,
      settings: row.settings,
      onboardingCompleted: row.onboarding_completed,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapOTPSessionFromDb(row: any): OTPSession {
    // Parse dates correctly - Supabase returns timestamps that need proper handling
    // If the date string doesn't have timezone info, treat it as UTC (since we store as ISO string)
    const parseDate = (dateStr: string | null): Date => {
      if (!dateStr) return new Date();
      // If it's already an ISO string with Z, use it directly
      if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-', 10)) {
        return new Date(dateStr);
      }
      // If it's a timestamp without timezone, assume it's UTC (since we stored it as UTC)
      // Add 'Z' to indicate UTC
      return new Date(dateStr + 'Z');
    };
    
    const expiresAt = parseDate(row.expires_at);
    const createdAt = parseDate(row.created_at);
    const verifiedAt = row.verified_at ? parseDate(row.verified_at) : null;
    
    // Debug logging to check date parsing
    console.log(`[Supabase] Mapping OTP session - expires_at from DB: "${row.expires_at}", parsed: ${expiresAt.toISOString()}, now: ${new Date().toISOString()}, diff: ${expiresAt.getTime() - Date.now()}ms`);
    
    return {
      id: row.id,
      phoneNumber: row.phone_number,
      otp: row.otp,
      expiresAt: expiresAt,
      attempts: row.attempts,
      verified: row.verified,
      createdAt: createdAt,
      verifiedAt: verifiedAt,
    };
  }

  private mapSessionFromDb(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      lastActivityAt: new Date(row.last_activity_at),
    };
  }

  private mapDocumentFromDb(row: any): Document {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      type: row.type,
      provider: row.provider,
      date: row.date ? new Date(row.date) : null,
      fileUrl: row.file_url,
      fileType: row.file_type,
      fileSize: row.file_size,
      tags: row.tags,
      syncStatus: row.sync_status,
      extractedText: row.extracted_text ?? null,
      embedding: row.embedding ?? null,
      ocrProcessed: row.ocr_processed ?? false,
      ocrProcessedAt: row.ocr_processed_at ? new Date(row.ocr_processed_at) : null,
      aiInsight: row.ai_insight ?? null,
      aiInsightGeneratedAt: row.ai_insight_generated_at ? new Date(row.ai_insight_generated_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapDocumentVersionFromDb(row: any): DocumentVersion {
    return {
      id: row.id,
      documentId: row.document_id,
      version: row.version,
      fileUrl: row.file_url,
      note: row.note,
      createdAt: new Date(row.created_at),
    };
  }

  // Consent methods
  generateShareableToken(): string {
    return randomUUID() + randomUUID().replace(/-/g, '');
  }

  async createConsent(userId: string, data: {
    recipientName: string;
    recipientRole: string;
    scopes: string[];
    durationType: '24h' | '7d' | 'custom';
    customExpiryDate?: Date;
    purpose: string;
  }): Promise<Consent> {
    const id = randomUUID();
    const now = new Date();
    
    // Calculate expiry date based on duration type
    let expiresAt: Date;
    if (data.durationType === '24h') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (data.durationType === '7d') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
      expiresAt = data.customExpiryDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const shareableToken = this.generateShareableToken();

    const consentData = {
      id,
      user_id: userId,
      recipient_name: data.recipientName,
      recipient_role: data.recipientRole,
      scopes: JSON.stringify(data.scopes),
      duration_type: data.durationType,
      custom_expiry_date: data.customExpiryDate ? data.customExpiryDate.toISOString() : null,
      purpose: data.purpose,
      status: 'active',
      shareable_token: shareableToken,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      revoked_at: null,
    };

    const { data: inserted, error } = await this.supabase
      .from("consents")
      .insert(consentData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create consent: ${error.message}`);
    return this.mapConsentFromDb(inserted);
  }

  async getConsents(userId: string, filters?: { status?: string }): Promise<Consent[]> {
    let query = this.supabase
      .from("consents")
      .select("*")
      .eq("user_id", userId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get consents: ${error.message}`);
    
    const consents = (data || []).map(row => this.mapConsentFromDb(row));
    
    // Update status based on expiry
    const now = new Date();
    return consents.map(consent => {
      if (consent.status === 'active' && now > consent.expiresAt) {
        // Update status in database
        this.updateConsentStatus(consent.id, 'expired').catch(console.error);
        return { ...consent, status: 'expired' };
      }
      return consent;
    });
  }

  async getConsent(id: string): Promise<Consent | undefined> {
    const { data, error } = await this.supabase
      .from("consents")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    
    const consent = this.mapConsentFromDb(data);
    
    // Check if expired
    const now = new Date();
    if (consent.status === 'active' && now > consent.expiresAt) {
      await this.updateConsentStatus(id, 'expired');
      return { ...consent, status: 'expired' };
    }
    
    return consent;
  }

  async getConsentByToken(token: string): Promise<Consent | undefined> {
    const { data, error } = await this.supabase
      .from("consents")
      .select("*")
      .eq("shareable_token", token)
      .single();

    if (error || !data) return undefined;
    
    const consent = this.mapConsentFromDb(data);
    
    // Check if expired or revoked
    const now = new Date();
    if (consent.status === 'revoked') return consent;
    if (now > consent.expiresAt) {
      await this.updateConsentStatus(consent.id, 'expired');
      return { ...consent, status: 'expired' };
    }
    
    return consent;
  }

  async updateConsentStatus(id: string, status: 'active' | 'expired' | 'revoked'): Promise<Consent> {
    const updateData: any = {
      status,
    };
    
    if (status === 'revoked') {
      updateData.revoked_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from("consents")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update consent status: ${error.message}`);
    return this.mapConsentFromDb(data);
  }

  async revokeConsent(id: string): Promise<Consent> {
    return this.updateConsentStatus(id, 'revoked');
  }

  // Consent audit log methods
  async createAuditLog(consentId: string, action: string, details: {
    userId?: string;
    actorId?: string;
    actorType?: string;
    details?: any;
  }): Promise<ConsentAuditLog> {
    const id = randomUUID();
    const now = new Date();
    
    const auditLogData = {
      id,
      consent_id: consentId,
      user_id: details.userId || null,
      action,
      actor_id: details.actorId || null,
      actor_type: details.actorType || null,
      details: details.details ? JSON.stringify(details.details) : null,
      timestamp: now.toISOString(),
    };

    const { data, error } = await this.supabase
      .from("consent_audit_logs")
      .insert(auditLogData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create audit log: ${error.message}`);
    return this.mapConsentAuditLogFromDb(data);
  }

  async getAuditLogs(consentId: string): Promise<ConsentAuditLog[]> {
    const { data, error } = await this.supabase
      .from("consent_audit_logs")
      .select("*")
      .eq("consent_id", consentId)
      .order("timestamp", { ascending: false });

    if (error) throw new Error(`Failed to get audit logs: ${error.message}`);
    return (data || []).map(row => this.mapConsentAuditLogFromDb(row));
  }

  // Emergency card methods
  async getEmergencyCard(userId: string): Promise<EmergencyCard | undefined> {
    const { data, error } = await this.supabase
      .from("emergency_cards")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return undefined;
    return this.mapEmergencyCardFromDb(data);
  }

  async createOrUpdateEmergencyCard(userId: string, data: {
    patientName: string;
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
    currentMedications?: string;
    age?: number;
    address?: string;
    qrCodeToken: string;
  }): Promise<EmergencyCard> {
    // Check if emergency card exists
    const existing = await this.getEmergencyCard(userId);
    
    const cardData: any = {
      user_id: userId,
      patient_name: data.patientName,
      blood_group: data.bloodGroup || null,
      allergies: data.allergies || null,
      chronic_conditions: data.chronicConditions || null,
      current_medications: data.currentMedications || null,
      age: data.age || null,
      address: data.address || null,
      qr_code_token: data.qrCodeToken,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing card
      const { data: updated, error } = await this.supabase
        .from("emergency_cards")
        .update(cardData)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update emergency card: ${error.message}`);
      return this.mapEmergencyCardFromDb(updated);
    } else {
      // Create new card
      cardData.id = randomUUID();
      cardData.created_at = new Date().toISOString();
      
      const { data: created, error } = await this.supabase
        .from("emergency_cards")
        .insert(cardData)
        .select()
        .single();

      if (error) throw new Error(`Failed to create emergency card: ${error.message}`);
      return this.mapEmergencyCardFromDb(created);
    }
  }

  async getEmergencyCardByToken(token: string): Promise<EmergencyCard | undefined> {
    const { data, error } = await this.supabase
      .from("emergency_cards")
      .select("*")
      .eq("qr_code_token", token)
      .single();

    if (error || !data) return undefined;
    return this.mapEmergencyCardFromDb(data);
  }

  private mapConsentFromDb(row: any): Consent {
    return {
      id: row.id,
      userId: row.user_id,
      recipientName: row.recipient_name,
      recipientRole: row.recipient_role,
      scopes: row.scopes,
      durationType: row.duration_type,
      customExpiryDate: row.custom_expiry_date ? new Date(row.custom_expiry_date) : null,
      purpose: row.purpose,
      status: row.status,
      shareableToken: row.shareable_token,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    };
  }

  private mapConsentAuditLogFromDb(row: any): ConsentAuditLog {
    return {
      id: row.id,
      consentId: row.consent_id,
      userId: row.user_id,
      action: row.action,
      actorId: row.actor_id,
      actorType: row.actor_type,
      details: row.details,
      timestamp: new Date(row.timestamp),
    };
  }

  private mapEmergencyCardFromDb(row: any): EmergencyCard {
    return {
      id: row.id,
      userId: row.user_id,
      patientName: row.patient_name,
      bloodGroup: row.blood_group,
      allergies: row.allergies,
      chronicConditions: row.chronic_conditions,
      currentMedications: row.current_medications,
      age: row.age,
      address: row.address,
      qrCodeToken: row.qr_code_token,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Nominee methods
  async getNominees(userId: string): Promise<Nominee[]> {
    const { data, error } = await this.supabase
      .from("nominees")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "revoked")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get nominees: ${error.message}`);
    
    const nominees = (data || []).map(row => this.mapNomineeFromDb(row));
    
    // Calculate status based on expiry
    const now = new Date();
    return nominees.map(nominee => {
      if (nominee.status === 'revoked') return nominee;
      
      let expiresAt: Date | null = null;
      if (nominee.expiryType === '24h') {
        expiresAt = new Date(nominee.createdAt.getTime() + 24 * 60 * 60 * 1000);
      } else if (nominee.expiryType === '7d') {
        expiresAt = new Date(nominee.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (nominee.expiryType === 'custom' && nominee.customExpiryDate) {
        expiresAt = nominee.customExpiryDate;
      }
      
      let status = nominee.status;
      if (expiresAt && now > expiresAt) {
        status = 'revoked';
      } else if (expiresAt && expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        status = 'expiring-soon';
      }
      
      return { ...nominee, status };
    });
  }

  async getNominee(id: string): Promise<Nominee | undefined> {
    const { data, error } = await this.supabase
      .from("nominees")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return this.mapNomineeFromDb(data);
  }

  async createNominee(userId: string, data: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
    accessScope: string;
    expiryType: string;
    customExpiryDate?: Date;
  }): Promise<Nominee> {
    const nomineeData: any = {
      user_id: userId,
      name: data.name,
      relationship: data.relationship,
      phone_number: data.phoneNumber,
      email: data.email || null,
      access_scope: data.accessScope,
      expiry_type: data.expiryType,
      custom_expiry_date: data.customExpiryDate ? data.customExpiryDate.toISOString() : null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: created, error } = await this.supabase
      .from("nominees")
      .insert(nomineeData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create nominee: ${error.message}`);
    return this.mapNomineeFromDb(created);
  }

  async updateNominee(id: string, data: Partial<Nominee>): Promise<Nominee> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.relationship !== undefined) updateData.relationship = data.relationship;
    if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.accessScope !== undefined) updateData.access_scope = data.accessScope;
    if (data.expiryType !== undefined) updateData.expiry_type = data.expiryType;
    if (data.customExpiryDate !== undefined) {
      updateData.custom_expiry_date = data.customExpiryDate ? data.customExpiryDate.toISOString() : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updated, error } = await this.supabase
      .from("nominees")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update nominee: ${error.message}`);
    return this.mapNomineeFromDb(updated);
  }

  async deleteNominee(id: string): Promise<void> {
    // Soft delete by setting status to revoked
    const { error } = await this.supabase
      .from("nominees")
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`Failed to delete nominee: ${error.message}`);
  }

  private mapNomineeFromDb(row: any): Nominee {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      relationship: row.relationship,
      phoneNumber: row.phone_number,
      email: row.email,
      accessScope: row.access_scope,
      expiryType: row.expiry_type,
      customExpiryDate: row.custom_expiry_date ? new Date(row.custom_expiry_date) : null,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Medication methods
  async getMedications(userId: string, filters?: { status?: string }): Promise<Medication[]> {
    let query = this.supabase
      .from("medications")
      .select("*")
      .eq("user_id", userId);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get medications: ${error.message}`);
    return (data || []).map(row => this.mapMedicationFromDb(row));
  }

  async getMedication(id: string): Promise<Medication | undefined> {
    const { data, error } = await this.supabase
      .from("medications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw new Error(`Failed to get medication: ${error.message}`);
    }

    return data ? this.mapMedicationFromDb(data) : undefined;
  }

  async createMedication(data: InsertMedication): Promise<Medication> {
    const medicationData: any = {
      user_id: data.userId,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      timing: data.timing,
      start_date: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      source: data.source,
      source_document_id: data.sourceDocumentId || null,
      status: data.status || 'active',
      instructions: data.instructions || null,
    };

    const { data: created, error } = await this.supabase
      .from("medications")
      .insert(medicationData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create medication: ${error.message}`);
    return this.mapMedicationFromDb(created);
  }

  async updateMedication(id: string, data: Partial<InsertMedication>): Promise<Medication> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.dosage !== undefined) updateData.dosage = data.dosage;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.timing !== undefined) updateData.timing = data.timing;
    if (data.startDate !== undefined) updateData.start_date = new Date(data.startDate).toISOString();
    if (data.endDate !== undefined) updateData.end_date = data.endDate ? new Date(data.endDate).toISOString() : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.instructions !== undefined) updateData.instructions = data.instructions || null;

    const { data: updated, error } = await this.supabase
      .from("medications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update medication: ${error.message}`);
    return this.mapMedicationFromDb(updated);
  }

  async deleteMedication(id: string): Promise<void> {
    // Delete all reminders first
    await this.deleteRemindersForMedication(id);
    
    // Then delete the medication
    const { error } = await this.supabase
      .from("medications")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete medication: ${error.message}`);
  }

  // Medication reminder methods
  async getMedicationReminders(medicationId: string): Promise<MedicationReminder[]> {
    const { data, error } = await this.supabase
      .from("medication_reminders")
      .select("*")
      .eq("medication_id", medicationId)
      .order("scheduled_time", { ascending: true });

    if (error) throw new Error(`Failed to get reminders: ${error.message}`);
    return (data || []).map(row => this.mapMedicationReminderFromDb(row));
  }

  async createMedicationReminder(data: InsertMedicationReminder): Promise<MedicationReminder> {
    const reminderData: any = {
      medication_id: data.medicationId,
      scheduled_time: new Date(data.scheduledTime).toISOString(),
      status: data.status || 'pending',
      sent_at: data.sentAt ? new Date(data.sentAt).toISOString() : null,
    };

    const { data: created, error } = await this.supabase
      .from("medication_reminders")
      .insert(reminderData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create reminder: ${error.message}`);
    return this.mapMedicationReminderFromDb(created);
  }

  async updateReminderStatus(id: string, status: 'pending' | 'sent' | 'skipped', sentAt?: Date): Promise<MedicationReminder> {
    const updateData: any = {
      status,
    };

    if (status === 'sent') {
      updateData.sent_at = sentAt ? sentAt.toISOString() : new Date().toISOString();
    }

    const { data: updated, error } = await this.supabase
      .from("medication_reminders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update reminder: ${error.message}`);
    return this.mapMedicationReminderFromDb(updated);
  }

  async getDueReminders(): Promise<MedicationReminder[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("medication_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_time", now)
      .order("scheduled_time", { ascending: true });

    if (error) throw new Error(`Failed to get due reminders: ${error.message}`);
    return (data || []).map(row => this.mapMedicationReminderFromDb(row));
  }

  async deleteRemindersForMedication(medicationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("medication_reminders")
      .delete()
      .eq("medication_id", medicationId);

    if (error) throw new Error(`Failed to delete reminders: ${error.message}`);
  }

  // Push subscription methods
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get push subscriptions: ${error.message}`);
    return (data || []).map(row => this.mapPushSubscriptionFromDb(row));
  }

  async getPushSubscriptionByEndpoint(endpoint: string): Promise<PushSubscription | undefined> {
    const { data, error } = await this.supabase
      .from("push_subscriptions")
      .select("*")
      .eq("endpoint", endpoint)
      .single();

    if (error || !data) return undefined;
    return this.mapPushSubscriptionFromDb(data);
  }

  async createPushSubscription(data: InsertPushSubscription): Promise<PushSubscription> {
    // Check if subscription with this endpoint already exists
    const existing = await this.getPushSubscriptionByEndpoint(data.endpoint);
    
    if (existing) {
      // Update existing subscription
      const updateData: any = {
        user_id: data.userId,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent || null,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error } = await this.supabase
        .from("push_subscriptions")
        .update(updateData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update push subscription: ${error.message}`);
      return this.mapPushSubscriptionFromDb(updated);
    }

    // Create new subscription
    const subscriptionData: any = {
      user_id: data.userId,
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
      user_agent: data.userAgent || null,
    };

    const { data: created, error } = await this.supabase
      .from("push_subscriptions")
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create push subscription: ${error.message}`);
    return this.mapPushSubscriptionFromDb(created);
  }

  async deletePushSubscription(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("push_subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete push subscription: ${error.message}`);
  }

  async deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
    const { error } = await this.supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) throw new Error(`Failed to delete push subscription: ${error.message}`);
  }

  private mapMedicationFromDb(row: any): Medication {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      timing: row.timing,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : null,
      source: row.source,
      sourceDocumentId: row.source_document_id,
      status: row.status,
      instructions: row.instructions,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapMedicationReminderFromDb(row: any): MedicationReminder {
    return {
      id: row.id,
      medicationId: row.medication_id,
      scheduledTime: new Date(row.scheduled_time),
      status: row.status,
      sentAt: row.sent_at ? new Date(row.sent_at) : null,
      createdAt: new Date(row.created_at),
    };
  }

  private mapPushSubscriptionFromDb(row: any): PushSubscription {
    return {
      id: row.id,
      userId: row.user_id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      userAgent: row.user_agent,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Chat conversation methods
  async getConversations(userId: string): Promise<ChatConversation[]> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[SupabaseStorage] Error fetching conversations:", error);
      return [];
    }

    return (data || []).map((row) => this.mapChatConversationFromDb(row));
  }

  async getConversation(id: string): Promise<ChatConversation | undefined> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return this.mapChatConversationFromDb(data);
  }

  async createConversation(userId: string, title?: string): Promise<ChatConversation> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .insert({
        user_id: userId,
        title: title || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[SupabaseStorage] Error creating conversation:", error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return this.mapChatConversationFromDb(data);
  }

  async updateConversation(id: string, title: string): Promise<ChatConversation> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseStorage] Error updating conversation:", error);
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    return this.mapChatConversationFromDb(data);
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete messages first (cascade should handle this, but explicit for clarity)
    const { error: messagesError } = await this.supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", id);

    if (messagesError) {
      console.error("[SupabaseStorage] Error deleting messages:", messagesError);
    }

    // Delete conversation
    const { error } = await this.supabase
      .from("chat_conversations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[SupabaseStorage] Error deleting conversation:", error);
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  // Chat message methods
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[SupabaseStorage] Error fetching messages:", error);
      return [];
    }

    return (data || []).map((row) => this.mapChatMessageFromDb(row));
  }

  async createMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
    // Create message
    const { data: messageData, error: messageError } = await this.supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (messageError) {
      console.error("[SupabaseStorage] Error creating message:", messageError);
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    // Update conversation updated_at timestamp
    const { error: updateError } = await this.supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (updateError) {
      console.error("[SupabaseStorage] Error updating conversation timestamp:", updateError);
      // Don't throw - message was created successfully
    }

    return this.mapChatMessageFromDb(messageData);
  }

  private mapChatConversationFromDb(row: any): ChatConversation {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapChatMessageFromDb(row: any): ChatMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      createdAt: new Date(row.created_at),
    };
  }
}

