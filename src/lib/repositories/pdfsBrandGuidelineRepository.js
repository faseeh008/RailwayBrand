import { db } from '$lib/db';
import { pdfsBrandGuidelines } from '$lib/db/schema.js';
import { eq, and, desc, ilike } from 'drizzle-orm';

export class PdfsBrandGuidelineRepository {
  /**
   * Create a new PDF brand guideline
   */
  async create(guidelineData) {
    const [guideline] = await db
      .insert(pdfsBrandGuidelines)
      .values(guidelineData)
      .returning();
    
    return guideline;
  }

  /**
   * Find by ID
   */
  async findById(id) {
    // Convert string ID to number if needed (serial IDs are integers)
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) {
      return null;
    }
    
    const [guideline] = await db
      .select()
      .from(pdfsBrandGuidelines)
      .where(
        and(
          eq(pdfsBrandGuidelines.id, numericId),
          eq(pdfsBrandGuidelines.isActive, true)
        )
      )
      .limit(1);
    
    return guideline || null;
  }

  /**
   * Find by brand name
   */
  async findByBrandName(brandName) {
    const [guideline] = await db
      .select()
      .from(pdfsBrandGuidelines)
      .where(
        and(
          eq(pdfsBrandGuidelines.brandName, brandName),
          eq(pdfsBrandGuidelines.isActive, true)
        )
      )
      .limit(1);
    
    return guideline || null;
  }

  /**
   * Find all active brand guidelines
   */
  async findAll() {
    return await db
      .select()
      .from(pdfsBrandGuidelines)
      .where(eq(pdfsBrandGuidelines.isActive, true))
      .orderBy(desc(pdfsBrandGuidelines.updatedAt));
  }

  /**
   * List paginated brand guidelines
   */
  async listPaginated(limit = 10, offset = 0) {
    return await db
      .select()
      .from(pdfsBrandGuidelines)
      .where(eq(pdfsBrandGuidelines.isActive, true))
      .orderBy(desc(pdfsBrandGuidelines.updatedAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Update brand guideline by ID
   */
  async updateById(id, updateData) {
    const processedData = { ...updateData };
    
    const [updated] = await db
      .update(pdfsBrandGuidelines)
      .set({
        ...processedData,
        updatedAt: new Date()
      })
      .where(eq(pdfsBrandGuidelines.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Search brand guidelines
   */
  async search(query) {
    return await db
      .select()
      .from(pdfsBrandGuidelines)
      .where(
        and(
          eq(pdfsBrandGuidelines.isActive, true),
          ilike(pdfsBrandGuidelines.brandName, `%${query}%`)
        )
      )
      .orderBy(desc(pdfsBrandGuidelines.updatedAt));
  }

  /**
   * Delete (soft delete by setting isActive to false)
   */
  async deleteById(id) {
    const [deleted] = await db
      .update(pdfsBrandGuidelines)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(pdfsBrandGuidelines.id, id))
      .returning();
    
    return deleted;
  }

  /**
   * Check if exists
   */
  async exists(brandName) {
    const [guideline] = await db
      .select({ id: pdfsBrandGuidelines.id })
      .from(pdfsBrandGuidelines)
      .where(
        and(
          eq(pdfsBrandGuidelines.brandName, brandName),
          eq(pdfsBrandGuidelines.isActive, true)
        )
      )
      .limit(1);
    
    return !!guideline;
  }
}

