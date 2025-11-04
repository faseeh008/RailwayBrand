import { eq, ilike, and, desc } from 'drizzle-orm';
import { db, brandGuidelines } from '$lib/db';

export class BrandGuidelineRepository {
  /**
   * Helper to build isActive filter with fallback
   * @private
   */
  _buildIsActiveFilter() {
    // Try to use isActive if available, otherwise return empty condition
    try {
      // Check if isActive property exists on brandGuidelines
      if (brandGuidelines.isActive) {
        return eq(brandGuidelines.isActive, true);
      }
    } catch (e) {
      // Property doesn't exist
    }
    return undefined;
  }

  /**
   * Helper to wrap query with isActive filter, with fallback
   * @private
   */
  async _withIsActiveFallback(queryFn) {
    try {
      return await queryFn(this._buildIsActiveFilter());
    } catch (error) {
      // If isActive column doesn't exist, retry without the filter
      if (error.message?.includes('is_active') || error.message?.includes('isActive') || error.code === '42601') {
        console.log('⚠️ isActive column not found, retrying query without filter');
        return await queryFn(undefined);
      }
      throw error;
    }
  }
  /**
   * Create a new brand guideline
   */
  async create(guidelineData) {
    // Stringify JSON fields if they are objects (schema expects text/JSON strings)
    const processedData = { ...guidelineData };
    if (processedData.colors && typeof processedData.colors === 'object') {
      processedData.colors = JSON.stringify(processedData.colors);
    }
    if (processedData.typography && typeof processedData.typography === 'object') {
      processedData.typography = JSON.stringify(processedData.typography);
    }
    if (processedData.structuredData && typeof processedData.structuredData === 'object') {
      processedData.structuredData = JSON.stringify(processedData.structuredData);
    }
    if (processedData.logoFiles && typeof processedData.logoFiles === 'object') {
      processedData.logoFiles = JSON.stringify(processedData.logoFiles);
    }
    if (processedData.contactInfo && typeof processedData.contactInfo === 'object') {
      processedData.contactInfo = JSON.stringify(processedData.contactInfo);
    }
    if (processedData.exportFiles && typeof processedData.exportFiles === 'object') {
      processedData.exportFiles = JSON.stringify(processedData.exportFiles);
    }
    
    // Ensure content field exists (required by schema)
    if (!processedData.content) {
      processedData.content = processedData.structuredData || JSON.stringify({ brandName: processedData.brandName });
    }
    
    const [guideline] = await db
      .insert(brandGuidelines)
      .values(processedData)
      .returning();
    
    return guideline;
  }

  /**
   * Check if brand guideline exists by brand name
   */
  async exists(brandName) {
    const guideline = await this.findByBrandName(brandName);
    return !!guideline;
  }

