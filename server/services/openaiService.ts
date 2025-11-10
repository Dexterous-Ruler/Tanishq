/**
 * OpenAI Service
 * Handles OCR text extraction, embedding generation, and metadata extraction for documents
 */

import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.warn("[OpenAI Service] Warning: OPENAI_API_KEY not set in environment variables");
}

const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export interface ExtractedMetadata {
  title?: string;
  provider?: string; // Hospital name, lab name, clinic name
  date?: string; // ISO date string
  documentType?: "prescription" | "lab" | "imaging" | "billing";
  tags?: string[];
}

export class OpenAIService {
  /**
   * Extract text from an image using GPT-4 Vision API
   * @param file - Image file buffer
   * @param mimeType - MIME type of the image (e.g., 'image/jpeg', 'image/png')
   * @returns Extracted text from the image
   */
  static async extractTextFromImage(
    file: Buffer,
    mimeType: string
  ): Promise<string> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      console.log(`[OpenAI] Extracting text from image (${mimeType})`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this medical document. Include all details like patient name, date, test results, values, units, and any other information. Return the text in a structured format if possible.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${file.toString("base64")}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      const extractedText = response.choices[0]?.message?.content || "";
      console.log(`[OpenAI] Extracted ${extractedText.length} characters from image`);
      
      return extractedText;
    } catch (error: any) {
      console.error("[OpenAI] Error extracting text from image:", error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Extract text from a PDF file
   * For PDFs, we'll convert pages to images first, then extract text
   * Note: This is a simplified approach. For production, consider using pdf-parse or similar
   * @param file - PDF file buffer
   * @returns Extracted text from the PDF
   */
  static async extractTextFromPDF(file: Buffer): Promise<string> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      console.log(`[OpenAI] Extracting text from PDF`);
      
      // Convert PDF to base64
      const base64Pdf = file.toString("base64");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this medical document PDF. Include all details like patient name, date, test results, values, units, and any other information. Return the text in a structured format if possible.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      const extractedText = response.choices[0]?.message?.content || "";
      console.log(`[OpenAI] Extracted ${extractedText.length} characters from PDF`);
      
      return extractedText;
    } catch (error: any) {
      console.error("[OpenAI] Error extracting text from PDF:", error);
      // If PDF extraction fails, try alternative approach
      // For now, return empty string and log the error
      console.warn("[OpenAI] PDF text extraction failed, returning empty string");
      return "";
    }
  }

  /**
   * Generate embedding for text using OpenAI's embedding model
   * @param text - Text to generate embedding for
   * @returns Embedding vector as JSON string
   */
  static async generateEmbedding(text: string): Promise<string> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    if (!text || text.trim().length === 0) {
      return JSON.stringify([]);
    }

