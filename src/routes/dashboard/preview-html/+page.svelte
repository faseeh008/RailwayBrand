<script lang="ts">
  import { onMount } from 'svelte';
  import interact from 'interactjs';
  import SlideManager from '$lib/components/SlideManager.svelte';
  import { convertSvelteSlidesToPptx } from '$lib/services/svelte-slide-to-pptx';
  import type { SlideData } from '$lib/types/slide-data';

  let slides: Array<{ name: string; html: string }> = [];
  let brandData: any = null;
  let currentSlide = 0;
  let isEditable = false;
  let editMode: 'text' | 'layout' = 'layout'; // Changed to layout as default for full editing
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
  let selectedElement: HTMLElement | null = null; // Selected element for editing
  let editHistory: string[] = []; // Undo/redo history
  let historyIndex: number = -1; // Current history index
  let snapToGridEnabled: boolean = true; // Snap to grid
  let gridSize: number = 10; // Grid size in pixels
  
  // New: Svelte component mode toggle
  let useSvelteComponents = false; // Toggle between HTML iframe and Svelte components
  let slideManagerRef: SlideManager; // Reference to SlideManager component
  
  // Store event listener references and interact instances for proper cleanup
  let editingEventListeners: Array<{ element: HTMLElement | Document; event: string; handler: EventListener; options?: boolean | AddEventListenerOptions }> = [];
  let editingInteractInstances: Array<{ element: HTMLElement; instance: any }> = [];
  let editingStylesElement: HTMLElement | null = null;
  
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
        
        // Fetch all brand data from database (logo files, contact info, builder inputs)
        console.log('🔍 Fetching complete brand data from database using guidelineId...');
        try {
          const response = await fetch(`/api/brand-guidelines/${guidelineId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.guideline) {
              const guideline = result.guideline;
              
              // Load logo files
              if (guideline.logoFiles && (!brandData.logoFiles || brandData.logoFiles.length === 0)) {
                try {
                  const logoFiles = typeof guideline.logoFiles === 'string' 
                    ? JSON.parse(guideline.logoFiles) 
                    : guideline.logoFiles;
                  brandData.logoFiles = logoFiles;
                  console.log('✅ Loaded logo files from database:', logoFiles.length);
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse logo files from database:', parseError);
                }
              }
              
              // Load all builder form inputs from database
              if (guideline.brandDomain) brandData.brand_domain = guideline.brandDomain;
              if (guideline.shortDescription) brandData.short_description = guideline.shortDescription;
              if (guideline.mood) brandData.selectedMood = guideline.mood;
              if (guideline.audience) brandData.selectedAudience = guideline.audience;
              if (guideline.brandValues) brandData.brandValues = guideline.brandValues;
              if (guideline.customPrompt) brandData.customPrompt = guideline.customPrompt;
              
              // Load contact information
              if (guideline.contactInfo) {
                try {
                  const contactInfo = typeof guideline.contactInfo === 'string' 
                    ? JSON.parse(guideline.contactInfo) 
                    : guideline.contactInfo;
                  brandData.contact = contactInfo;
                  console.log('✅ Loaded contact info from database:', contactInfo);
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse contactInfo from database:', parseError);
                }
              }
              
              // Also check structuredData for additional fields
              if (guideline.structuredData) {
                try {
                  const structuredData = typeof guideline.structuredData === 'string' 
                    ? JSON.parse(guideline.structuredData) 
                    : guideline.structuredData;
                  
                  // Merge structured data fields if not already set
                  if (structuredData.selectedMood && !brandData.selectedMood) brandData.selectedMood = structuredData.selectedMood;
                  if (structuredData.selectedAudience && !brandData.selectedAudience) brandData.selectedAudience = structuredData.selectedAudience;
                  if (structuredData.brandValues && !brandData.brandValues) brandData.brandValues = structuredData.brandValues;
                  if (structuredData.customPrompt && !brandData.customPrompt) brandData.customPrompt = structuredData.customPrompt;
                  if (structuredData.contact && !brandData.contact) brandData.contact = structuredData.contact;
                } catch (parseError) {
                  console.warn('⚠️ Failed to parse structuredData from database:', parseError);
                }
              }
              
              console.log('✅ Loaded all builder inputs from database');
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch brand data from database:', error);
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
      console.log('🛑 Exiting edit mode...');
      
      // IMPORTANT: Clean up FIRST before saving/reloading
      if (iframeRef) {
        // Save current content first
        await updateSlideContent();
        
        // Clean up ALL editing state BEFORE iframe reload
        cleanupEditingMode(iframeRef);
        
        // Reset all state variables
        editingEventListeners = [];
        editingInteractInstances = [];
        editingStylesElement = null;
        selectedElement = null;
        interactInstance = null;
        editHistory = [];
        historyIndex = -1;
        isInjectingInteract = false; // Reset injection flag
      }
      
      isEditable = false;
      
      // Show saving message
      const savingMsg = document.createElement('div');
      savingMsg.className = 'fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-lg z-50 shadow-lg';
      savingMsg.textContent = '💾 Saving changes...';
      document.body.appendChild(savingMsg);
      
      // Create clean HTML without editing styles and reload iframe
      if (iframeRef && slides[currentSlide]) {
        try {
          const currentHtml = iframeRef.contentDocument?.documentElement?.outerHTML || slides[currentSlide].html;
          const cleanHtml = createCleanHtml(currentHtml);
          slides[currentSlide].html = cleanHtml;
          
          // Wait a bit to ensure cleanup is complete, then reload iframe
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Reload iframe with clean HTML
          iframeRef.srcdoc = cleanHtml;
          
          // Wait for iframe to reload
          await new Promise(resolve => {
            const checkLoaded = () => {
              try {
                const doc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
                if (doc && doc.readyState === 'complete' && doc.body) {
                  resolve(undefined);
                } else {
                  setTimeout(checkLoaded, 50);
                }
              } catch (e) {
                // Cross-origin or other error, assume loaded
                setTimeout(resolve, 200);
              }
            };
            checkLoaded();
          });
          
          // Update sessionStorage with clean HTML
          const updatedBrandData = { ...brandData };
          const slidesStep = updatedBrandData.stepHistory?.find((s: any) => s.step === 'generated-slides');
          if (slidesStep) {
            slidesStep.content = JSON.stringify(slides);
            sessionStorage.setItem('preview_brand_data', JSON.stringify(updatedBrandData));
            brandData = updatedBrandData;
          }
        } catch (error) {
          console.error('Error cleaning/reloading iframe:', error);
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
        successMsg.className = 'fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-lg z-50 shadow-lg';
        successMsg.textContent = '✅ Changes saved and synced!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } catch (error) {
        // Remove saving message and show error
        savingMsg.remove();
        const errorMsg = document.createElement('div');
        errorMsg.className = 'fixed top-4 right-4 bg-destructive text-white px-4 py-2 rounded-lg z-50 shadow-lg';
        errorMsg.textContent = '⚠️ Changes saved locally, sync failed';
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
      }
      
      console.log('✅ Edit mode exited and cleaned up');
    } else {
      // Not editing, so start editing
      console.log('🎨 Entering edit mode...');
      
      // Ensure we have a clean state
      editingEventListeners = [];
      editingInteractInstances = [];
      editingStylesElement = null;
      selectedElement = null;
      editHistory = [];
      historyIndex = -1;
      isInjectingInteract = false; // Reset injection flag
      
      // Create a snapshot of original slides before editing
      originalSlidesSnapshot = slides.map(slide => ({ name: slide.name, html: slide.html }));
      console.log('📸 Created snapshot of original slides for revert');
      
      isEditable = true;
      
      // Wait for iframe to be fully loaded and rendered
      let initAttempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      const initEditing = () => {
        if (!iframeRef || !isEditable) {
          console.log('⚠️ Edit mode cancelled or iframe not available');
          return;
        }
        
        initAttempts++;
        if (initAttempts > maxAttempts) {
          console.error('❌ Failed to initialize editing after', maxAttempts, 'attempts');
          isEditable = false;
          return;
        }
        
        try {
          const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
          if (!iframeDoc) {
            console.log('⏳ Waiting for iframe document...', initAttempts);
            setTimeout(initEditing, 100);
            return;
          }
          
          if (!iframeDoc.body) {
            console.log('⏳ Waiting for iframe body...', initAttempts);
            setTimeout(initEditing, 100);
            return;
          }
          
          // Check if iframe is fully loaded
          if (iframeDoc.readyState !== 'complete') {
            console.log('⏳ Waiting for iframe to be complete...', initAttempts);
            const onLoad = () => {
              iframeDoc.removeEventListener('DOMContentLoaded', onLoad);
              setTimeout(() => {
                if (isEditable) {
                  if (editMode === 'text') {
                    enableTextEditing(iframeDoc);
                  } else if (editMode === 'layout') {
                    enableLayoutEditing(iframeDoc);
                  }
                  console.log('✅ Editing initialized successfully');
                }
              }, 150);
            };
            iframeDoc.addEventListener('DOMContentLoaded', onLoad);
            return;
          }
          
          // Iframe is ready, initialize editing
          setTimeout(() => {
            if (!isEditable) return;
            
            try {
              if (editMode === 'text') {
                enableTextEditing(iframeDoc);
              } else if (editMode === 'layout') {
                enableLayoutEditing(iframeDoc);
              }
              console.log('✅ Editing initialized successfully');
            } catch (error) {
              console.error('❌ Error initializing editing:', error);
              isEditable = false;
            }
          }, 200);
        } catch (error) {
          // Cross-origin or other error
          console.warn('⚠️ Could not access iframe:', error);
          if (initAttempts < maxAttempts) {
            setTimeout(initEditing, 200);
          } else {
            console.error('❌ Failed to initialize editing');
            isEditable = false;
          }
        }
      };
      
      // Start initialization after a short delay
      setTimeout(initEditing, 150);
    }
  }
  
  // Comprehensive cleanup function for editing mode
  function cleanupEditingMode(iframeRef: HTMLIFrameElement | undefined) {
    if (!iframeRef) {
      console.log('⚠️ No iframe reference for cleanup');
      return;
    }
    
    try {
      const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
      const iframeWindow = iframeRef.contentWindow;
      
      if (!iframeDoc) {
        console.log('⚠️ No iframe document for cleanup (might be reloading)');
        // Clear state anyway
        editingEventListeners = [];
        editingInteractInstances = [];
        editingStylesElement = null;
        selectedElement = null;
        return;
      }
      
      console.log('🧹 Starting cleanup of editing mode...');
      
      // First, clear all intervals and timeouts from selection handles
      try {
        const handles = iframeDoc.querySelectorAll('.selection-handles');
        handles.forEach((handle: any) => {
          if (handle.updateInterval) {
            clearInterval(handle.updateInterval);
            handle.updateInterval = null;
          }
        });
      } catch (e) {
        console.warn('Error clearing handle intervals:', e);
      }
      
      // Remove all stored event listeners
      let removedListeners = 0;
      editingEventListeners.forEach(({ element, event, handler, options }) => {
        try {
          if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener(event, handler, options);
            removedListeners++;
          }
        } catch (e) {
          // Element might not exist anymore (iframe reloaded)
        }
      });
      editingEventListeners = [];
      console.log(`✅ Removed ${removedListeners} event listeners`);
      
      // Unset all interact instances
      let unsetInstances = 0;
      editingInteractInstances.forEach(({ element, instance }) => {
        try {
          if (instance && typeof instance.unset === 'function') {
            instance.unset();
            unsetInstances++;
          } else if (iframeWindow && (iframeWindow as any).interact && element) {
            try {
              const iframeInteract = (iframeWindow as any).interact;
              iframeInteract(element).unset();
              unsetInstances++;
            } catch (e) {
              // Element might not exist
            }
          }
        } catch (e) {
          // Element or interact might not exist anymore
        }
      });
      editingInteractInstances = [];
      console.log(`✅ Unset ${unsetInstances} interact instances`);
      
      // Try to remove all editable-element classes and data attributes
      try {
        const allEditableElements = iframeDoc.querySelectorAll('.editable-element');
        allEditableElements.forEach((el: any) => {
          try {
            el.classList.remove('editable-element', 'selected', 'dragging');
            delete el.dataset.interactInitialized;
            delete el.dataset.contentEditableSet;
            el.contentEditable = 'false';
            if (el.handlesContainer) {
              if (el.handlesContainer.updateInterval) {
                clearInterval(el.handlesContainer.updateInterval);
              }
              delete el.handlesContainer;
            }
          } catch (e) {
            // Element might be removed
          }
        });
        console.log(`✅ Cleaned ${allEditableElements.length} editable elements`);
      } catch (e) {
        console.warn('Error cleaning editable elements:', e);
      }
      
      // Remove editing UI elements
      try {
        const toolbar = iframeDoc.getElementById('slide-editor-toolbar');
        if (toolbar) {
          toolbar.remove();
          console.log('✅ Removed toolbar');
        }
      } catch (e) {
        console.warn('Error removing toolbar:', e);
      }
      
      try {
        const panel = iframeDoc.getElementById('property-panel');
        if (panel) {
          panel.remove();
          console.log('✅ Removed property panel');
        }
      } catch (e) {
        console.warn('Error removing property panel:', e);
      }
      
      try {
        const menu = iframeDoc.getElementById('context-menu');
        if (menu) {
          menu.remove();
          console.log('✅ Removed context menu');
        }
      } catch (e) {
        console.warn('Error removing context menu:', e);
      }
      
      // Remove selection handles
      try {
        const handles = iframeDoc.querySelectorAll('.selection-handles, .selection-handle, .resize-handle');
        handles.forEach((handle: any) => {
          try {
            if (handle.updateInterval) {
              clearInterval(handle.updateInterval);
            }
            handle.remove();
          } catch (e) {
            // Handle might be removed
          }
        });
        console.log(`✅ Removed ${handles.length} selection handles`);
      } catch (e) {
        console.warn('Error removing selection handles:', e);
      }
      
      // Remove editing styles
      try {
        if (editingStylesElement && editingStylesElement.parentNode) {
          editingStylesElement.remove();
          console.log('✅ Removed editing styles element');
        }
        editingStylesElement = null;
        
        const existingStyle = iframeDoc.getElementById('full-editing-styles');
        if (existingStyle) {
          existingStyle.remove();
          console.log('✅ Removed full-editing-styles');
        }
      } catch (e) {
        console.warn('Error removing styles:', e);
      }
      
      // Reset selected element
      selectedElement = null;
      
      console.log('✅ Cleaned up editing mode completely');
    } catch (error) {
      console.error('❌ Error cleaning up editing mode:', error);
      // Even if cleanup fails, clear the state
      editingEventListeners = [];
      editingInteractInstances = [];
      editingStylesElement = null;
      selectedElement = null;
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
        
        // Clean up editing UI and interact instances
        try {
          const iframeDoc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
          const iframeWindow = iframeRef.contentWindow;
          if (iframeDoc && iframeWindow && (iframeWindow as any).interact) {
            const iframeInteract = (iframeWindow as any).interact;
            const allElements = iframeDoc.querySelectorAll('.editable-element');
            allElements.forEach((el: any) => {
              try {
                iframeInteract(el).unset();
              } catch (e) {
                // Ignore errors
              }
            });
            // Remove toolbar and property panel
            const toolbar = iframeDoc.getElementById('slide-editor-toolbar');
            if (toolbar) toolbar.remove();
            const panel = iframeDoc.getElementById('property-panel');
            if (panel) panel.remove();
            const menu = iframeDoc.getElementById('context-menu');
            if (menu) menu.remove();
          }
        } catch (error) {
          console.warn('Error cleaning up editing UI:', error);
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
      successMsg.className = 'fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-lg z-50 shadow-lg';
      successMsg.textContent = '✅ Changes reverted to original state';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
      
      console.log('✅ All changes reverted successfully');
    } catch (error) {
      console.error('Error reverting changes:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-destructive text-white px-4 py-2 rounded-lg z-50 shadow-lg';
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
  
  // Helper function: Save state to history for undo/redo
  function saveToHistory(iframeDoc: Document) {
    const html = iframeDoc.documentElement.outerHTML;
    editHistory = editHistory.slice(0, historyIndex + 1);
    editHistory.push(html);
    historyIndex = editHistory.length - 1;
    // Limit history to 50 states
    if (editHistory.length > 50) {
      editHistory.shift();
      historyIndex--;
    }
  }
  
  // Helper function: Convert element to absolute positioning (called only when dragging starts)
  function convertElementToAbsoluteOnDrag(element: HTMLElement, iframeDoc: Document) {
    if (element.tagName === 'BODY' || element.tagName === 'HTML' || 
        element.tagName === 'HEAD' || element.tagName === 'STYLE' || 
        element.tagName === 'SCRIPT') return;
    
    // Skip if already absolute or fixed
    const computed = iframeDoc.defaultView?.getComputedStyle(element);
    if (computed?.position === 'absolute' || computed?.position === 'fixed') {
      // Already positioned, just update stored values
      const rect = element.getBoundingClientRect();
      const bodyRect = iframeDoc.body.getBoundingClientRect();
      element.dataset.x = (rect.left - bodyRect.left).toString();
      element.dataset.y = (rect.top - bodyRect.top).toString();
      return;
    }
    
    // Get current visual position
    const rect = element.getBoundingClientRect();
    const bodyRect = iframeDoc.body.getBoundingClientRect();
    
    // Calculate position relative to body
    const x = rect.left - bodyRect.left;
    const y = rect.top - bodyRect.top;
    const width = rect.width;
    const height = rect.height;
    
    // Convert to absolute positioning
    element.style.position = 'absolute';
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.width = width + 'px';
    
    // Preserve height - use computed or actual height
    if (computed?.height && computed.height !== 'auto' && !computed.height.includes('%')) {
      element.style.height = computed.height;
    } else {
      element.style.height = height + 'px';
    }
    
    // Remove margins that would affect absolute positioning
    element.style.margin = '0';
    element.style.marginLeft = '0';
    element.style.marginTop = '0';
    element.style.marginRight = '0';
    element.style.marginBottom = '0';
    
    // Store position
    element.dataset.x = x.toString();
    element.dataset.y = y.toString();
    element.dataset.width = width.toString();
    element.dataset.height = height.toString();
  }
  
  // Helper function: Add professional editing toolbar with icons
  function addProfessionalToolbar(iframeDoc: Document, iframeInteract: any) {
    // Remove existing toolbar if any
    const existingToolbar = iframeDoc.getElementById('slide-editor-toolbar');
    if (existingToolbar) existingToolbar.remove();
    
    const toolbar = iframeDoc.createElement('div');
    toolbar.id = 'slide-editor-toolbar';
    toolbar.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
      border: 1px solid #e1e5e9;
      border-radius: 12px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10002;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      backdrop-filter: blur(10px);
      min-width: fit-content;
    `;
    
    // Create tool groups
    const createToolGroup = () => {
      const group = iframeDoc.createElement('div');
      group.style.cssText = 'display: flex; align-items: center; gap: 4px;';
      return group;
    };
    
    // Insert Elements Group
    const insertGroup = createToolGroup();
    insertGroup.appendChild(createProfessionalButton(iframeDoc, 'text', 'Text', () => addTextElement(iframeDoc, iframeInteract)));
    insertGroup.appendChild(createProfessionalButton(iframeDoc, 'square', 'Rectangle', () => addShapeElement(iframeDoc, iframeInteract, 'rectangle')));
    insertGroup.appendChild(createProfessionalButton(iframeDoc, 'circle', 'Circle', () => addShapeElement(iframeDoc, iframeInteract, 'circle')));
    insertGroup.appendChild(createProfessionalButton(iframeDoc, 'line', 'Line', () => addLineElement(iframeDoc, iframeInteract)));
    insertGroup.appendChild(createProfessionalButton(iframeDoc, 'image', 'Image', () => addImageElement(iframeDoc, iframeInteract)));
    toolbar.appendChild(insertGroup);
    
    toolbar.appendChild(createProfessionalSeparator(iframeDoc));
    
    // History Group
    const historyGroup = createToolGroup();
    historyGroup.appendChild(createProfessionalButton(iframeDoc, 'undo', 'Undo', () => undoAction(iframeDoc, iframeInteract)));
    historyGroup.appendChild(createProfessionalButton(iframeDoc, 'redo', 'Redo', () => redoAction(iframeDoc, iframeInteract)));
    toolbar.appendChild(historyGroup);
    
    toolbar.appendChild(createProfessionalSeparator(iframeDoc));
    
    // Alignment Group - Horizontal
    const alignHGroup = createToolGroup();
    alignHGroup.appendChild(createProfessionalButton(iframeDoc, 'alignLeft', 'Align Left', () => alignSelectedElements(iframeDoc, 'left')));
    alignHGroup.appendChild(createProfessionalButton(iframeDoc, 'alignCenter', 'Align Center', () => alignSelectedElements(iframeDoc, 'center')));
    alignHGroup.appendChild(createProfessionalButton(iframeDoc, 'alignRight', 'Align Right', () => alignSelectedElements(iframeDoc, 'right')));
    toolbar.appendChild(alignHGroup);
    
    toolbar.appendChild(createProfessionalSeparator(iframeDoc));
    
    // Alignment Group - Vertical
    const alignVGroup = createToolGroup();
    alignVGroup.appendChild(createProfessionalButton(iframeDoc, 'alignTop', 'Align Top', () => alignSelectedElements(iframeDoc, 'top')));
    alignVGroup.appendChild(createProfessionalButton(iframeDoc, 'alignMiddle', 'Align Middle', () => alignSelectedElements(iframeDoc, 'middle')));
    alignVGroup.appendChild(createProfessionalButton(iframeDoc, 'alignBottom', 'Align Bottom', () => alignSelectedElements(iframeDoc, 'bottom')));
    toolbar.appendChild(alignVGroup);
    
    toolbar.appendChild(createProfessionalSeparator(iframeDoc));
    
    // Snap to Grid toggle
    const snapToggle = createProfessionalButton(iframeDoc, 'grid', snapToGridEnabled ? 'Snap: On' : 'Snap: Off', () => {
      snapToGridEnabled = !snapToGridEnabled;
      const icon = snapToggle.querySelector('.toolbar-icon');
      const text = snapToggle.querySelector('.toolbar-text');
      if (icon && text) {
        text.textContent = snapToGridEnabled ? 'Snap: On' : 'Snap: Off';
      }
      snapToggle.classList.toggle('active', snapToGridEnabled);
    });
    if (snapToGridEnabled) snapToggle.classList.add('active');
    toolbar.appendChild(snapToggle);
    
    iframeDoc.body.appendChild(toolbar);
  }
  
  function createProfessionalButton(iframeDoc: Document, iconName: string, tooltip: string, onClick: () => void): HTMLElement {
    const btn = iframeDoc.createElement('button');
    btn.className = 'toolbar-btn';
    btn.title = tooltip;
    btn.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: #374151;
      transition: all 0.15s ease;
      white-space: nowrap;
      position: relative;
    `;
    
    // Add icon SVG
    const icon = iframeDoc.createElement('span');
    icon.className = 'toolbar-icon';
    icon.innerHTML = getSVGIcon(iconName);
    icon.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 18px; height: 18px;';
    btn.appendChild(icon);
    
    // Add text label (optional, can be hidden for icon-only mode)
    const text = iframeDoc.createElement('span');
    text.className = 'toolbar-text';
    text.textContent = tooltip;
    text.style.cssText = 'font-weight: 500;';
    btn.appendChild(text);
    
    // Hover effects
    btn.onmouseenter = () => {
      btn.style.background = '#f3f4f6';
      btn.style.color = '#111827';
      btn.style.transform = 'translateY(-1px)';
    };
    btn.onmouseleave = () => {
      if (!btn.classList.contains('active')) {
        btn.style.background = 'transparent';
        btn.style.color = '#374151';
        btn.style.transform = 'translateY(0)';
      }
    };
    
    // Active state
    btn.onclick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    };
    
    return btn;
  }
  
  function createProfessionalSeparator(iframeDoc: Document): HTMLElement {
    const sep = iframeDoc.createElement('div');
    sep.style.cssText = 'width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px;';
    return sep;
  }
  
  function getSVGIcon(iconName: string): string {
    const icons: Record<string, string> = {
      text: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
      square: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`,
      circle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
      line: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
      image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
      undo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg>`,
      redo: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"></path></svg>`,
      alignLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>`,
      alignCenter: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>`,
      alignRight: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="10" x2="17" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="3" y1="18" x2="17" y2="18"></line></svg>`,
      alignTop: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
      alignMiddle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>`,
      alignBottom: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`,
      grid: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    };
    return icons[iconName] || '';
  }
  
  // New function: Enable FULL layout editing mode with Interact.js (PowerPoint-like)
  function enableLayoutEditing(iframeDoc: Document) {
    console.log('🎨 Enabling FULL layout editing mode (PowerPoint-like)');
    
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
    
    // Save initial state to history
    saveToHistory(iframeDoc);
    
    const body = iframeDoc.body;
    
    // Add editing styles (non-intrusive, layout-preserving)
    addEditingStyles(iframeDoc);
    
    // Add professional toolbar (floating, non-intrusive)
    addProfessionalToolbar(iframeDoc, iframeInteract);
    
    // Store and add event listeners for proper cleanup
    // CRITICAL: Use capture phase AND ensure clicks always work for selection
    const clickHandler = (e: MouseEvent) => {
      // Only handle clicks if we're still in edit mode
      if (!isEditable) {
        console.log('⚠️ Click ignored - edit mode disabled');
        return;
      }
      
      const target = e.target as HTMLElement;
      if (!target) return;
      
      console.log('🖱️ Click detected on:', target.tagName, target.className);
      
      // Ignore clicks on editing UI
      if (target.id === 'slide-editor-toolbar' || 
          target.id === 'property-panel' || 
          target.id === 'context-menu' ||
          target.closest('#slide-editor-toolbar') ||
          target.closest('#property-panel') ||
          target.closest('#context-menu') ||
          target.closest('.selection-handles') ||
          target.closest('.resize-handle')) {
        console.log('⚠️ Click ignored - editing UI');
        return;
      }
      
      // Ignore clicks on body itself
      if (target === body || target.tagName === 'BODY') {
        // Only deselect if clicking directly on body (not on an element)
        if (e.target === body) {
          console.log('🖱️ Click on body - deselecting all');
          deselectAll(iframeDoc);
        }
        return;
      }
      
      // Find the closest meaningful element to make editable
      let elementToEdit = target;
      let walkCount = 0;
      const maxWalk = 10; // Prevent infinite loops
      
      // Walk up the DOM to find a meaningful element (skip text nodes, etc.)
      while (elementToEdit && walkCount < maxWalk && 
             (elementToEdit.nodeType !== 1 || 
              elementToEdit.tagName === 'SCRIPT' || 
              elementToEdit.tagName === 'STYLE' ||
              elementToEdit.id === 'slide-editor-toolbar' ||
              elementToEdit.classList.contains('selection-handles') ||
              elementToEdit.classList.contains('resize-handle'))) {
        elementToEdit = elementToEdit.parentElement as HTMLElement;
        walkCount++;
        if (!elementToEdit || elementToEdit === body) {
          console.log('⚠️ No valid element found for click');
          return;
        }
      }
      
      if (walkCount >= maxWalk) {
        console.warn('⚠️ Too many walks, skipping');
        return;
      }
      
      // Skip if this is a selection handle or editing UI
      if (elementToEdit.classList.contains('selection-handles') || 
          elementToEdit.classList.contains('resize-handle')) {
        console.log('⚠️ Click ignored - selection handle');
        return;
      }
      
      console.log('✅ Valid element found:', elementToEdit.tagName, elementToEdit.className);
      
      // Make this element editable on-demand (only adds class, no style changes)
      if (!elementToEdit.classList.contains('editable-element')) {
        elementToEdit.classList.add('editable-element');
        elementToEdit.dataset.interactInitialized = 'false';
        elementToEdit.dataset.contentEditableSet = 'false';
        console.log('✅ Marked element as editable');
      }
      
      // Handle selection (don't make contentEditable yet - only on double-click)
      if (e.ctrlKey || e.metaKey) {
        // Multi-select
        console.log('🎯 Multi-select with Ctrl/Cmd');
        e.preventDefault();
        e.stopPropagation();
        if (elementToEdit.classList.contains('selected')) {
          elementToEdit.classList.remove('selected');
          if (selectedElement === elementToEdit) {
            selectedElement = null;
          }
        } else {
          elementToEdit.classList.add('selected');
          selectedElement = elementToEdit;
        }
        updatePropertyPanel(iframeDoc);
      } else {
        // Single select - this will initialize interact.js lazily
        // IMPORTANT: Process selection immediately - don't defer
        console.log('🎯 Single select');
        selectElement(elementToEdit, iframeDoc);
      }
    };
    // Use capture phase (true) so we handle clicks BEFORE interact.js processes them
    // This is critical for selection to work after interact.js is initialized
    body.addEventListener('click', clickHandler, true);
    editingEventListeners.push({ element: body, event: 'click', handler: clickHandler, options: true });
    
    // Also add pointerdown handler to catch interactions before interact.js
    const pointerDownHandler = (e: PointerEvent) => {
      if (!isEditable) return;
      
      const target = e.target as HTMLElement;
      
      // Ignore editing UI
      if (target.id === 'slide-editor-toolbar' || 
          target.id === 'property-panel' || 
          target.id === 'context-menu' ||
          target.closest('#slide-editor-toolbar') ||
          target.closest('#property-panel') ||
          target.closest('#context-menu') ||
          target.closest('.selection-handles') ||
          target.closest('.resize-handle')) {
        return;
      }
      
      // Don't interfere with clicks - just track that pointer is down
      // This helps ensure clicks work even when interact.js is active
    };
    body.addEventListener('pointerdown', pointerDownHandler, true);
    editingEventListeners.push({ element: body, event: 'pointerdown', handler: pointerDownHandler, options: true });
    
    console.log('✅ Body click and pointerdown handlers registered in capture phase');
    
    // Store and add right-click handler to body for context menu
    const contextMenuHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === body || 
          target.id === 'slide-editor-toolbar' || 
          target.closest('#slide-editor-toolbar')) {
        return;
      }
      
      // Find element to edit
      let elementToEdit = target;
      while (elementToEdit && 
             (elementToEdit.nodeType !== 1 || 
              elementToEdit.tagName === 'SCRIPT' || 
              elementToEdit.tagName === 'STYLE')) {
        elementToEdit = elementToEdit.parentElement as HTMLElement;
        if (!elementToEdit || elementToEdit === body) return;
      }
      
      // Make editable if not already (only adds class)
      if (!elementToEdit.classList.contains('editable-element')) {
        elementToEdit.classList.add('editable-element');
        elementToEdit.dataset.interactInitialized = 'false';
      }
      
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e, elementToEdit, iframeDoc);
    };
    body.addEventListener('contextmenu', contextMenuHandler, false);
    editingEventListeners.push({ element: body, event: 'contextmenu', handler: contextMenuHandler, options: false });
    
    // Store and add double-click handler for text editing
    const doubleClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === body || target.id === 'slide-editor-toolbar') return;
      
      let elementToEdit = target;
      while (elementToEdit && 
             (elementToEdit.nodeType !== 1 || 
              elementToEdit.tagName === 'SCRIPT' || 
              elementToEdit.tagName === 'STYLE')) {
        elementToEdit = elementToEdit.parentElement as HTMLElement;
        if (!elementToEdit || elementToEdit === body) return;
      }
      
      // Make text editable on double-click
      if (elementToEdit.tagName.match(/^(H[1-6]|P|SPAN|DIV|LI|TD|TH|A)$/i) && 
          !elementToEdit.querySelector('img') && 
          !elementToEdit.querySelector('svg')) {
        elementToEdit.contentEditable = 'true';
        elementToEdit.focus();
        // Select all text for easy editing
        const range = iframeDoc.createRange();
        range.selectNodeContents(elementToEdit);
        const selection = iframeDoc.defaultView?.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        elementToEdit.addEventListener('blur', () => {
          saveToHistory(iframeDoc);
          updateSlideContent();
        }, { once: true });
      }
    };
    body.addEventListener('dblclick', doubleClickHandler, false);
    editingEventListeners.push({ element: body, event: 'dblclick', handler: doubleClickHandler, options: false });
    
    console.log('✅ Editing mode enabled - click to select, double-click to edit text, drag to move!');
  }
  
  // Add comprehensive editing styles
  function addEditingStyles(iframeDoc: Document) {
    // Remove existing editing styles if any
    const existingStyle = iframeDoc.getElementById('full-editing-styles');
    if (existingStyle) existingStyle.remove();
    
    const style = iframeDoc.createElement('style');
    style.id = 'full-editing-styles';
    editingStylesElement = style;
    style.textContent = `
      /* Ultra-minimal editing styles - zero impact on layout */
      .editable-element {
        /* No styles - just a marker class, zero layout impact */
      }
      
      .editable-element:hover {
        /* Show outline on hover only - doesn't affect layout */
        outline: 2px dashed rgba(59, 130, 246, 0.5) !important;
        outline-offset: 2px !important;
      }
      
      .editable-element.selected {
        outline: 3px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }
      
      .editable-element.dragging {
        opacity: 0.8 !important;
        z-index: 10000 !important;
      }
      
      /* IMPORTANT: No positioning, no cursor changes, no touch-action - preserve layout completely */
      
      /* Professional Toolbar styles */
      #slide-editor-toolbar {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
        border: 1px solid #e1e5e9;
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 10002;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        backdrop-filter: blur(10px);
      }
      
      .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 12px;
        border: none;
        border-radius: 8px;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: #374151;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      
      .toolbar-btn:hover {
        background: #f3f4f6;
        color: #111827;
        transform: translateY(-1px);
      }
      
      .toolbar-btn.active {
        background: #e0e7ff;
        color: #4f46e5;
      }
      
      .toolbar-btn.active:hover {
        background: #c7d2fe;
      }
      
      .toolbar-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
      }
      
      .toolbar-icon svg {
        width: 100%;
        height: 100%;
      }
      
      /* Selection handles */
      .selection-handles {
        position: absolute;
        pointer-events: none;
        z-index: 9999;
        border: 2px solid #3b82f6;
        border-radius: 4px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
      }
      
      .resize-handle {
        position: absolute;
        width: 8px;
        height: 8px;
        background: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        pointer-events: all;
        transform: translate(-50%, -50%);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: transform 0.1s ease, background 0.1s ease;
      }
      
      .resize-handle:hover {
        transform: translate(-50%, -50%) scale(1.3);
        background: #2563eb;
      }
      
      /* Professional Context menu styles */
      #context-menu {
        position: fixed;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10003;
        min-width: 180px;
        padding: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        overflow: hidden;
      }
      
      .context-menu-item {
        padding: 10px 14px;
        cursor: pointer;
        font-size: 13px;
        color: #374151;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 6px;
        margin: 2px;
      }
      
      .context-menu-item:hover {
        background: #f3f4f6;
        color: #111827;
      }
      
      .context-menu-item:active {
        background: #e5e7eb;
      }
      
      /* Professional Property panel styles */
      #property-panel {
        position: fixed;
        right: 20px;
        top: 80px;
        width: 280px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        z-index: 10001;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1);
        max-height: calc(100vh - 100px);
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      
      #property-panel::-webkit-scrollbar {
        width: 6px;
      }
      
      #property-panel::-webkit-scrollbar-track {
        background: #f3f4f6;
        border-radius: 3px;
      }
      
      #property-panel::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
      }
      
      #property-panel::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
      
      .property-group {
        margin-bottom: 16px;
      }
      
      .property-group:last-child {
        margin-bottom: 0;
      }
      
      .property-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 600;
        font-size: 12px;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .property-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 13px;
        box-sizing: border-box;
        transition: all 0.15s ease;
        background: #ffffff;
        color: #111827;
      }
      
      .property-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .property-input:hover {
        border-color: #9ca3af;
      }
    `;
    iframeDoc.head.appendChild(style);
  }
  
  // Make a single element editable with drag, resize, and context menu
  function makeElementEditable(element: HTMLElement, iframeDoc: Document, iframeInteract: any, convertToAbsolute: boolean = false) {
    element.classList.add('editable-element');
    
    // Make text elements contentEditable
    if (element.tagName.match(/^(H[1-6]|P|SPAN|DIV|LI|TD|TH|A)$/i) && 
        !element.querySelector('img') && 
        !element.querySelector('svg')) {
      element.contentEditable = 'true';
      element.addEventListener('blur', () => {
        saveToHistory(iframeDoc);
        updateSlideContent();
      });
    }
    
    // CRITICAL: Don't call getBoundingClientRect() here - it causes layout recalculations!
    // Don't modify element styles or positioning at all initially
    // Only add class and event listeners (completely non-intrusive)
    
    // Store interact instance reference for lazy initialization
    element.dataset.interactInitialized = 'false';
    
    // Add lightweight click handler (no layout changes)
    element.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      
      // Make text editable only when clicked (lazy)
      if (element.dataset.contentEditableSet !== 'true' && 
          element.tagName.match(/^(H[1-6]|P|SPAN|DIV|LI|TD|TH|A)$/i) && 
          !element.querySelector('img') && 
          !element.querySelector('svg')) {
        element.contentEditable = 'true';
        element.dataset.contentEditableSet = 'true';
        element.addEventListener('blur', () => {
          saveToHistory(iframeDoc);
          updateSlideContent();
        }, { once: false });
      }
      
      // Support multi-select with Ctrl/Cmd key
      if (e.ctrlKey || e.metaKey) {
        // Toggle selection
        if (element.classList.contains('selected')) {
          element.classList.remove('selected');
          if (selectedElement === element) {
            selectedElement = null;
          }
        } else {
          element.classList.add('selected');
          selectedElement = element;
        }
        updatePropertyPanel(iframeDoc);
      } else {
        // Single select - this will initialize interact.js lazily
        selectElement(element, iframeDoc);
      }
    });
    
    // Add context menu (right-click)
    element.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e, element, iframeDoc);
    });
  }
  
  // Initialize interact.js for a specific element (lazy loading - only when needed)
  function initializeInteractForElement(element: HTMLElement, iframeDoc: Document, iframeInteract: any) {
    // Check if already initialized - if so, don't reinitialize to avoid conflicts
    if (element.dataset.interactInitialized === 'true') {
      console.log('✅ Element already has interact initialized, skipping...');
      return;
    }
    
    element.dataset.interactInitialized = 'true';
    
    // NOW store original values and calculate position (only when needed)
    const computed = iframeDoc.defaultView?.getComputedStyle(element);
    if (!element.dataset.originalPosition) {
      element.dataset.originalPosition = computed?.position || 'static';
      element.dataset.originalLeft = computed?.left || '';
      element.dataset.originalTop = computed?.top || '';
      element.dataset.originalMargin = computed?.margin || '';
      element.dataset.originalDisplay = computed?.display || '';
      element.dataset.originalWidth = computed?.width || '';
      element.dataset.originalHeight = computed?.height || '';
    }
    
    // Calculate current position (only when initializing interact)
    const rect = element.getBoundingClientRect();
    const bodyRect = iframeDoc.body.getBoundingClientRect();
    const currentX = rect.left - bodyRect.left;
    const currentY = rect.top - bodyRect.top;
    
    // Only set position if element doesn't already have absolute positioning
    if (!element.dataset.x || element.dataset.x === '0') {
      element.dataset.x = currentX.toString();
    }
    if (!element.dataset.y || element.dataset.y === '0') {
      element.dataset.y = currentY.toString();
    }
    if (!element.dataset.width) {
      element.dataset.width = rect.width.toString();
    }
    if (!element.dataset.height) {
      element.dataset.height = rect.height.toString();
    }
    
    // Store interact instance reference
    const interactInstance = iframeInteract(element);
    
    // Track drag state per element - store in element's data
    const dragState = {
      hasDragged: false,
      startX: 0,
      startY: 0,
      dragThreshold: 8 // pixels of movement before considering it a drag (increased for better click detection)
    };
    
    // Store drag state on element for access in handlers
    (element as any).__dragState = dragState;
    
    // Make draggable - use hold delay to distinguish clicks from drags
    interactInstance.draggable({
      inertia: false,
      autoScroll: false,
      allowFrom: null, // Allow dragging from anywhere
      ignoreFrom: '.selection-handles, .resize-handle, .toolbar-btn, button, input, textarea, select', // Don't drag from UI elements
      // Use hold delay - don't start drag immediately, allow clicks to work
      hold: 150, // Wait 150ms before considering it a drag (allows clicks to work)
      listeners: {
        hold(event: any) {
          // Only called if held for 150ms - this is a drag, not a click
          dragState.hasDragged = true;
          saveToHistory(iframeDoc);
          const target = event.target;
          
          // Convert to absolute positioning when drag starts
          convertElementToAbsoluteOnDrag(target, iframeDoc);
          
          target.classList.add('dragging');
          addSelectionHandles(target, iframeDoc);
        },
        start(event: any) {
          // This fires immediately on pointer down
          // Store start position but don't start drag yet
          dragState.startX = event.clientX;
          dragState.startY = event.clientY;
          
          // If we're already dragging (from hold), initialize drag
          if (!dragState.hasDragged) {
            // Check if this might be a quick drag (without hold)
            // This handles fast drags that don't trigger hold
            const moveDistance = Math.sqrt(event.dx * event.dx + event.dy * event.dy);
            if (moveDistance > dragState.dragThreshold) {
              dragState.hasDragged = true;
              saveToHistory(iframeDoc);
              const target = event.target;
              convertElementToAbsoluteOnDrag(target, iframeDoc);
              target.classList.add('dragging');
              addSelectionHandles(target, iframeDoc);
            }
          }
        },
        move(event: any) {
          // Only handle movement if we're actually dragging
          if (!dragState.hasDragged) {
            // Check if movement is significant enough to be a drag
            const deltaX = event.clientX - dragState.startX;
            const deltaY = event.clientY - dragState.startY;
            const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (moveDistance >= dragState.dragThreshold) {
              // Start dragging
              dragState.hasDragged = true;
              saveToHistory(iframeDoc);
              const target = event.target;
              convertElementToAbsoluteOnDrag(target, iframeDoc);
              target.classList.add('dragging');
              addSelectionHandles(target, iframeDoc);
            } else {
              // Not enough movement - might be a click
              return;
            }
          }
          
          // Handle the drag movement
          const target = event.target;
          let x = parseFloat(target.dataset.x || '0') + event.dx;
          let y = parseFloat(target.dataset.y || '0') + event.dy;
          
          if (snapToGridEnabled) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
          }
          
          target.style.left = x + 'px';
          target.style.top = y + 'px';
          target.dataset.x = x.toString();
          target.dataset.y = y.toString();
          
          // Update selection handles position
          const handlesContainer = (target as any).handlesContainer;
          if (handlesContainer && handlesContainer.updateHandles) {
            handlesContainer.updateHandles();
          }
        },
        end(event: any) {
          if (dragState.hasDragged) {
            // Only update if we actually dragged
            event.target.classList.remove('dragging');
            updateSlideContent();
            // Ensure selection handles are still visible
            addSelectionHandles(event.target, iframeDoc);
          }
          // Reset drag state
          dragState.hasDragged = false;
          dragState.startX = 0;
          dragState.startY = 0;
        }
      }
    });
    
    // Make resizable
    interactInstance.resizable({
      edges: { left: true, right: true, top: true, bottom: true },
      allowFrom: '.resize-handle', // Only allow resize from handles
      listeners: {
        start(event: any) {
          // Ensure absolute positioning for resize
          const target = event.target;
          convertElementToAbsoluteOnDrag(target, iframeDoc);
          saveToHistory(iframeDoc);
        },
        move(event: any) {
          const target = event.target;
          let x = parseFloat(target.dataset.x || target.style.left || '0') + (event.deltaRect?.left || 0);
          let y = parseFloat(target.dataset.y || target.style.top || '0') + (event.deltaRect?.top || 0);
          let width = event.rect.width;
          let height = event.rect.height;
          
          if (snapToGridEnabled) {
            width = Math.round(width / gridSize) * gridSize;
            height = Math.round(height / gridSize) * gridSize;
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
          }
          
          target.style.width = width + 'px';
          target.style.height = height + 'px';
          target.style.left = x + 'px';
          target.style.top = y + 'px';
          target.dataset.x = x.toString();
          target.dataset.y = y.toString();
          target.dataset.width = width.toString();
          target.dataset.height = height.toString();
        },
        end(event: any) {
          updateSlideContent();
          // Update selection handles after resize
          addSelectionHandles(event.target, iframeDoc);
        }
      },
      modifiers: [
        iframeInteract.modifiers.restrictSize({
          min: { width: 20, height: 20 }
        })
      ]
    });
    
    // Store interact instance for cleanup
    editingInteractInstances.push({ element, instance: interactInstance });
    
    console.log('✅ Interact.js initialized for element');
  }
  
  // Select an element
  function selectElement(element: HTMLElement, iframeDoc: Document) {
    // Don't do anything if not in edit mode
    if (!isEditable) {
      console.log('⚠️ Cannot select element - edit mode is disabled');
      return;
    }
    
    // Don't select if clicking on selection handles or editing UI
    if (element.classList.contains('selection-handles') || 
        element.classList.contains('resize-handle') ||
        element.id === 'slide-editor-toolbar' ||
        element.id === 'property-panel' ||
        element.id === 'context-menu') {
      return;
    }
    
    console.log('🎯 Selecting element:', element.tagName, element.className);
    
    // Deselect all other elements first
    deselectAll(iframeDoc);
    
    // Select this element
    element.classList.add('selected');
    selectedElement = element;
    
    // Make sure element is marked as editable
    if (!element.classList.contains('editable-element')) {
      element.classList.add('editable-element');
      element.dataset.interactInitialized = 'false';
    }
    
    // CRITICAL FIX: Don't initialize interact.js immediately on selection
    // Instead, initialize it ONLY when user actually starts dragging
    // This prevents interact.js from interfering with clicks for selection
    // We'll initialize it on the first pointerdown/mousemove that indicates a drag
    const iframeWindow = iframeDoc.defaultView;
    if (iframeWindow && (iframeWindow as any).interact) {
      // Mark element as ready for interact, but don't initialize yet
      element.dataset.interactReady = 'true';
      element.dataset.interactInitialized = 'false';
      
      // Set up a one-time pointerdown listener to detect when dragging starts
      const pointerDownForDrag = (e: PointerEvent) => {
        // Only handle if this element is selected and pointer is down on it
        if (!element.classList.contains('selected')) return;
        if (e.target !== element && !element.contains(e.target as Node)) return;
        
        // Check if this is actually a drag (movement) or just a click
        let startX = e.clientX;
        let startY = e.clientY;
        let hasMoved = false;
        
        const pointerMoveForDrag = (moveEvent: PointerEvent) => {
          const moveDistance = Math.sqrt(
            Math.pow(moveEvent.clientX - startX, 2) + 
            Math.pow(moveEvent.clientY - startY, 2)
          );
          
          // If moved more than threshold, this is a drag - initialize interact.js
          if (moveDistance > 5 && !hasMoved) {
            hasMoved = true;
            // Remove this temporary listener
            element.removeEventListener('pointerdown', pointerDownForDrag);
            iframeDoc.removeEventListener('pointermove', pointerMoveForDrag);
            iframeDoc.removeEventListener('pointerup', pointerUpForDrag);
            
            // Now initialize interact.js for dragging
            try {
              initializeInteractForElement(element, iframeDoc, (iframeWindow as any).interact);
              // Trigger the drag by re-dispatching the event to interact.js
              // This is handled by interact.js automatically after initialization
            } catch (error) {
              console.error('Error initializing interact on drag start:', error);
            }
          }
        };
        
        const pointerUpForDrag = () => {
          // If pointer up without significant movement, it was just a click
          // Don't initialize interact.js, keep clicks working
          element.removeEventListener('pointerdown', pointerDownForDrag);
          iframeDoc.removeEventListener('pointermove', pointerMoveForDrag);
          iframeDoc.removeEventListener('pointerup', pointerUpForDrag);
        };
        
        // Listen for movement to determine if it's a drag
        iframeDoc.addEventListener('pointermove', pointerMoveForDrag, { once: false });
        iframeDoc.addEventListener('pointerup', pointerUpForDrag, { once: true });
        
        // Store listeners for cleanup
        (element as any).__tempDragListeners = { move: pointerMoveForDrag, up: pointerUpForDrag };
      };
      
      // Add pointerdown listener to detect drag start
      element.addEventListener('pointerdown', pointerDownForDrag, { once: false });
      (element as any).__pointerDownForDrag = pointerDownForDrag;
    }
    
    // Add selection handles immediately
    addSelectionHandles(element, iframeDoc);
    
    // Update property panel
    updatePropertyPanel(iframeDoc);
    
    console.log('✅ Element selected successfully');
  }
  
  // Add selection handles (resize corners) to selected element
  function addSelectionHandles(element: HTMLElement, iframeDoc: Document) {
    // Remove existing handles first
    removeSelectionHandles(iframeDoc);
    
    // Don't add handles if edit mode is disabled
    if (!isEditable) return;
    
    // Wait a bit for layout to stabilize
    const timeoutId = setTimeout(() => {
      if (!isEditable) return; // Check again after timeout
      
      try {
        const rect = element.getBoundingClientRect();
        const bodyRect = iframeDoc.body.getBoundingClientRect();
        const x = rect.left - bodyRect.left;
        const y = rect.top - bodyRect.top;
        const width = rect.width;
        const height = rect.height;
        
        // Create handle container
        const handlesContainer = iframeDoc.createElement('div');
        handlesContainer.className = 'selection-handles';
        handlesContainer.style.cssText = `
          position: absolute;
          left: ${x - 4}px;
          top: ${y - 4}px;
          width: ${width + 8}px;
          height: ${height + 8}px;
          pointer-events: none;
          z-index: 9999;
          border: 2px solid #3b82f6;
          border-radius: 4px;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5);
        `;
        
        // Check if body still exists and edit mode is still active
        if (!iframeDoc.body || !isEditable) return;
        
        iframeDoc.body.appendChild(handlesContainer);
        
        // Store reference for cleanup
        (element as any).handlesContainer = handlesContainer;
        
        // Update handles when element moves/resizes
        const updateHandles = () => {
          if (!isEditable || !handlesContainer.parentNode || !element.parentNode) {
            if (handlesContainer.parentNode) {
              handlesContainer.remove();
            }
            return;
          }
          
          try {
            const newRect = element.getBoundingClientRect();
            const newBodyRect = iframeDoc.body.getBoundingClientRect();
            const newX = newRect.left - newBodyRect.left;
            const newY = newRect.top - newBodyRect.top;
            const newWidth = newRect.width;
            const newHeight = newRect.height;
            
            handlesContainer.style.left = `${newX - 4}px`;
            handlesContainer.style.top = `${newY - 4}px`;
            handlesContainer.style.width = `${newWidth + 8}px`;
            handlesContainer.style.height = `${newHeight + 8}px`;
          } catch (e) {
            // Element might be removed
            if (handlesContainer.parentNode) {
              handlesContainer.remove();
            }
          }
        };
        
        // Update handles periodically (for drag operations)
        const updateInterval = setInterval(updateHandles, 16); // ~60fps
        (handlesContainer as any).updateInterval = updateInterval;
        (handlesContainer as any).timeoutId = timeoutId;
      } catch (e) {
        console.warn('Error adding selection handles:', e);
      }
    }, 10);
    
    // Store timeout ID for cleanup
    (element as any).handlesTimeoutId = timeoutId;
  }
  
  // Remove selection handles
  function removeSelectionHandles(iframeDoc: Document) {
    try {
      const handles = iframeDoc.querySelectorAll('.selection-handles');
      handles.forEach((handle: any) => {
        try {
          if (handle.updateInterval) {
            clearInterval(handle.updateInterval);
            handle.updateInterval = null;
          }
          if (handle.timeoutId) {
            clearTimeout(handle.timeoutId);
            handle.timeoutId = null;
          }
          if (handle.parentNode) {
            handle.remove();
          }
        } catch (e) {
          // Handle might be removed
        }
      });
    } catch (e) {
      // Document might not exist
    }
  }
  
  // Deselect all elements
  function deselectAll(iframeDoc: Document) {
    iframeDoc.querySelectorAll('.editable-element.selected').forEach((el: any) => {
      el.classList.remove('selected');
      if (el.handlesContainer) {
        const container = el.handlesContainer;
        if (container.updateInterval) {
          clearInterval(container.updateInterval);
        }
        container.remove();
        delete el.handlesContainer;
      }
    });
    removeSelectionHandles(iframeDoc);
    selectedElement = null;
    const panel = iframeDoc.getElementById('property-panel');
    if (panel) panel.style.display = 'none';
  }
  
  // Show context menu
  function showContextMenu(event: MouseEvent, element: HTMLElement, iframeDoc: Document) {
    // Remove existing menu
    const existingMenu = iframeDoc.getElementById('context-menu');
    if (existingMenu) existingMenu.remove();
    
    const menu = iframeDoc.createElement('div');
    menu.id = 'context-menu';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    
    // Delete option
    const deleteItem = iframeDoc.createElement('div');
    deleteItem.className = 'context-menu-item';
    deleteItem.textContent = '🗑️ Delete';
    deleteItem.onclick = () => {
      saveToHistory(iframeDoc);
      element.remove();
      updateSlideContent();
      menu.remove();
    };
    menu.appendChild(deleteItem);
    
    // Duplicate option
    const duplicateItem = iframeDoc.createElement('div');
    duplicateItem.className = 'context-menu-item';
    duplicateItem.textContent = '📋 Duplicate';
    duplicateItem.onclick = () => {
      saveToHistory(iframeDoc);
      const clone = element.cloneNode(true) as HTMLElement;
      const x = parseFloat(element.style.left) + 20;
      const y = parseFloat(element.style.top) + 20;
      clone.style.left = x + 'px';
      clone.style.top = y + 'px';
      clone.dataset.x = x.toString();
      clone.dataset.y = y.toString();
      element.parentNode?.insertBefore(clone, element.nextSibling);
      makeElementEditable(clone, iframeDoc, (iframeDoc.defaultView as any).interact);
      updateSlideContent();
      menu.remove();
    };
    menu.appendChild(duplicateItem);
    
    // Bring to front
    const bringToFrontItem = iframeDoc.createElement('div');
    bringToFrontItem.className = 'context-menu-item';
    bringToFrontItem.textContent = '⬆ Bring to Front';
    bringToFrontItem.onclick = () => {
      saveToHistory(iframeDoc);
      element.style.zIndex = '9999';
      updateSlideContent();
      menu.remove();
    };
    menu.appendChild(bringToFrontItem);
    
    // Send to back
    const sendToBackItem = iframeDoc.createElement('div');
    sendToBackItem.className = 'context-menu-item';
    sendToBackItem.textContent = '⬇ Send to Back';
    sendToBackItem.onclick = () => {
      saveToHistory(iframeDoc);
      element.style.zIndex = '1';
      updateSlideContent();
      menu.remove();
    };
    menu.appendChild(sendToBackItem);
    
    iframeDoc.body.appendChild(menu);
    
    // Close on click outside
    setTimeout(() => {
      const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
          menu.remove();
          iframeDoc.removeEventListener('click', closeMenu);
        }
      };
      iframeDoc.addEventListener('click', closeMenu, true);
    }, 0);
  }
  
  // Update property panel
  function updatePropertyPanel(iframeDoc: Document) {
    let panel = iframeDoc.getElementById('property-panel');
    if (!selectedElement) {
      if (panel) panel.style.display = 'none';
      return;
    }
    
    if (!panel) {
      panel = iframeDoc.createElement('div');
      panel.id = 'property-panel';
      iframeDoc.body.appendChild(panel);
    }
    
    panel.style.display = 'block';
    const el = selectedElement;
    const x = parseFloat(el.style.left) || 0;
    const y = parseFloat(el.style.top) || 0;
    const width = parseFloat(el.style.width) || el.offsetWidth;
    const height = parseFloat(el.style.height) || el.offsetHeight;
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold;">Properties</h3>
      <div class="property-group">
        <label class="property-label">X Position</label>
        <input type="number" class="property-input" value="${x}" 
          onchange="this.ownerDocument.querySelector('.editable-element.selected').style.left = this.value + 'px'; 
                    this.ownerDocument.querySelector('.editable-element.selected').dataset.x = this.value;">
      </div>
      <div class="property-group">
        <label class="property-label">Y Position</label>
        <input type="number" class="property-input" value="${y}" 
          onchange="this.ownerDocument.querySelector('.editable-element.selected').style.top = this.value + 'px'; 
                    this.ownerDocument.querySelector('.editable-element.selected').dataset.y = this.value;">
      </div>
      <div class="property-group">
        <label class="property-label">Width</label>
        <input type="number" class="property-input" value="${width}" 
          onchange="this.ownerDocument.querySelector('.editable-element.selected').style.width = this.value + 'px'">
      </div>
      <div class="property-group">
        <label class="property-label">Height</label>
        <input type="number" class="property-input" value="${height}" 
          onchange="this.ownerDocument.querySelector('.editable-element.selected').style.height = this.value + 'px'">
      </div>
    `;
    
    // Add event listeners to inputs
    panel.querySelectorAll('.property-input').forEach((input: any) => {
      input.addEventListener('change', () => {
        saveToHistory(iframeDoc);
        updateSlideContent();
      });
    });
  }
  
  // Retry function after interact.js loads
  function enableLayoutEditingRetry(iframeDoc: Document) {
    console.log('🔄 Retrying to enable layout editing after interact.js load...');
    enableLayoutEditing(iframeDoc);
  }
  
  // Add text element
  function addTextElement(iframeDoc: Document, iframeInteract: any) {
    saveToHistory(iframeDoc);
    const textDiv = iframeDoc.createElement('div');
    textDiv.className = 'editable-element';
    textDiv.contentEditable = 'true';
    textDiv.textContent = 'New Text';
    textDiv.style.position = 'absolute';
    textDiv.style.left = '100px';
    textDiv.style.top = '100px';
    textDiv.style.width = '200px';
    textDiv.style.minHeight = '40px';
    textDiv.style.padding = '8px';
    textDiv.style.border = '1px solid #ccc';
    textDiv.style.backgroundColor = 'rgba(255,255,255,0.9)';
    textDiv.style.fontSize = '16px';
    textDiv.dataset.x = '100';
    textDiv.dataset.y = '100';
    iframeDoc.body.appendChild(textDiv);
    makeElementEditable(textDiv, iframeDoc, iframeInteract);
    selectElement(textDiv, iframeDoc);
    updateSlideContent();
  }
  
  // Add shape element
  function addShapeElement(iframeDoc: Document, iframeInteract: any, type: 'rectangle' | 'circle') {
    saveToHistory(iframeDoc);
    const shape = iframeDoc.createElement('div');
    shape.className = 'editable-element';
    shape.style.position = 'absolute';
    shape.style.left = '100px';
    shape.style.top = '100px';
    shape.style.width = '100px';
    shape.style.height = '100px';
    shape.style.backgroundColor = '#3b82f6';
    shape.style.border = '2px solid #2563eb';
    if (type === 'circle') {
      shape.style.borderRadius = '50%';
    }
    shape.dataset.x = '100';
    shape.dataset.y = '100';
    iframeDoc.body.appendChild(shape);
    makeElementEditable(shape, iframeDoc, iframeInteract);
    selectElement(shape, iframeDoc);
    updateSlideContent();
  }
  
  // Add line element
  function addLineElement(iframeDoc: Document, iframeInteract: any) {
    saveToHistory(iframeDoc);
    const line = iframeDoc.createElement('div');
    line.className = 'editable-element';
    line.style.position = 'absolute';
    line.style.left = '100px';
    line.style.top = '100px';
    line.style.width = '200px';
    line.style.height = '2px';
    line.style.backgroundColor = '#000';
    line.dataset.x = '100';
    line.dataset.y = '100';
    iframeDoc.body.appendChild(line);
    makeElementEditable(line, iframeDoc, iframeInteract);
    selectElement(line, iframeDoc);
    updateSlideContent();
  }
  
  // Add image element
  function addImageElement(iframeDoc: Document, iframeInteract: any) {
    const input = iframeDoc.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          saveToHistory(iframeDoc);
          const img = iframeDoc.createElement('img');
          img.className = 'editable-element';
          img.src = event.target.result;
          img.style.position = 'absolute';
          img.style.left = '100px';
          img.style.top = '100px';
          img.style.width = '200px';
          img.style.height = 'auto';
          img.style.maxWidth = '400px';
          img.style.maxHeight = '300px';
          img.dataset.x = '100';
          img.dataset.y = '100';
          iframeDoc.body.appendChild(img);
          makeElementEditable(img, iframeDoc, iframeInteract);
          selectElement(img, iframeDoc);
          updateSlideContent();
        };
        reader.readAsDataURL(file);
      }
      input.remove();
    };
    iframeDoc.body.appendChild(input);
    input.click();
  }
  
  // Undo action
  function undoAction(iframeDoc: Document, iframeInteract: any) {
    if (historyIndex > 0) {
      historyIndex--;
      const html = editHistory[historyIndex];
      iframeDoc.documentElement.outerHTML = html;
      // Reinitialize editing
      setTimeout(() => {
        enableLayoutEditing(iframeDoc);
      }, 50);
    }
  }
  
  // Redo action
  function redoAction(iframeDoc: Document, iframeInteract: any) {
    if (historyIndex < editHistory.length - 1) {
      historyIndex++;
      const html = editHistory[historyIndex];
      iframeDoc.documentElement.outerHTML = html;
      // Reinitialize editing
      setTimeout(() => {
        enableLayoutEditing(iframeDoc);
      }, 50);
    }
  }
  
  // Align selected elements
  function alignSelectedElements(iframeDoc: Document, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    const selected = Array.from(iframeDoc.querySelectorAll('.editable-element.selected')) as HTMLElement[];
    if (selected.length < 2) {
      alert('Please select at least 2 elements to align');
      return;
    }
    
    saveToHistory(iframeDoc);
    
    if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
      // Horizontal alignment
      const leftPositions = selected.map(el => parseFloat(el.style.left) || 0);
      const widths = selected.map(el => parseFloat(el.style.width) || el.offsetWidth || 100);
      let targetX: number;
      
      if (alignment === 'left') {
        targetX = Math.min(...leftPositions);
        selected.forEach(el => {
          el.style.left = targetX + 'px';
          el.dataset.x = targetX.toString();
        });
      } else if (alignment === 'center') {
        // Find center of all elements combined
        const minLeft = Math.min(...leftPositions);
        const maxRight = Math.max(leftPositions.map((left, i) => left + widths[i]));
        const centerX = (minLeft + maxRight) / 2;
        
        selected.forEach((el, i) => {
          const width = widths[i];
          const newLeft = centerX - width / 2;
          el.style.left = newLeft + 'px';
          el.dataset.x = newLeft.toString();
        });
      } else { // right
        const rightPositions = leftPositions.map((left, i) => left + widths[i]);
        const targetRight = Math.max(...rightPositions);
        
        selected.forEach((el, i) => {
          const width = widths[i];
          const newLeft = targetRight - width;
          el.style.left = newLeft + 'px';
          el.dataset.x = newLeft.toString();
        });
      }
    } else {
      // Vertical alignment
      const topPositions = selected.map(el => parseFloat(el.style.top) || 0);
      const heights = selected.map(el => parseFloat(el.style.height) || el.offsetHeight || 100);
      let targetY: number;
      
      if (alignment === 'top') {
        targetY = Math.min(...topPositions);
        selected.forEach(el => {
          el.style.top = targetY + 'px';
          el.dataset.y = targetY.toString();
        });
      } else if (alignment === 'middle') {
        // Find middle of all elements combined
        const minTop = Math.min(...topPositions);
        const maxBottom = Math.max(topPositions.map((top, i) => top + heights[i]));
        const centerY = (minTop + maxBottom) / 2;
        
        selected.forEach((el, i) => {
          const height = heights[i];
          const newTop = centerY - height / 2;
          el.style.top = newTop + 'px';
          el.dataset.y = newTop.toString();
        });
      } else { // bottom
        const bottomPositions = topPositions.map((top, i) => top + heights[i]);
        const targetBottom = Math.max(...bottomPositions);
        
        selected.forEach((el, i) => {
          const height = heights[i];
          const newTop = targetBottom - height;
          el.style.top = newTop + 'px';
          el.dataset.y = newTop.toString();
        });
      }
    }
    
    updateSlideContent();
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
    // Remove editing UI elements (toolbar, property panel, context menu)
    let cleanHtml = html
      .replace(/<div[^>]*id="slide-editor-toolbar"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*id="property-panel"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*id="context-menu"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<style[^>]*id="full-editing-styles"[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<input[^>]*type="file"[^>]*>/gi, '');
    
    // Remove editing classes but preserve editable-element positioning
    cleanHtml = cleanHtml
      .replace(/class="editable-element selected"/g, '')
      .replace(/class="editable-element dragging"/g, '')
      .replace(/class="editable-element"/g, '')
      .replace(/contenteditable="true"/g, 'contenteditable="false"')
      // Remove editing data attributes but keep positioning data if needed
      .replace(/data-x="[^"]*"/g, '')
      .replace(/data-y="[^"]*"/g, '')
      .replace(/data-original-[^=]*="[^"]*"/g, '');
    
    // Clean up style attributes - remove editing UI styles but preserve layout (position, left, top, width, height)
    cleanHtml = cleanHtml.replace(/style="([^"]*)"/g, (match, styles) => {
      let cleanStyle = styles
        // Remove editing UI styles
        .replace(/box-shadow:\s*[^;]+;?\s*/g, '')
        .replace(/background-color:\s*rgba\(59,\s*130,\s*246,\s*[^)]+\);?\s*/g, '')
        .replace(/border-radius:\s*2px;?\s*/g, '')
        .replace(/transition:\s*[^;]+;?\s*/g, '')
        .replace(/outline:\s*[^;]+;?\s*/g, '')
        .replace(/outline-offset:\s*[^;]+;?\s*/g, '')
        .replace(/cursor:\s*(move|grab|grabbing|text);?\s*/g, '')
        .replace(/opacity:\s*0\.8;?\s*/g, '')
        .replace(/z-index:\s*(1000|1001|9999);?\s*/g, '')
        .replace(/touch-action:\s*none;?\s*/g, '')
        // Clean up multiple semicolons and trailing semicolons
        .replace(/;\s*;+/g, ';')
        .replace(/^;\s*/, '')
        .replace(/\s*;$/, '')
        .trim();
      
      return cleanStyle ? `style="${cleanStyle}"` : '';
    });
    
    return cleanHtml;
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
    successMsg.className = 'fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-lg z-50';
    successMsg.textContent = 'Changes saved successfully!';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
  }



  async function downloadPPTX() {
    try {
      isDownloading = true;
      error = null;
      
      // If using Svelte components, use the new editable PPTX converter
      if (useSvelteComponents && slideManagerRef) {
        console.log('🔄 Using Svelte component PPTX converter (editable)...');
        
        // Get all slide data from SlideManager
        const allSlideData: SlideData[] = [];
        
        // Access the component refs from SlideManager
        // We need to collect data from all slide components
        // The SlideManager already has a downloadAllSlidesPPTX method, but we'll call it directly
        // For now, we'll use the SlideManager's internal method
        try {
          // Call the SlideManager's download method
          // Since SlideManager has its own download button, we'll trigger it programmatically
          // Or we can collect the data ourselves
        const brandName = brandData?.brandName || brandData?.brand_name || 'Brand';
        
          // We'll need to access the slide refs from SlideManager
          // For now, let's use a simpler approach - trigger the SlideManager's download
          console.log('📊 Collecting slide data from Svelte components...');
          
          // The SlideManager component handles this internally, so we'll use a workaround
          // by calling the convertSvelteSlidesToPptx directly if we can access the refs
          // For now, let's show a message to use the SlideManager's download button
          alert('Please use the "Download All Slides as PPTX" button in the Svelte component view to get editable PPTX files.');
        return;
        } catch (err: any) {
          console.error('Svelte PPTX conversion error:', err);
          throw new Error('Failed to generate editable PPTX. Please try the download button in the component view.');
        }
      }
      
      // Use original HTML-based PPTX generation with updated slides (image-based)
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
      console.error('PPTX download error:', err);
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
  <div class="p-6 flex items-center justify-center min-h-screen bg-background">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div class="text-muted-foreground">Loading preview...</div>
    </div>
  </div>
{:else if error}
  <div class="p-6 text-destructive text-center min-h-screen flex items-center justify-center bg-background">
    <div>
      <div class="text-2xl mb-4">⚠️</div>
      <div class="text-lg">{error}</div>
    </div>
  </div>
{:else}
  <div class="p-4 min-h-screen bg-background">
    <div class="mx-auto max-w-7xl">
      <!-- Header Controls -->
      <div class="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-sm text-muted-foreground">
              Slide {currentSlide + 1} of {slides.length} - {slides[currentSlide]?.name}
            </div>
            <div class="flex items-center gap-2">
              <button 
                class="px-3 py-1 border rounded disabled:opacity-50 hover:bg-background transition-colors" 
                onclick={prevSlide} 
                disabled={currentSlide === 0}
              >
                ← Previous
              </button>
              <button 
                class="px-3 py-1 border rounded disabled:opacity-50 hover:bg-background transition-colors" 
                onclick={nextSlide} 
                disabled={currentSlide >= slides.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Toggle between HTML iframe and Svelte components -->
              <button
              class="px-3 py-2 border rounded transition-colors {useSvelteComponents ? 'bg-green-500 text-white border-green-600' : 'bg-muted text-foreground hover:bg-gray-300'}" 
              onclick={() => useSvelteComponents = !useSvelteComponents}
              title={useSvelteComponents ? 'Switch to HTML iframe view' : 'Switch to Svelte component view (editable PPTX)'}
              >
              {useSvelteComponents ? '🔄 HTML View' : '⚡ Svelte View'}
              </button>
            {#if !useSvelteComponents}
              {#if isEditable}
                <button 
                  class="px-3 py-2 border rounded transition-colors {editMode === 'text' ? 'bg-primary/20 text-primary border-primary' : 'bg-muted text-foreground'}" 
                  onclick={toggleEditMode}
                  title="Switch to {editMode === 'text' ? 'Layout' : 'Text'} editing mode"
                >
                  {editMode === 'text' ? '📝 Text Mode' : '🎨 Layout Mode'}
                </button>
              {/if}
              <button 
                class="px-4 py-2 border rounded transition-colors {isEditable ? 'bg-primary text-white border-blue-500' : 'bg-muted text-foreground hover:bg-gray-300'}" 
                onclick={toggleEdit}
              >
                {isEditable ? '💾 Save & Done' : '✏️ Edit Slide'}
              </button>
            {/if}
              <button 
                class="px-4 py-2 bg-primary text-white rounded hover:bg-green-600 transition-colors" 
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
                  <div class="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-border z-50">
                    <button
                      class="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg flex items-center gap-2 text-sm border-b border-border"
                      onclick={() => { downloadPPTX(); showExportDropdown = false; }}
                      disabled={isDownloading}
                    >
                    {useSvelteComponents ? '📄 PPTX (Editable)' : '📄 PPTX (Image-based)'}
                    </button>
                    <button
                      class="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg flex items-center gap-2 text-sm"
                      onclick={() => { downloadPDF(); showExportDropdown = false; }}
                      disabled={isDownloading}
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
          {#if useSvelteComponents}
            <!-- Svelte Component View -->
            <div class="bg-white rounded-lg shadow-lg p-4">
              <div class="relative mx-auto w-full">
                <div class="max-w-[1280px] mx-auto">
                  {#if brandData}
                    <SlideManager
                      bind:this={slideManagerRef}
                      {brandData}
                    />
                  {:else}
                    <div class="p-8 text-center text-gray-500">
                      Loading brand data...
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <!-- HTML Iframe View (Original) -->
            <div class="bg-white rounded-lg shadow-lg p-4">
              <div class="relative mx-auto w-full">
                <div class="mx-auto max-w-[1280px] overflow-hidden rounded-lg border-2 border-border bg-white">
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
          {/if}
          </div>

          <!-- Sidebar -->
          <div class="space-y-4">
          {#if !useSvelteComponents}
            <!-- Template Selector (only for HTML mode) -->
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
            
            <!-- Slide Navigation (only for HTML mode) -->
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
                    class="w-full rounded border p-3 text-left text-sm transition-colors hover:bg-background {currentSlide === idx ? 'border-blue-500 bg-blue-50 text-primary' : 'border-border text-foreground'}"
                  >
                    <div class="font-medium">{slideTitle}</div>
                    <div class="text-xs text-gray-500 mt-1">Slide {idx + 1}</div>
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            <!-- Info for Svelte Component Mode -->
            <div class="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
              <h3 class="mb-3 font-semibold text-green-800">⚡ Svelte Component Mode</h3>
              <div class="text-sm text-green-700 space-y-2">
                <p>✅ <strong>Editable PPTX:</strong> Download truly editable PowerPoint files</p>
                <p>✅ <strong>Live Editing:</strong> Edit slides directly in the browser</p>
                <p>✅ <strong>Better Performance:</strong> Faster rendering and interactions</p>
                <p class="text-xs text-green-600 mt-3">
                  Use the controls in the slide viewer to navigate and edit slides.
                </p>
              </div>
            </div>
          {/if}
            
            <!-- Edit Status -->
            <div class="bg-background rounded-lg p-4">
              <h4 class="font-semibold text-gray-800 mb-2">📋 Status</h4>
              <div class="text-sm text-muted-foreground space-y-1">
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
                  <ul class="text-sm text-primary space-y-1">
                    <li>• Click on any text in the slide to edit it</li>
                    <li>• Text will be highlighted with blue borders</li>
                    <li>• Changes are saved automatically</li>
                    <li>• Switch to Layout Mode to move/resize elements</li>
                  </ul>
                {:else}
                  <ul class="text-sm text-primary space-y-1">
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