  /**
   * Find brand guideline by brand name (case-insensitive)
   */
  async findByBrandName(brandName) {
    try {
      // First, try query with isActive filter (if column exists)
      try {
        const [guideline] = await db
          .select()
          .from(brandGuidelines)
          .where(
            and(
              eq(brandGuidelines.brandName, brandName),
              eq(brandGuidelines.isActive, true)
            )
          )
          .limit(1);
        
        if (guideline) {
          return guideline;
        }
      } catch (error) {
        // If isActive column doesn't exist yet, fall back to query without it
        if (error.message?.includes('is_active') || error.message?.includes('isActive') || error.code === '42601') {
          console.log('⚠️ isActive column not found, querying without it');
          const [guideline] = await db
            .select()
            .from(brandGuidelines)
            .where(eq(brandGuidelines.brandName, brandName))
            .limit(1);
          
          if (guideline) {
            return guideline;
          }
        } else {
          throw error; // Re-throw if it's a different error
        }
      }
      
      // If no exact match, try case-insensitive search
      try {
        const allGuidelines = await db
          .select()
          .from(brandGuidelines)
          .where(eq(brandGuidelines.isActive, true));
        
        const found = allGuidelines.find(g => 
          g.brandName && brandName && g.brandName.toLowerCase() === brandName.toLowerCase()
        );
        
        return found || null;
      } catch (error) {
        // If isActive doesn't exist, search all records
        if (error.message?.includes('is_active') || error.message?.includes('isActive') || error.code === '42601') {
          const allGuidelines = await db
            .select()
            .from(brandGuidelines);
          
          const found = allGuidelines.find(g => 
            g.brandName && brandName && g.brandName.toLowerCase() === brandName.toLowerCase()
          );
          
          return found || null;
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  /**
   * Find brand guideline by ID
   */
  async findById(id) {
    try {
      const [guideline] = await db
        .select()
        .from(brandGuidelines)
        .where(
          and(
            eq(brandGuidelines.id, id),
            eq(brandGuidelines.isActive, true)
          )
        )
        .limit(1);
      
      return guideline || null;
    } catch (error) {
      // If isActive column doesn't exist, query without it
      if (error.message?.includes('is_active') || error.message?.includes('isActive') || error.code === '42601') {
        const [guideline] = await db
          .select()
          .from(brandGuidelines)
          .where(eq(brandGuidelines.id, id))
          .limit(1);
        
        return guideline || null;
      }
      throw error;
    }
  }

  /**
   * Find all brand guidelines
   */
  async findAll() {
    return await this._withIsActiveFallback(async (isActiveFilter) => {
      let query = db.select().from(brandGuidelines);
      if (isActiveFilter) {
        query = query.where(isActiveFilter);
      }
      return await query.orderBy(desc(brandGuidelines.updatedAt));
    });
  }

  /**
   * Get paginated brand guidelines
   */
  async listPaginated(limit = 10, offset = 0) {
    return await this._withIsActiveFallback(async (isActiveFilter) => {
      let query = db.select().from(brandGuidelines);
      if (isActiveFilter) {
        query = query.where(isActiveFilter);
      }
      return await query
        .orderBy(desc(brandGuidelines.updatedAt))
        .limit(limit)
        .offset(offset);
    });
  }

  /**
   * Update brand guideline by ID
   */
  async updateById(id, updateData) {
    // Convert string timestamps to Date objects
    const processedData = { ...updateData };
    if (processedData.lastUpdated && typeof processedData.lastUpdated === 'string') {
      processedData.lastUpdated = new Date(processedData.lastUpdated);
    }
    if (processedData.updatedAt && typeof processedData.updatedAt === 'string') {
      processedData.updatedAt = new Date(processedData.updatedAt);
    }
    
    // Stringify JSON fields if they are objects (schema expects text/JSON strings)
    if (processedData.colors && typeof processedData.colors === 'object') {
      processedData.colors = JSON.stringify(processedData.colors);
    }
    if (processedData.typography && typeof processedData.typography === 'object') {
      processedData.typography = JSON.stringify(processedData.typography);
    }
    if (processedData.structuredData && typeof processedData.structuredData === 'object') {
      processedData.structuredData = JSON.stringify(processedData.structuredData);
    }
    if (processedData.logoFiles && typeof processedData.logoFiles === 'object') {
      processedData.logoFiles = JSON.stringify(processedData.logoFiles);
    }
    if (processedData.contactInfo && typeof processedData.contactInfo === 'object') {
      processedData.contactInfo = JSON.stringify(processedData.contactInfo);
    }
    if (processedData.exportFiles && typeof processedData.exportFiles === 'object') {
      processedData.exportFiles = JSON.stringify(processedData.exportFiles);
    }
    
    const [updated] = await db
      .update(brandGuidelines)
      .set({
        ...processedData,
        updatedAt: new Date()
      })
      .where(eq(brandGuidelines.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Update brand guideline by brand name
   */
  async update(brandName, updateData) {
    const [updated] = await db
      .update(brandGuidelines)
      .set({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          ilike(brandGuidelines.brandName, brandName),
          eq(brandGuidelines.isActive, true)
        )
      )
      .returning();
    
    return updated;
  }

  /**
   * Soft delete brand guideline by ID
   */
  async deleteById(id) {
    const [deleted] = await db
      .update(brandGuidelines)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(eq(brandGuidelines.id, id))
      .returning();
    
    return deleted;
  }

  /**
   * Soft delete brand guideline by brand name
   */
  async delete(brandName) {
    const [deleted] = await db
      .update(brandGuidelines)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          ilike(brandGuidelines.brandName, brandName),
          eq(brandGuidelines.isActive, true)
        )
      )
      .returning();
    
    return deleted;
  }

  /**
   * Search brand guidelines by company name or industry
   */
  async search(query) {
    return await db
      .select()
      .from(brandGuidelines)
      .where(
        and(
          eq(brandGuidelines.isActive, true),
          ilike(brandGuidelines.companyName, `%${query}%`)
        )
      )
      .orderBy(desc(brandGuidelines.updatedAt));
  }

  /**
   * Get brand guidelines by industry
   */
  async findByIndustry(industry) {
    return await db
      .select()
      .from(brandGuidelines)
      .where(
        and(
          eq(brandGuidelines.isActive, true),
          ilike(brandGuidelines.industry, industry)
        )
      )
      .orderBy(desc(brandGuidelines.updatedAt));
  }

  /**
   * Get brand guidelines count
   */
  async count() {
    try {
      const result = await db
        .select({ count: brandGuidelines.id })
        .from(brandGuidelines)
        .where(eq(brandGuidelines.isActive, true));
      
      return result.length;
    } catch (error) {
      // If isActive column doesn't exist, count all
      if (error.message?.includes('is_active') || error.message?.includes('isActive') || error.code === '42601') {
        const result = await db
          .select({ count: brandGuidelines.id })
          .from(brandGuidelines);
        
        return result.length;
      }
      throw error;
    }
  }

  /**
   * Get recent brand guidelines
   */
  async findRecent(limit = 10) {
    try {
      return await db
        .select()
        .from(brandGuidelines)
        .where(eq(brandGuidelines.isActive, true))
        .orderBy(desc(brandGuidelines.updatedAt))
        .limit(limit);
    } catch (error) {
      // If isActive column doesn't exist, return all recent
      if (error.message?.includes('is_active') || error.message?.includes('isActive') || error.code === '42601') {
        return await db
          .select()
          .from(brandGuidelines)
          .orderBy(desc(brandGuidelines.updatedAt))
          .limit(limit);
      }
      throw error;
    }
  }
}