    try {
      console.log(`[OpenAI] Generating embedding for text (${text.length} chars)`);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000), // Limit to 8000 chars to avoid token limits
      });

      const embedding = response.data[0]?.embedding || [];
      const embeddingJson = JSON.stringify(embedding);
      
      console.log(`[OpenAI] Generated embedding with ${embedding.length} dimensions`);
      
      return embeddingJson;
    } catch (error: any) {
      console.error("[OpenAI] Error generating embedding:", error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Extract metadata from medical document text
   * @param extractedText - Text extracted from the document
   * @returns Extracted metadata (title, provider, date, documentType, tags)
   */
  static async extractMetadata(extractedText: string): Promise<ExtractedMetadata> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return {};
    }

    try {
      console.log(`[OpenAI] Extracting metadata from text (${extractedText.length} chars)`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use cheaper model for metadata extraction
        messages: [
          {
            role: "system",
            content: `You are a medical document parser. Extract key information from medical documents.

Extract the following information:
1. **title**: A concise title for the document (e.g., "Blood Test Report", "Chest X-Ray Report", "Prescription")
2. **provider**: The name of the hospital, lab, clinic, or doctor's name (e.g., "Apollo Hospital", "Dr. John Smith", "Max Lab")
3. **date**: The date of the document in ISO format (YYYY-MM-DD). If multiple dates exist, use the most relevant one (report date, test date, prescription date)
4. **documentType**: One of: "lab", "prescription", "imaging", "billing"
5. **tags**: Array of relevant tags (e.g., ["blood-test", "cbc"], ["x-ray", "chest"], ["prescription", "antibiotics"])

Respond ONLY with a JSON object in this exact format:
{
  "title": "string or null",
  "provider": "string or null",
  "date": "YYYY-MM-DD or null",
  "documentType": "lab" | "prescription" | "imaging" | "billing" or null,
  "tags": ["string"] or []
}

If information is not found, use null for that field.`,
          },
          {
            role: "user",
            content: `Extract metadata from this medical document:\n\n${extractedText.substring(0, 3000)}`, // Limit to 3000 chars
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const metadata = JSON.parse(content) as ExtractedMetadata;
      
      console.log(`[OpenAI] Extracted metadata:`, metadata);
      
      return metadata;
    } catch (error: any) {
      console.error("[OpenAI] Error extracting metadata:", error);
      return {};
    }
  }

  /**
   * Validate if a document is medical-related
   * Uses AI to determine if the document is a medical document (lab report, prescription, etc.)
   * @param extractedText - Text extracted from the document
   * @param fileBuffer - Original file buffer (for image analysis if text is insufficient)
   * @param mimeType - MIME type of the file
   * @returns Object with isValid (boolean) and reason (string)
   */
  static async validateMedicalDocument(
    extractedText: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ isValid: boolean; reason: string }> {
    if (!openai) {
      // If OpenAI is not configured, allow all documents (fallback)
      console.warn("[OpenAI] OpenAI not configured, skipping medical validation");
      return { isValid: true, reason: "OpenAI not configured" };
    }

    try {
      console.log(`[OpenAI] Validating if document is medical-related`);
      console.log(`[OpenAI] Extracted text length: ${extractedText.length} chars`);
      console.log(`[OpenAI] File buffer size: ${fileBuffer.length} bytes`);
      console.log(`[OpenAI] MIME type: ${mimeType}`);

      // If we have extracted text, use it for validation
      if (extractedText && extractedText.trim().length > 0) {
        console.log(`[OpenAI] Using text-based validation`);
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Use cheaper model for validation
          messages: [
            {
              role: "system",
              content: `You are a medical document validator. Your task is to determine if a document is a medical document or not.

Medical documents include:
- Lab reports and test results
- Prescriptions
- Medical imaging reports (X-rays, CT scans, MRIs, etc.)
- Doctor's notes and consultation reports
- Discharge summaries
- Medical certificates
- Health insurance claims
- Medical bills and invoices
- Vaccination records
- Health checkup reports

Non-medical documents include:
- Personal photos (selfies, family photos, etc.)
- Receipts for non-medical purchases
- Bank statements
- Identity documents (Aadhaar, passport, etc.)
- Educational certificates
- Legal documents
- Random text documents
- Any document that is clearly not related to health or medical care

Respond ONLY with a JSON object in this exact format:
{
  "isMedical": true or false,
  "reason": "Brief explanation of why it is or isn't a medical document"
}`,
            },
            {
              role: "user",
              content: `Analyze this document text and determine if it is a medical document:\n\n${extractedText.substring(0, 3000)}`, // Limit to 3000 chars
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 200,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const validation = JSON.parse(content);

        const isValid = validation.isMedical === true;
        const reason = validation.reason || (isValid ? "Document appears to be medical-related" : "Document does not appear to be a medical document");

        console.log(`[OpenAI] Medical validation result: ${isValid ? "VALID" : "INVALID"} - ${reason}`);

        return { isValid, reason };
      } else {
        // If no text extracted, try to analyze the image directly
        console.log("[OpenAI] No text extracted, analyzing image directly for medical content");

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a medical document validator. Analyze this image and determine if it is a medical document.

Medical documents include: lab reports, prescriptions, medical imaging reports, doctor's notes, discharge summaries, medical certificates, health insurance claims, medical bills, vaccination records, health checkup reports.

Non-medical documents include: personal photos, receipts for non-medical purchases, bank statements, identity documents, educational certificates, legal documents, random images.

Respond ONLY with a JSON object:
{
  "isMedical": true or false,
  "reason": "Brief explanation"
}`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Is this image a medical document? Analyze the content and determine if it's related to health or medical care.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${fileBuffer.toString("base64")}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 200,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const validation = JSON.parse(content);

        const isValid = validation.isMedical === true;
        const reason = validation.reason || (isValid ? "Document appears to be medical-related" : "Document does not appear to be a medical document");

        console.log(`[OpenAI] Medical validation result (image analysis): ${isValid ? "VALID" : "INVALID"} - ${reason}`);

        return { isValid, reason };
      }
    } catch (error: any) {
      console.error("[OpenAI] Error validating medical document:", error);
      // On error, allow the document (fail open) but log the error
      return {
        isValid: true,
        reason: "Validation error occurred, document allowed",
      };
    }
  }

  /**
   * Process a document: extract text and generate embedding
   * @param file - File buffer
   * @param fileType - File type (e.g., 'JPG', 'PNG', 'PDF', 'DOCX')
   * @param mimeType - MIME type of the file
   * @returns Object with extractedText and embedding
   */
  static async processDocument(
    file: Buffer,
    fileType: string,
    mimeType: string
  ): Promise<{ extractedText: string; embedding: string }> {
    try {
      let extractedText = "";

      // Extract text based on file type
      if (fileType === "PDF" || mimeType === "application/pdf") {
        extractedText = await this.extractTextFromPDF(file);
      } else if (
        fileType === "JPG" ||
        fileType === "PNG" ||
        fileType === "IMAGE" ||
        mimeType.startsWith("image/")
      ) {
        extractedText = await this.extractTextFromImage(file, mimeType);
      } else if (fileType === "DOCX" || mimeType.includes("word")) {
        // For DOCX, we might need to convert to text first
        // For now, return empty string (can be enhanced later)
        console.warn("[OpenAI] DOCX text extraction not yet implemented");
        extractedText = "";
      } else {
        console.warn(`[OpenAI] Unsupported file type for OCR: ${fileType}`);
        extractedText = "";
      }

      // Generate embedding from extracted text
      let embedding = "";
      if (extractedText && extractedText.trim().length > 0) {
        embedding = await this.generateEmbedding(extractedText);
      } else {
        embedding = JSON.stringify([]);
      }

      return {
        extractedText,
        embedding,
      };
    } catch (error: any) {
      console.error("[OpenAI] Error processing document:", error);
      // Return empty values on error - don't block document creation
      return {
        extractedText: "",
        embedding: JSON.stringify([]),
      };
    }
  }

  /**
   * Generate health insights for a single document
   * @param extractedText - Text extracted from the document
   * @param documentType - Type of document (lab, prescription, imaging, billing)
   * @returns Object with status, summary, and hasFullAnalysis flag
   */
  static async generateDocumentInsight(
    extractedText: string,
    documentType: string,
    language: string = 'en'
  ): Promise<{
    status: "normal" | "warning" | "critical" | "none";
    summary: string;
    hasFullAnalysis: boolean;
  }> {
    if (!openai) {
      console.warn("[OpenAI] OpenAI not configured, returning default insight");
      return {
        status: "none",
        summary: "",
        hasFullAnalysis: false,
      };
    }

      const isHindi = language === 'hi';
      
      if (!extractedText || extractedText.trim().length === 0) {
        return {
          status: "none",
          summary: isHindi 
            ? "दस्तावेज़ से कोई पाठ निकाला नहीं जा सका। अंतर्दृष्टि उत्पन्न करने में असमर्थ।"
            : "No text extracted from document. Unable to generate insights.",
          hasFullAnalysis: false,
        };
      }

    try {
      console.log(`[OpenAI] Generating health insight for ${documentType} document (language: ${language})`);

      const languageInstruction = isHindi 
        ? 'IMPORTANT: Respond in Hindi (हिंदी). All text, summaries, and messages must be in Hindi.'
        : 'Respond in English.';
      
      let systemPrompt = "";
      if (documentType === "lab") {
        systemPrompt = `You are a medical AI assistant analyzing lab reports. ${languageInstruction}

Analyze the test results and provide:
1. **status**: "normal" if all values are within normal range, "warning" if some values are slightly elevated/low, "critical" if any values are dangerously high/low
2. **summary**: A concise 2-3 sentence summary highlighting key findings, abnormal values (if any), and recommendations
3. **hasFullAnalysis**: true if detailed analysis is available, false otherwise

Focus on:
- Identifying abnormal test values
- Comparing values to normal ranges
- Highlighting any critical findings
- Providing actionable recommendations

Respond ONLY with a JSON object:
{
  "status": "normal" | "warning" | "critical" | "none",
  "summary": "string",
  "hasFullAnalysis": true or false
}`;
      } else if (documentType === "prescription") {
        systemPrompt = `You are a medical AI assistant analyzing prescriptions. ${languageInstruction}

Analyze the medications and provide:
1. **status**: "normal" if dosages are appropriate, "warning" if there are concerns about interactions or dosages, "critical" if there are serious issues
2. **summary**: A concise 2-3 sentence summary about the medications, dosages, and any important notes
3. **hasFullAnalysis**: true if detailed analysis is available, false otherwise

Focus on:
- Medication names and dosages
- Potential drug interactions
- Compliance recommendations

Respond ONLY with a JSON object:
{
  "status": "normal" | "warning" | "critical" | "none",
  "summary": "string",
  "hasFullAnalysis": true or false
}`;
      } else if (documentType === "imaging") {
        systemPrompt = `You are a medical AI assistant analyzing imaging reports. ${languageInstruction}

Analyze the findings and provide:
1. **status**: "normal" if findings are normal, "warning" if there are minor findings, "critical" if there are significant findings requiring attention
2. **summary**: A concise 2-3 sentence summary of the imaging findings and recommendations
3. **hasFullAnalysis**: true if detailed analysis is available, false otherwise

Focus on:
- Key findings from the imaging study
- Any abnormalities detected
- Recommendations for follow-up

Respond ONLY with a JSON object:
{
  "status": "normal" | "warning" | "critical" | "none",
  "summary": "string",
  "hasFullAnalysis": true or false
}`;
      } else {
        // For billing or other types
        return {
          status: "none",
          summary: isHindi ? "इस दस्तावेज़ प्रकार के लिए स्वास्थ्य अंतर्दृष्टि उपलब्ध नहीं है।" : "Health insights are not available for this document type.",
          hasFullAnalysis: false,
        };
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Analyze this ${documentType} document and provide health insights:\n\n${extractedText.substring(0, 4000)}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const insight = JSON.parse(content);

      console.log(`[OpenAI] Generated document insight:`, insight);

      return {
        status: insight.status || "none",
        summary: insight.summary || "",
        hasFullAnalysis: insight.hasFullAnalysis === true,
      };
    } catch (error: any) {
      console.error("[OpenAI] Error generating document insight:", error);
      const isHindi = language === 'hi';
      return {
        status: "none",
        summary: isHindi 
          ? "इस समय अंतर्दृष्टि उत्पन्न करने में असमर्थ।"
          : "Unable to generate insights at this time.",
        hasFullAnalysis: false,
      };
    }
  }

  /**
   * Generate overall health summary based on multiple documents
   * @param documents - Array of documents with extracted text and metadata
   * @returns Object with status and message for overall health summary
   */
  static async generateHealthSummary(
    documents: Array<{
      type: string;
      extractedText: string;
      date?: string;
      title?: string;
    }>,
    language: string = 'en'
  ): Promise<{
    status: "good" | "warning" | "critical";
    message: string;
  }> {
    const isHindi = language === 'hi';
    
    if (!openai) {
      console.warn("[OpenAI] OpenAI not configured, returning default summary");
      return {
        status: "good",
        message: isHindi 
          ? "AI-संचालित स्वास्थ्य अंतर्दृष्टि प्राप्त करने के लिए लैब रिपोर्ट और चिकित्सा दस्तावेज़ अपलोड करें।"
          : "Upload lab reports and medical documents to get AI-powered health insights.",
      };
    }

    if (!documents || documents.length === 0) {
      return {
        status: "good",
        message: isHindi
          ? "कोई दस्तावेज़ उपलब्ध नहीं है। AI स्वास्थ्य अंतर्दृष्टि शुरू करने के लिए लैब रिपोर्ट अपलोड करें।"
          : "No documents available. Upload lab reports to get started with AI health insights.",
      };
    }

    try {
      console.log(`[OpenAI] Generating health summary for ${documents.length} documents (language: ${language})`);

      // Prepare document summaries for analysis
      const documentSummaries = documents
        .filter((doc) => doc.extractedText && doc.extractedText.trim().length > 0)
        .map((doc) => {
          const textPreview = doc.extractedText.substring(0, 1000);
          return `Type: ${doc.type}\nDate: ${doc.date || "Unknown"}\nTitle: ${doc.title || "Untitled"}\nContent: ${textPreview}...`;
        })
        .join("\n\n---\n\n");

      if (!documentSummaries) {
        return {
          status: "good",
          message: isHindi
            ? "दस्तावेज़ अपलोड किए गए हैं लेकिन अभी तक कोई पाठ निकाला नहीं गया है। कृपया प्रसंस्करण पूरा होने की प्रतीक्षा करें।"
            : "Documents uploaded but no text extracted yet. Please wait for processing to complete.",
        };
      }

      const languageInstruction = isHindi 
        ? 'IMPORTANT: Respond in Hindi (हिंदी). All text, summaries, and messages must be in Hindi.'
        : 'Respond in English.';
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a medical AI assistant providing overall health insights based on a patient's medical documents. ${languageInstruction}

Analyze all the provided documents and generate a concise health summary:
1. **status**: "good" if overall health appears normal, "warning" if there are minor concerns, "critical" if there are serious issues requiring immediate attention
2. **message**: A 2-3 sentence summary highlighting:
   - Overall health status
   - Key findings across all documents
   - General recommendations

Be concise, professional, and actionable. Focus on patterns and trends across documents.

Respond ONLY with a JSON object:
{
  "status": "good" | "warning" | "critical",
  "message": "string"
}`,
          },
          {
            role: "user",
            content: `Analyze these medical documents and provide an overall health summary:\n\n${documentSummaries}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const summary = JSON.parse(content);

      console.log(`[OpenAI] Generated health summary:`, summary);

      return {
        status: summary.status || "good",
        message: summary.message || (isHindi
          ? "आपकी नवीनतम रिपोर्टों के आधार पर, सभी मान सामान्य सीमा के भीतर हैं। स्वस्थ जीवनशैली बनाए रखें!"
          : "Based on your latest reports, all values are within normal range. Keep up the healthy lifestyle!"),
      };
    } catch (error: any) {
      console.error("[OpenAI] Error generating health summary:", error);
      return {
        status: "good",
        message: isHindi
          ? "आपकी नवीनतम रिपोर्टों के आधार पर, सभी मान सामान्य सीमा के भीतर हैं। स्वस्थ जीवनशैली बनाए रखें!"
          : "Based on your latest reports, all values are within normal range. Keep up the healthy lifestyle!",
      };
    }
  }

  /**
   * Extract medications from medical document text
   * @param extractedText - Text extracted from the document
   * @param documentType - Type of document (prescription, lab, imaging, billing)
   * @returns Array of extracted medications with name, dosage, frequency, timing, duration, and instructions
   */
  static async extractMedications(
    extractedText: string,
    documentType: string
  ): Promise<Array<{
    name: string;
    dosage: string;
    frequency: string;
    timing?: string[]; // Optional specific times if mentioned
    duration?: string; // Duration or end date if specified
    instructions?: string; // Instructions like "with food", "before meals"
  }>> {
    if (!openai) {
      console.warn("[OpenAI] OpenAI not configured, returning empty medications array");
      return [];
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return [];
    }

    try {
      console.log(`[OpenAI] Extracting medications from ${documentType} document`);

      const systemPrompt = `You are a medical AI assistant that extracts medication information from medical documents, especially prescriptions.

IMPORTANT: Look carefully for ANY medications, drugs, or medicines mentioned in the document. This includes:
- Prescription medications
- Over-the-counter medications
- Vitamins and supplements (if listed as medications)
- Any drug names, brand names, or generic names
- Medications listed in tables, lists, or prescription forms

For each medication found, extract:
1. **name**: The medication name (e.g., "Paracetamol", "Amoxicillin", "Aspirin 75mg")
2. **dosage**: The dosage amount and form (e.g., "500mg", "1 tablet", "10ml", "75mg")
3. **frequency**: How often to take it (e.g., "twice daily", "3 times a day", "once in the morning", "once daily")
4. **timing**: (Optional) Specific times if mentioned (e.g., ["08:00", "20:00"] for "twice daily at 8am and 8pm")
5. **duration**: (Optional) How long to take it or end date if specified (e.g., "7 days", "until 2024-12-31", "for 2 weeks")
6. **instructions**: (Optional) Special instructions (e.g., "with food", "before meals", "after breakfast", "take with water")

If timing is not explicitly mentioned, leave it as null - it will be inferred from frequency.
If duration is not mentioned, leave it as null.
If frequency is not explicitly stated, infer it from context (e.g., "BD" = twice daily, "TDS" = three times daily, "OD" = once daily).

Return ONLY a JSON object in this exact format:
{
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "frequency": "string",
      "timing": ["HH:MM"] or null,
      "duration": "string" or null,
      "instructions": "string" or null
    }
  ]
}

If no medications are found, return { "medications": [] }.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Extract medications from this ${documentType} document:\n\n${extractedText.substring(0, 4000)}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      
      // Handle both { medications: [...] } and [...] formats
      // The system prompt asks for an array, but with json_object format, it might wrap it
      let medications: any[] = [];
      if (Array.isArray(parsed)) {
        medications = parsed;
      } else if (parsed.medications && Array.isArray(parsed.medications)) {
        medications = parsed.medications;
      } else if (parsed.medication && Array.isArray(parsed.medication)) {
        medications = parsed.medication;
      } else {
        medications = [];
      }
      
      if (!Array.isArray(medications)) {
        console.warn("[OpenAI] Medications extraction returned non-array, returning empty array");
        return [];
      }

      console.log(`[OpenAI] Extracted ${medications.length} medications`);
      return medications;
    } catch (error: any) {
      console.error("[OpenAI] Error extracting medications:", error);
      return [];
    }
  }

  /**
   * Generate chatbot response using GPT-4o
   * @param userMessage - The user's message
   * @param conversationHistory - Previous messages in the conversation
   * @param userContext - User's health data context
   * @param language - User's language preference ('en' | 'hi')
   * @returns AI assistant response
   */
  static async generateChatbotResponse(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userContext: string,
    language: 'en' | 'hi' = 'en'
  ): Promise<string> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      console.log(`[OpenAI] Generating chatbot response (language: ${language})`);
      console.log(`[OpenAI] User message: ${userMessage.substring(0, 100)}...`);
      console.log(`[OpenAI] Conversation history length: ${conversationHistory.length}`);
      console.log(`[OpenAI] User context length: ${userContext.length} characters`);
      
      // Check if hospitals are in context
      const hasHospitals = userContext.includes("=== NEARBY HOSPITALS ===");
      console.log(`[OpenAI] Hospitals in context: ${hasHospitals ? 'YES' : 'NO'}`);
      if (hasHospitals) {
        const hospitalsSection = userContext.split("=== NEARBY HOSPITALS ===")[1]?.split("\n===")[0] || "";
        console.log(`[OpenAI] Hospitals section: ${hospitalsSection.substring(0, 300)}...`);
      }
      
      console.log(`[OpenAI] User context preview (first 1200 chars):\n${userContext.substring(0, 1200)}...`);

      // Build system prompt with user context
      const languageInstruction = language === 'hi' 
        ? "Respond in Hindi (हिंदी). All responses should be in Hindi language."
        : "Respond in English.";

      const systemPrompt = `You are a helpful health assistant for Arogya Vault, a health records management system. Your role is to answer health-related questions based on the user's health data provided in the context below.

⚠️ CRITICAL: You MUST read the entire USER CONTEXT section below. ALL information you need is there. Do NOT say "I don't have that information" if the data exists in the context.

CRITICAL INSTRUCTIONS:
1. **ALWAYS use the information from the user context provided below**. The context contains the user's personal health information including:
   - Patient name, age, gender, blood group
   - Current medications with dosages, frequencies, and timings
   - Recent medical documents with extracted text and AI insights
   - Allergies and chronic conditions (from emergency card)
   - Health summaries and analysis
   - Nearby hospitals and medical facilities (if user location is available) - THIS IS IN THE "=== NEARBY HOSPITALS ===" SECTION

2. **When answering questions about the user's personal information:**
   - If the user asks "what is my name?" or "what's my name?", look for "Name:" in the "=== PATIENT INFORMATION ===" section
   - If the user asks about blood group, look for "Blood Group:" in the "=== PATIENT INFORMATION ===" section (it may be from emergency card or profile)
   - If the user asks about medications, refer to the "=== CURRENT MEDICATIONS ===" section
   - If the user asks about recent analysis, AI analysis, or reports, look in the "=== RECENT MEDICAL DOCUMENTS ===" section for "AI Analysis Summary:" or "Details:"
   - If the user asks about allergies or conditions, refer to the "=== EMERGENCY INFORMATION ===" section
   - IMPORTANT: The emergency card contains critical information including name, blood group, age, allergies, and chronic conditions. Always check both PATIENT INFORMATION and EMERGENCY INFORMATION sections.

3. **When answering questions about nearby hospitals or medical facilities:**
   - CRITICAL: If the user asks ANY question about hospitals, nearby hospitals, medical facilities, or where to go for medical care, you MUST first check if there is a "=== NEARBY HOSPITALS ===" section in the context above.
   - If the "=== NEARBY HOSPITALS ===" section EXISTS and contains hospital listings:
     * You MUST list ALL the hospitals from that section
     * Include: Hospital name, distance in km, full address, phone number (if available), and rating (if available)
     * Format: "1. [Hospital Name] - [Distance] km away\n   Address: [Address]\n   Phone: [Phone] (if available)\n   Rating: [Rating]/5.0 (if available)"
     * For urgent situations, recommend the closest hospital(s) first
     * For specific conditions (like heart problems), recommend hospitals based on distance (closest for emergencies) and ratings (higher rated for quality care)
     * DO NOT say "I don't have that information" - the hospitals ARE in the context, just list them!
   - If the "=== NEARBY HOSPITALS ===" section does NOT exist in the context:
     * Then inform the user that location data is needed to find nearby hospitals
     * Suggest they enable location services or provide their location
   - Examples of questions to handle:
     * "Which hospital is nearby me?" → List hospitals from NEARBY HOSPITALS section
     * "What hospitals are close to me?" → List hospitals from NEARBY HOSPITALS section
     * "Where should I go for [specific condition]?" → List relevant hospitals from NEARBY HOSPITALS section
     * "Which hospital should I visit for [medical issue]?" → List hospitals from NEARBY HOSPITALS section
     * "Find me the nearest hospital" → List the closest hospital(s) from NEARBY HOSPITALS section
     * "Show me hospitals near my location" → List all hospitals from NEARBY HOSPITALS section

4. **Be helpful and informative:**
   - Use the actual data from the context to answer questions
   - If information is available in the context, use it directly - DO NOT say "I don't have that information"
   - Look carefully in ALL sections: PATIENT INFORMATION, CURRENT MEDICATIONS, EMERGENCY INFORMATION, RECENT MEDICAL DOCUMENTS, and NEARBY HOSPITALS
   - For blood group questions: Check the PATIENT INFORMATION section first (it may be listed there from either profile or emergency card)
   - For name questions: Check the PATIENT INFORMATION section (it may be from emergency card as patientName or from profile as name)
   - For AI analysis questions: Look for "AI Analysis Summary:" in the RECENT MEDICAL DOCUMENTS section
   - For hospital questions: Check the NEARBY HOSPITALS section and provide specific details (name, distance, address, phone, rating)
   - Provide specific details from the documents and medications when available
   - If you see the information in the context, ANSWER DIRECTLY - do not say you don't have it

5. **For general health questions (not about the user's personal data):**
   - You can provide general health advice
   - Always include disclaimers that this is not a substitute for professional medical advice
   - Encourage consulting healthcare providers for serious concerns

6. **Language:**
   ${languageInstruction}

7. **Response style:**
   - Be concise, accurate, and empathetic
   - Use the user's actual data when answering personal questions
   - Reference specific documents, medications, or dates when relevant

=== USER CONTEXT (READ THIS ENTIRE SECTION CAREFULLY - IT CONTAINS THE USER'S ACTUAL HEALTH DATA) ===
${userContext}
=== END OF USER CONTEXT ===

CRITICAL REMINDERS - READ CAREFULLY:
1. When the user asks about their personal information (name, medications, reports, analysis), USE THE INFORMATION FROM THE CONTEXT ABOVE.

2. When the user asks about nearby hospitals, medical facilities, or where to go for medical care:
   - FIRST: Search the context above for the text "=== NEARBY HOSPITALS ==="
   - IF you find "=== NEARBY HOSPITALS ===" in the context:
     * The hospitals ARE listed below that section
     * You MUST list ALL hospitals from that section
     * Include: Name, Distance (in km), Address, Phone (if available), Rating (if available)
     * Format each hospital clearly with all available details
     * DO NOT say "I don't have that information" - the hospitals ARE in the context!
   - IF you do NOT find "=== NEARBY HOSPITALS ===" in the context:
     * Then say that location data is needed to find nearby hospitals

3. IMPORTANT: The context above contains ALL available information. If "=== NEARBY HOSPITALS ===" appears in the context, it means hospitals were found and they are listed there. You MUST use that information.

4. For hospital recommendations:
   - Closest hospitals for emergencies
   - Higher rated hospitals for quality care
   - Consider the user's medical condition when recommending

5. NEVER say "I don't have that information" if the "=== NEARBY HOSPITALS ===" section exists in the context above.`;

      // Build messages array
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history (last 10 messages to avoid token limits)
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const assistantResponse = response.choices[0]?.message?.content || "";
      console.log(`[OpenAI] Generated chatbot response: ${assistantResponse.substring(0, 100)}...`);

      return assistantResponse;
    } catch (error: any) {
      console.error("[OpenAI] Error generating chatbot response:", error);
      throw new Error(`Failed to generate chatbot response: ${error.message}`);
    }
  }
}
