<script lang="ts">
  import { onMount } from 'svelte';
  import { createEditableSlides } from '$lib/services/editable-slide-factory';
  import EnhancedColorPaletteSlide from '$lib/components/editable-slides/EnhancedColorPaletteSlide.svelte';
  import interact from 'interactjs';

  let slides: Array<{ name: string; html: string }> = [];
  let brandData: any = null;
  let currentSlide = 0;
  let isEditable = false;
  let editMode: 'text' | 'layout' = 'text'; // New: Edit mode toggle
  let loading = true;
  let error: string | null = null;
  let isDownloading = false;
  let iframeRef: HTMLIFrameElement;
  let selectedTemplateSet = 'default'; // Current template set
  let isSwitchingTemplate = false;
  let interactInstance: any = null; // Store interact instance for cleanup
  let originalSlidesSnapshot: Array<{ name: string; html: string }> = []; // Backup for revert
  let isInjectingInteract = false; // Prevent duplicate script injection
  let showExportDropdown = false; // Control export dropdown visibility
  let exportDropdownRef: HTMLDivElement; // Reference to export dropdown
  
  // Available template sets (only complete ones)
  const templateSets = [
    { value: 'default', label: 'Classic (Default)', description: 'Arial font, gradient backgrounds' },
    { value: 'modern-minimal', label: 'Modern Minimal', description: 'Helvetica Neue, clean whitespace' },
    { value: 'corporate-professional', label: 'Corporate Professional', description: 'Navy blue, structured layout' },
    { value: 'creative-bold', label: 'Creative Bold', description: 'Vibrant colors, dynamic layouts' }
    // elegant-sophisticated only has 1/12 files, so not included
  ];

  onMount(async () => {
    try {
      console.log('🔍 Checking sessionStorage for preview_brand_data...');
      const raw = sessionStorage.getItem('preview_brand_data');
      console.log('🔍 Raw sessionStorage data:', raw?.substring(0, 200) + '...');
      
      if (!raw) {
        error = 'No preview data found. Generate steps first.';
        loading = false;
        return;
      }

      brandData = JSON.parse(raw);
      
      // Try to get guideline ID from database using brand name
      let guidelineId = brandData.id || brandData.guidelineId;
      
      if (!guidelineId) {
        console.log('🔍 No guideline ID in brandData, fetching from database...');
        try {
          const response = await fetch(`/api/brand-guidelines/by-name?brandName=${encodeURIComponent(brandData.brandName)}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.guideline) {
              guidelineId = result.guideline.id;
              console.log('✅ Found guideline ID from database:', guidelineId);
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch guideline ID from database:', error);
        }
      }
      
      if (guidelineId) {
        sessionStorage.setItem('current_guideline_id', guidelineId);
        console.log('✅ Stored guideline ID for database sync:', guidelineId);
        
        // Fetch logo files from database if not already in brandData
        if (!brandData.logoFiles || brandData.logoFiles.length === 0) {
          console.log('🔍 Fetching logo files from database using guidelineId...');
          try {
            const response = await fetch(`/api/brand-guidelines/${guidelineId}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.guideline?.logoFiles) {
                try {
                  const logoFiles = JSON.parse(result.guideline.logoFiles);
                  brandData.logoFiles = logoFiles;
                  console.log('✅ Loaded logo files from database:', logoFiles.length);
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse logo files from database:', parseError);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch logo files from database:', error);
          }
        }
      } else {
        console.warn('⚠️ No guideline ID found in brandData or database:', {
          hasId: !!brandData.id,
          hasGuidelineId: !!brandData.guidelineId,
          brandDataKeys: Object.keys(brandData),
          brandName: brandData.brandName
        });
      }
      
      console.log('🔍 Frontend sending to preview API:', {
        brandName: brandData.brand_name || brandData.brandName,
        hasStepHistory: !!brandData.stepHistory,
        stepHistoryLength: brandData.stepHistory?.length || 0,
        stepHistoryPreview: brandData.stepHistory?.slice(0, 2) || []
      });
      
      // Check if slides already exist in stepHistory
      const existingSlidesStep = brandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
      if (existingSlidesStep?.content) {
        console.log('📋 Found existing slides in stepHistory, loading them...');
        try {
          const savedSlides = JSON.parse(existingSlidesStep.content);
          slides = savedSlides;
          // Initialize snapshot with loaded slides
          originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
          console.log('✅ Loaded existing slides from stepHistory:', slides.length);
          loading = false;
          return; // Use existing slides, no need to regenerate
        } catch (parseError) {
          console.warn('⚠️ Failed to parse saved slides, regenerating...', parseError);
        }
      }
      
      // Generate HTML slides using the original API
      const res = await fetch('/api/preview-slides-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandData.brand_name || brandData.brandName,
          brandDomain: brandData.brand_domain || brandData.brandDomain,
          contact: brandData.contact,
          stepHistory: brandData.stepHistory,
          logoFiles: brandData.logoFiles,
          logoUrl: brandData.logoUrl,
          logo: brandData.logo
        })
      });
      
      console.log('🔍 Preview API response status:', res.status);
      const data = await res.json();
      console.log('🔍 Preview API response data:', {
        success: data.success,
        slidesCount: data.slides?.length || 0,
        error: data.error,
        hasUpdatedStepHistory: !!data.updatedStepHistory
      });
      
      if (!data.success) throw new Error(data.error || 'Failed to load slides');
      slides = data.slides;
      
      // Initialize snapshot with loaded slides
      originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
      
      // Don't update sessionStorage with HTML slides - would exceed quota
      // Data is already stored in database via saveSlidesToDatabase()
      // We can fetch it later if needed using guidelineId
      console.log('💾 Skipping sessionStorage update - slides stored in DB');
      
      // Handle clicking outside export dropdown to close it
      document.addEventListener('click', (e) => {
        if (showExportDropdown && exportDropdownRef && !exportDropdownRef.contains(e.target as Node)) {
          showExportDropdown = false;
        }
      });
    } catch (e: any) {
      error = e?.message || 'Failed to load preview';
    } finally {
      loading = false;
    }
  });

  function nextSlide() {
    // If currently editing, save changes before switching slides
    if (isEditable) {
      updateSlideContent();
    }
    if (currentSlide < slides.length - 1) {
      currentSlide++;
    }
  }
  
  function prevSlide() {
    // If currently editing, save changes before switching slides
    if (isEditable) {
      updateSlideContent();
    }
    if (currentSlide > 0) {
      currentSlide--;
    }
  }
  
  async function toggleEdit() {
    if (isEditable) {
      // Currently editing, so save and stop editing
      if (iframeRef) {
        await updateSlideContent();
      }
      isEditable = false;
      
      // Clean up interact instances
      try {
        const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
        const iframeWindow = iframeRef.contentWindow;
        if (iframeDoc && iframeWindow && (iframeWindow as any).interact) {
          const iframeInteract = (iframeWindow as any).interact;
          // Unset interact instances
          const allElements = iframeDoc.querySelectorAll('.draggable-element');
          allElements.forEach((el: any) => {
            iframeInteract(el).unset();
          });
          console.log('🧹 Cleaned up', allElements.length, 'interact instances');
        }
      } catch (error) {
        console.warn('Error cleaning up interact instances:', error);
      }
      interactInstance = null;
      
      // Show saving message
      const savingMsg = document.createElement('div');
      savingMsg.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
      savingMsg.textContent = '💾 Saving changes...';
      document.body.appendChild(savingMsg);
      
      // Create clean HTML without editing styles and reload iframe
      if (iframeRef && slides[currentSlide]) {
        const cleanHtml = createCleanHtml(slides[currentSlide].html);
        slides[currentSlide].html = cleanHtml; // Update the slide with clean HTML
        iframeRef.srcdoc = cleanHtml;
        
        // Update sessionStorage with clean HTML
        const updatedBrandData = { ...brandData };
        const slidesStep = updatedBrandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
        if (slidesStep) {
          slidesStep.content = JSON.stringify(slides);
          sessionStorage.setItem('preview_brand_data', JSON.stringify(updatedBrandData));
          brandData = updatedBrandData;
        }
      }
      
      // Sync to database and show success message
      try {
        await syncToDatabase(brandData);
        
        // Update snapshot to current saved state
        originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
        console.log('📸 Updated snapshot after saving');
        
        // Remove saving message and show success
        savingMsg.remove();
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
        successMsg.textContent = '✅ Changes saved and synced!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } catch (error) {
        // Remove saving message and show error
        savingMsg.remove();
        const errorMsg = document.createElement('div');
        errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
        errorMsg.textContent = '⚠️ Changes saved locally, sync failed';
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      }
    } else {
      // Not editing, so start editing
      // Create a snapshot of original slides before editing
      originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
      console.log('📸 Created snapshot of original slides for revert');
      
      isEditable = true;
      
      // Wait for iframe to be ready, then make editable
      setTimeout(() => {
        if (iframeRef) {
          try {
            const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
            if (iframeDoc) {
              if (editMode === 'text') {
                // TEXT MODE: Original contentEditable functionality
                enableTextEditing(iframeDoc);
              } else if (editMode === 'layout') {
                // LAYOUT MODE: Interact.js drag and resize
                enableLayoutEditing(iframeDoc);
              }
            }
          } catch (error) {
            console.warn('Could not make iframe editable:', error);
          }
        }
      }, 200);
    }
  }
  
  // Revert all changes to original state
  async function revertChanges() {
    if (!originalSlidesSnapshot || originalSlidesSnapshot.length === 0) {
      console.warn('No snapshot available to revert to');
      return;
    }
    
    // Confirm with user
    const confirmed = confirm('Are you sure you want to discard all your edits? This cannot be undone.');
    if (!confirmed) return;
    
    try {
      // Restore original slides
      slides = originalSlidesSnapshot.map(slide => ({ name: slide.name, html: slide.html }));
      
      // If currently editing, reload the iframe with original content
      if (iframeRef && slides[currentSlide]) {
        iframeRef.srcdoc = slides[currentSlide].html;
      }
      
      // If editing was active, stop editing
      if (isEditable) {
        isEditable = false;
        
        // Clean up interact instances
        try {
          const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
          const iframeWindow = iframeRef.contentWindow;
          if (iframeDoc && iframeWindow && (iframeWindow as any).interact) {
            const iframeInteract = (iframeWindow as any).interact;
            const allElements = iframeDoc.querySelectorAll('.draggable-element');
            allElements.forEach((el: any) => {
              iframeInteract(el).unset();
            });
          }
        } catch (error) {
          console.warn('Error cleaning up interact instances:', error);
        }
        interactInstance = null;
      }
      
      // Update sessionStorage with original slides
      const updatedBrandData = { ...brandData };
      const slidesStep = updatedBrandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
      if (slidesStep) {
        slidesStep.content = JSON.stringify(slides);
        sessionStorage.setItem('preview_brand_data', JSON.stringify(updatedBrandData));
        brandData = updatedBrandData;
      }
      
      // Sync original to database
      await syncToDatabase(brandData);
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
      successMsg.textContent = '✅ Changes reverted to original state';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
      
      console.log('✅ All changes reverted successfully');
    } catch (error) {
      console.error('Error reverting changes:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 shadow-lg';
      errorMsg.textContent = '⚠️ Failed to revert changes';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
    }
  }
  
  // New function: Enable text editing mode
  function enableTextEditing(iframeDoc: Document) {
    // Add contenteditable to text elements only, excluding color swatches and other visual elements
    const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span');
    // Also include divs but exclude color swatches and other visual elements
    const allDivs = iframeDoc.querySelectorAll('div');
    const editableDivs = Array.from(allDivs).filter((div: any) => {
      // Exclude color swatches, dividers, and other visual elements
      return !div.classList.contains('color-swatch') && 
             !div.classList.contains('divider') &&
             !div.classList.contains('logo-demo') &&
             !div.classList.contains('strike') &&
             !div.style.backgroundColor && // Exclude divs with background colors
             div.textContent.trim().length > 0; // Only include divs with text content
    });
    
    const allEditableElements = [...textElements, ...editableDivs];
    
    allEditableElements.forEach((element: any) => {
      element.contentEditable = 'true';
      element.style.outline = 'none';
      // Use box-shadow instead of border to avoid layout shifts
      element.style.boxShadow = '0 0 0 1px #3b82f6';
      element.style.borderRadius = '2px';
      // Remove padding and margin changes to prevent layout shifts
      element.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
      element.style.transition = 'box-shadow 0.2s ease';
    });
    
    // Add event listeners for changes with focused editing
    allEditableElements.forEach((element: any) => {
      element.addEventListener('focus', () => {
        // Only highlight the focused element more prominently
        element.style.boxShadow = '0 0 0 2px #3b82f6';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
      });
      
      element.addEventListener('blur', () => {
        // Reset to subtle editing style
        element.style.boxShadow = '0 0 0 1px #3b82f6';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.02)';
        updateSlideContent();
      });
      
      element.addEventListener('input', () => {
        updateSlideContent();
      });
    });
  }
  
  // New function: Enable layout editing mode with Interact.js
  function enableLayoutEditing(iframeDoc: Document) {
    console.log('🎨 Enabling layout editing mode');
    
    // CRITICAL: Get interact instance from iframe's window
    const iframeWindow = iframeDoc.defaultView || iframeRef.contentWindow;
    
    // If interact isn't available in iframe, inject it via script tag
    if (!iframeWindow || !(iframeWindow as any).interact) {
      if (isInjectingInteract) {
        console.warn('⚠️ Already injecting interact.js, waiting...');
        return;
      }
      isInjectingInteract = true;
      console.warn('⚠️ Interact.js not in iframe, injecting via script...');
      
      // Create script tag to load interact.js from CDN
      const script = iframeDoc.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/interactjs@1.10.27/dist/interact.min.js';
      script.onload = () => {
        console.log('✅ Interact.js loaded in iframe, now enabling layout editing');
        isInjectingInteract = false;
        // Retry enabling layout after script loads
        enableLayoutEditingRetry(iframeDoc);
      };
      script.onerror = () => {
        console.error('❌ Failed to load interact.js, falling back to parent instance');
        isInjectingInteract = false;
        // Fallback: try to use parent's interact
        try {
          (iframeWindow as any).interact = interact;
          enableLayoutEditingRetry(iframeDoc);
        } catch (e) {
          console.error('❌ Could not inject interact from parent:', e);
        }
      };
      iframeDoc.head.appendChild(script);
      return; // Exit early, will retry after script loads
    }
    const iframeInteract = (iframeWindow as any).interact;
    
    // Get all editable elements (similar filtering as text mode)
    const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, img');
    const allDivs = iframeDoc.querySelectorAll('div');
    const editableDivs = Array.from(allDivs).filter((div: any) => {
      // Exclude container divs and special elements
      const excludedClasses = [
        'color-swatch', 'divider', 'logo-demo', 'strike',
        'slide', 'header', 'content', 'cards', 'cards-row',
        'positioning-grid', 'applications-grid', 'intro-box'
      ];
      return !excludedClasses.some(className => div.classList.contains(className));
    });
    
    const allEditableElements = [...textElements, ...editableDivs];
    
    console.log(`🎯 Found ${allEditableElements.length} elements to make draggable:`, 
      allEditableElements.map(el => el.className || el.tagName)
    );
    
    // Make elements draggable and resizable
    allEditableElements.forEach((element: any) => {
      // Add draggable class for identification
      element.classList.add('draggable-element');
      
      // Ensure element has position style for dragging
      const computedStyle = iframeDoc.defaultView?.getComputedStyle(element) || element.style;
      if (computedStyle.position === 'static' || !computedStyle.position) {
        element.style.position = 'relative';
      }
      
      // Make draggable and resizable with Interact.js (use iframe's instance!)
      const interactInstance = iframeInteract(element).draggable({
        inertia: false,
        autoScroll: false,
        listeners: {
          start(event) {
            event.target.classList.add('dragging');
            updateSlideContent();
          },
          move(event) {
            const target = event.target;
            const x = (parseFloat(target.dataset.x) || 0) + event.dx;
            const y = (parseFloat(target.dataset.y) || 0) + event.dy;
            
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.dataset.x = x.toString();
            target.dataset.y = y.toString();
            
            updateSlideContent();
          },
          end(event) {
            event.target.classList.remove('dragging');
          }
        }
      }).resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        listeners: {
          move(event) {
            const target = event.target;
            let x = (parseFloat(target.dataset.x) || 0);
            let y = (parseFloat(target.dataset.y) || 0);
            
            // Update width and height
            target.style.width = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';
            
            // Handle position changes from resizing
            x += event.deltaRect.left;
            y += event.deltaRect.top;
            
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.dataset.x = x.toString();
            target.dataset.y = y.toString();
            
            updateSlideContent();
          },
          end(event) {
            updateSlideContent();
          }
        },
        modifiers: [
          iframeInteract.modifiers.restrictSize({
            min: { width: 50, height: 30 }
          })
        ]
      }).on('click', (event) => {
        // Highlight selected element
        allEditableElements.forEach((el: any) => el.classList.remove('selected'));
        event.target.classList.add('selected');
      });
    });
    
    // Add CSS for drag handles and selection
    const style = iframeDoc.createElement('style');
    style.textContent = `
      .draggable-element {
        cursor: grab !important;
        position: relative !important;
        transition: none !important;
        touch-action: none !important;
      }
      
      .draggable-element:hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px;
      }
      
      .draggable-element.dragging {
        cursor: grabbing !important;
        opacity: 0.8;
        z-index: 1000;
      }
      
      .draggable-element.selected {
        outline: 3px solid #3b82f6 !important;
        outline-offset: 2px;
      }
      
      /* Interact.js resize handles styling */
      .draggable-element[style*="width"] {
        box-sizing: border-box !important;
      }
      
      /* Interact.js cursor styles for resize edges */
      body.interact-resize-bottom,
      body.interact-resize-top {
        cursor: ns-resize !important;
      }
      
      body.interact-resize-left,
      body.interact-resize-right {
        cursor: ew-resize !important;
      }
      
      body.interact-resize-left-top,
      body.interact-resize-right-bottom {
        cursor: nwse-resize !important;
      }
      
      body.interact-resize-left-bottom,
      body.interact-resize-right-top {
        cursor: nesw-resize !important;
      }
      
      /* Additional styling for interact.js resize handles */
      [data-ctrl] {
        background: rgba(59, 130, 246, 0.5) !important;
        border: 1px solid #3b82f6 !important;
        border-radius: 2px !important;
        pointer-events: auto !important;
      }
      
      [data-ctrl]:hover {
        background: rgba(59, 130, 246, 0.8) !important;
        transform: scale(1.2);
        transition: transform 0.2s ease;
      }
    `;
    iframeDoc.head.appendChild(style);
    
    console.log('✅ Layout editing mode enabled for', allEditableElements.length, 'elements');
  }
  
  // Retry function after interact.js loads
  function enableLayoutEditingRetry(iframeDoc: Document) {
    console.log('🔄 Retrying to enable layout editing after interact.js load...');
    enableLayoutEditing(iframeDoc);
  }
  
  // Toggle between text and layout modes
  function toggleEditMode() {
    if (isEditable) {
      // If currently editing, save first
      updateSlideContent();
    }
    editMode = editMode === 'text' ? 'layout' : 'text';
    console.log('🔄 Edit mode switched to:', editMode);
    
    // If was editing, restart editing with new mode
    if (isEditable) {
      isEditable = false;
      setTimeout(() => {
        isEditable = true;
      }, 100);
    }
  }
  
  async function updateSlideContent() {
    if (iframeRef) {
      try {
        const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
        if (iframeDoc) {
          // Update the slide HTML with edited content
          const newHtml = iframeDoc.documentElement.outerHTML;
          slides[currentSlide].html = newHtml;
          
          // Update sessionStorage immediately
          const updatedBrandData = { ...brandData };
          const slidesStep = updatedBrandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
          if (slidesStep) {
            slidesStep.content = JSON.stringify(slides);
            sessionStorage.setItem('preview_brand_data', JSON.stringify(updatedBrandData));
            brandData = updatedBrandData;
            console.log('✅ Slide content updated and saved to sessionStorage');
            
            // Auto-sync to database (debounced)
            await syncToDatabase(updatedBrandData);
          }
        }
      } catch (error) {
        console.warn('Could not update slide content:', error);
      }
    }
  }
  
  // Immediate database sync function
  async function syncToDatabase(updatedBrandData: any) {
    try {
      const guidelineId = sessionStorage.getItem('current_guideline_id');
      if (guidelineId) {
        console.log('🔄 Immediately syncing slides to database...', {
          guidelineId,
          slidesCount: slides.length,
          firstSlideName: slides[0]?.name || 'Unknown'
        });
        const response = await fetch(`/api/brand-guidelines/${guidelineId}/sync-slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slides: slides,
            stepHistory: updatedBrandData.stepHistory
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Slides immediately synced to database:', result.message);
        } else {
          const error = await response.text();
          console.warn('⚠️ Failed to immediately sync slides to database:', error);
        }
      } else {
        console.warn('⚠️ No guideline ID found for database sync');
      }
    } catch (error) {
      console.warn('⚠️ Error immediately syncing to database:', error);
    }
  }
  
  function createCleanHtml(html: string): string {
    // Remove editing UI styles but preserve layout styles (position, width, height, transform)
    return html
      .replace(/contenteditable="true"/g, 'contenteditable="false"')
      .replace(/class="draggable-element selected"/g, '')
      .replace(/class="draggable-element dragging"/g, '')
      .replace(/class="draggable-element"/g, '')
      .replace(/data-x="[^"]*"/g, '') // Remove interact.js data attributes
      .replace(/data-y="[^"]*"/g, '')
      // Remove box-shadow editing outlines
      .replace(/style="[^"]*box-shadow:\s*0\s+0\s+0\s+1px\s+#3b82f6[^"]*"/g, 'style=""')
      .replace(/style="[^"]*box-shadow:\s*0\s+0\s+0\s+2px\s+#3b82f6[^"]*"/g, 'style=""')
      // Remove background-color editing tints
      .replace(/style="[^"]*background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.02\)[^"]*"/g, 'style=""')
      .replace(/style="[^"]*background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.05\)[^"]*"/g, 'style=""')
      // Remove border-radius editing style
      .replace(/style="[^"]*border-radius:\s*2px[^"]*"/g, 'style=""')
      // Remove transition editing styles
      .replace(/style="[^"]*transition:\s*box-shadow\s+0\.2s\s+ease[^"]*"/g, 'style=""')
      .replace(/style="[^"]*transition:\s*none[^"]*"/g, 'style=""')
      // Remove outline editing styles
      .replace(/style="[^"]*outline:\s*none[^"]*"/g, 'style=""')
      .replace(/style="[^"]*outline:\s*[^";]*[^"]*"/g, (match) => {
        // Keep other styles, just remove outline
        return match.replace(/outline:\s*[^;]+;?\s*/g, '');
      })
      // Clean up in complex style attributes (preserve layout styles)
      .replace(/style="([^"]*)"/g, (match, styles) => {
        let cleanStyle = styles
          // Remove editing UI styles
          .replace(/box-shadow:\s*0\s+0\s+0\s+1px\s+#3b82f6;?\s*/g, '')
          .replace(/box-shadow:\s*0\s+0\s+0\s+2px\s+#3b82f6;?\s*/g, '')
          .replace(/background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.02\);?\s*/g, '')
          .replace(/background-color:\s*rgba\(59,\s*130,\s*246,\s*0\.05\);?\s*/g, '')
          .replace(/border-radius:\s*2px;?\s*/g, '')
          .replace(/transition:\s*box-shadow\s+0\.2s\s+ease;?\s*/g, '')
          .replace(/transition:\s*none;?\s*/g, '')
          .replace(/outline:\s*none;?\s*/g, '')
          .replace(/outline:\s*[^;]+;?\s*/g, '')
          .replace(/outline-offset:\s*[^;]+;?\s*/g, '')
          .replace(/cursor:\s*move;?\s*/g, '')
          .replace(/opacity:\s*0\.8;?\s*/g, '')
          .replace(/z-index:\s*1000;?\s*/g, '')
          // Clean up multiple semicolons and trailing semicolons
          .replace(/;\s*;+/g, ';')
          .replace(/^;\s*/, '')
          .replace(/\s*;$/, '')
          .trim();
        
        return cleanStyle ? `style="${cleanStyle}"` : '';
      });
  }
  
  async function saveChanges() {
    // Update sessionStorage with current slides
    const updatedBrandData = { ...brandData };
    const slidesStep = updatedBrandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
    if (slidesStep) {
      slidesStep.content = JSON.stringify(slides);
      sessionStorage.setItem('preview_brand_data', JSON.stringify(updatedBrandData));
      brandData = updatedBrandData;
    }
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
    successMsg.textContent = 'Changes saved successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  }


  async function downloadPPTX() {
    try {
      isDownloading = true;
      
      // Use original HTML-based PPTX generation with updated slides
      const res = await fetch('/api/generate-slides-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandData.brand_name || brandData.brandName,
          brandDomain: brandData.brand_domain || brandData.brandDomain,
          contact: brandData.contact,
          stepHistory: brandData.stepHistory,
          logoFiles: brandData.logoFiles,
          logoUrl: brandData.logoUrl,
          logo: brandData.logo,
          savedSlides: slides, // Use the updated slides with edits
          templateSet: selectedTemplateSet === 'default' ? undefined : selectedTemplateSet // Include current template
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Export failed');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (brandData.brand_name || brandData.brandName || 'Brand') + '-Brand-Guidelines.pptx';
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      error = err.message || 'Download failed';
    } finally {
      isDownloading = false;
    }
  }
  
  async function downloadPDF() {
    try {
      isDownloading = true;
      
      // Use PDF generation API with updated slides
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandData.brand_name || brandData.brandName,
          brandDomain: brandData.brand_domain || brandData.brandDomain,
          contact: brandData.contact,
          stepHistory: brandData.stepHistory,
          logoFiles: brandData.logoFiles,
          logoUrl: brandData.logoUrl,
          logo: brandData.logo,
          savedSlides: slides, // Use the updated slides with edits
          templateSet: selectedTemplateSet === 'default' ? undefined : selectedTemplateSet // Include current template
        })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'PDF export failed');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (brandData.brand_name || brandData.brandName || 'Brand') + '-Brand-Guidelines.pdf';
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      error = err.message || 'PDF export failed';
      console.error('PDF export error:', err);
    } finally {
      isDownloading = false;
    }
  }
  
  function goToSlide(index: number) {
    // If currently editing, save changes before switching slides
    if (isEditable) {
      updateSlideContent();
    }
    currentSlide = index;
  }
  
  async function switchTemplateSet(templateSet: string) {
    if (templateSet === selectedTemplateSet) return;
    
    try {
      isSwitchingTemplate = true;
      console.log('🎨 Switching to template set:', templateSet);
      
      // Load slides with new template set
      const res = await fetch('/api/preview-slides-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandData.brand_name || brandData.brandName,
          brandDomain: brandData.brand_domain || brandData.brandDomain,
          contact: brandData.contact,
          stepHistory: brandData.stepHistory,
          logoFiles: brandData.logoFiles,
          logoUrl: brandData.logoUrl,
          logo: brandData.logo,
          templateSet: templateSet === 'default' ? undefined : templateSet // undefined means root templates
        })
      });
      
      if (!res.ok) throw new Error('Failed to load new template');
      
      const data = await res.json();
      if (data.success && data.slides) {
        slides = data.slides;
        selectedTemplateSet = templateSet;
        currentSlide = 0; // Reset to first slide
        // Reset snapshot with new template slides
        originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
        console.log('✅ Template switched successfully');
      }
    } catch (err: any) {
      console.error('Failed to switch template:', err);
      error = err.message || 'Failed to switch template';
    } finally {
      isSwitchingTemplate = false;
    }
  }
</script>

{#if loading}
  <div class="p-6 flex items-center justify-center min-h-screen bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div class="text-gray-600">Loading preview...</div>
    </div>
  </div>
{:else if error}
  <div class="p-6 text-red-600 text-center min-h-screen flex items-center justify-center bg-gray-50">
    <div>
      <div class="text-2xl mb-4">⚠️</div>
      <div class="text-lg">{error}</div>
    </div>
  </div>
{:else}
  <div class="p-4 min-h-screen bg-gray-50">
    <div class="mx-auto max-w-7xl">
      <!-- Header Controls -->
      <div class="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-600">
              Slide {currentSlide + 1} of {slides.length} - {slides[currentSlide]?.name}
            </div>
            <div class="flex items-center gap-2">
              <button 
                class="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors" 
                onclick={prevSlide} 
                disabled={currentSlide === 0}
              >
                ← Previous
              </button>
              <button 
                class="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors" 
                onclick={nextSlide} 
                disabled={currentSlide >= slides.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            {#if isEditable}
              <button 
                class="px-3 py-2 border rounded transition-colors {editMode === 'text' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-200 text-gray-700'}" 
                onclick={toggleEditMode}
                title="Switch to {editMode === 'text' ? 'Layout' : 'Text'} editing mode"
              >
                {editMode === 'text' ? '📝 Text Mode' : '🎨 Layout Mode'}
              </button>
            {/if}
            <button 
              class="px-4 py-2 border rounded transition-colors {isEditable ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}" 
              onclick={toggleEdit}
            >
              {isEditable ? '💾 Save & Done' : '✏️ Edit Slide'}
            </button>
            <button 
              class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" 
              onclick={saveChanges}
            >
              💾 Save Changes
            </button>
            {#if originalSlidesSnapshot && originalSlidesSnapshot.length > 0}
              <button 
                class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors" 
                onclick={revertChanges}
                title="Discard all edits and revert to original state"
              >
                🔄 Revert Changes
              </button>
            {/if}
            <!-- Export As Dropdown -->
            <div class="relative inline-block" bind:this={exportDropdownRef}>
              <button 
                class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2" 
                disabled={isDownloading}
                onclick={() => showExportDropdown = !showExportDropdown}
              >
                {isDownloading ? '⏳ Generating...' : '📥 Export As'}
                <span class="text-sm">▼</span>
              </button>
              
              {#if showExportDropdown}
                <div class="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2 text-sm"
                    onclick={() => { downloadPPTX(); showExportDropdown = false; }}
                  >
                    📄 PPTX (Non-editable)
                  </button>
                  <button
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg flex items-center gap-2 text-sm"
                    onclick={() => { downloadPDF(); showExportDropdown = false; }}
                  >
                    📄 PDF
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
        <!-- Main Slide Viewer -->
        <div class="space-y-4">
          <div class="bg-white rounded-lg shadow-lg p-4">
            <div class="relative mx-auto w-full">
              <div class="mx-auto max-w-[1280px] overflow-hidden rounded-lg border-2 border-gray-200 bg-white">
                {#if slides[currentSlide]}
                  <iframe
                    bind:this={iframeRef}
                    title={slides[currentSlide].name}
                    srcdoc={slides[currentSlide].html}
                    class="h-[720px] w-[1280px] border shadow"
                  ></iframe>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Template Selector -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <h3 class="mb-3 font-semibold text-gray-800">🎨 Choose Template</h3>
            <select
              value={selectedTemplateSet}
              onchange={(e) => switchTemplateSet((e.target as HTMLSelectElement).value)}
              disabled={isSwitchingTemplate}
              class="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#each templateSets as set}
                <option value={set.value}>{set.label}</option>
              {/each}
            </select>
            <p class="mt-2 text-xs text-gray-500">
              {templateSets.find(s => s.value === selectedTemplateSet)?.description || ''}
            </p>
            {#if isSwitchingTemplate}
              <div class="mt-2 text-sm text-blue-600">Switching template...</div>
            {/if}
          </div>
          
          <!-- Slide Navigation -->
          <div class="bg-white rounded-lg shadow-sm p-4">
            <h3 class="mb-3 font-semibold text-gray-800">Slide Navigation</h3>
            <div class="max-h-96 space-y-2 overflow-y-auto">
              {#each slides as slide, idx}
                {@const slideTitle = (() => {
                  const fileName = slide.name?.replace('.html', '') || '';
                  if (fileName.includes('slide-01')) return 'Cover';
                  if (fileName.includes('slide-02')) return 'Brand Introduction';
                  if (fileName.includes('slide-03')) return 'Brand Positioning';
                  if (fileName.includes('slide-04')) return 'Logo Guidelines';
                  if (fileName.includes('slide-10')) return 'Logo Do\'s';
                  if (fileName.includes('slide-11')) return 'Logo Don\'s';
                  if (fileName.includes('slide-05')) return 'Color Palette';
                  if (fileName.includes('slide-06')) return 'Typography';
                  if (fileName.includes('slide-07')) return 'Iconography';
                  if (fileName.includes('slide-08')) return 'Photography';
                  if (fileName.includes('slide-09')) return 'Applications';
                  if (fileName.includes('slide-12')) return 'Thank You';
                  return `Slide ${idx + 1}`;
                })()}
                <button
                  onclick={() => goToSlide(idx)}
                  class="w-full rounded border p-3 text-left text-sm transition-colors hover:bg-gray-50 {currentSlide === idx ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700'}"
                >
                  <div class="font-medium">{slideTitle}</div>
                  <div class="text-xs text-gray-500 mt-1">Slide {idx + 1}</div>
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Edit Status -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-800 mb-2">📋 Status</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <div><strong>Brand:</strong> {brandData.brandName || 'Unknown'}</div>
              <div><strong>Slides:</strong> {slides.length}</div>
              <div><strong>Edit Status:</strong> {isEditable ? '✏️ Editing' : '👁️ Viewing'}</div>
            </div>
          </div>
          
          <!-- Editing Tips -->
          {#if isEditable}
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="font-semibold text-blue-800 mb-2">💡 Editing Tips</h4>
              {#if editMode === 'text'}
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• Click on any text in the slide to edit it</li>
                  <li>• Text will be highlighted with blue borders</li>
                  <li>• Changes are saved automatically</li>
                  <li>• Switch to Layout Mode to move/resize elements</li>
                </ul>
              {:else}
                <ul class="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Cursor</strong> shows what you can do (grab/resize)</li>
                  <li>• <strong>Drag</strong> elements to move them around</li>
                  <li>• <strong>Resize</strong> by dragging edges/corners</li>
                  <li>• Click to select an element (blue outline)</li>
                  <li>• Switch to Text Mode to edit content</li>
                </ul>
              {/if}
            </div>
          {/if}
          
          <!-- How It Works -->
          <div class="bg-yellow-50 rounded-lg p-4">
            <h4 class="font-semibold text-yellow-800 mb-2">🔧 How It Works</h4>
            <div class="text-sm text-yellow-700 space-y-1">
              <div><strong>Preview Mode:</strong> View slides as generated</div>
              <div><strong>Edit Mode:</strong> Click text to edit directly</div>
              <div><strong>Revert:</strong> Discard all changes and go back</div>
              <div><strong>Download:</strong> Get updated PPTX with changes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
 {/if}

<style>
  /* Custom scrollbar for sidebar */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
</style>