import { json, type RequestHandler } from '@sveltejs/kit';
import { generateEditablePPTX } from '$lib/services/editable-pptx-generator';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandData, slideData } = await request.json();
    
    console.log('🎨 Generating editable PPTX...', {
      brandName: brandData.brandName,
      slidesCount: slideData.length,
      slideTypes: slideData.map((s: any) => s.type)
    });
    
    const buffer = await generateEditablePPTX(slideData, brandData);
    
    console.log(`✅ Editable PPTX generated (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${brandData.brandName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Brand'}-Brand-Guidelines.pptx"`,
        'Content-Length': buffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating editable PPTX:', error);
    return json({
      error: 'Failed to generate editable PPTX',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
