<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { X } from 'lucide-svelte';

  export let isOpen = false;
  export let screenshot: string | null = null;
  export let annotatedScreenshot: string | null = null;
  export let issues: any[] = [];
  export let elementPositions: any[] = [];

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  // Issue types and colors matching the annotator
  const issueTypes = {
    colors: { color: '#FF6B6B', label: 'Color Issue' },
    typography: { color: '#3B82F6', label: 'Typography Issue' },
    logo: { color: '#FACC15', label: 'Logo Issue' },
    spacing: { color: '#FFA726', label: 'Spacing Issue' }
  };

  // Prevent body scroll when modal is open
  $: if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center p-4"
    onclick={closeModal}
    onkeydown={(e) => e.key === 'Escape' && closeModal()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="fullscreen-modal-title"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white rounded-lg shadow-2xl max-w-7xl max-h-full w-full h-full flex flex-col"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div class="flex items-center gap-4">
          <h2 id="fullscreen-modal-title" class="text-2xl font-bold text-gray-900">
            📸 Fullscreen Screenshot View
          </h2>
          {#if annotatedScreenshot}
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Visual Audit Mode
            </span>
          {/if}
        </div>
        
        <div class="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onclick={closeModal}
            class="flex items-center gap-2"
          >
            <X class="w-4 h-4" />
            Close
          </Button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="modal-body-container">
        <!-- Fixed Legend Sidebar (only shown for annotated screenshots) -->
        {#if annotatedScreenshot}
          <div class="fixed-legend-sidebar">
            <div class="legend-card">
              <div class="legend-title">Audit Issues Legend</div>
              <div class="legend-items">
                {#each Object.entries(issueTypes) as [type, config]}
                  <div class="legend-item">
                    <div class="legend-color-indicator" style="background-color: {config.color};"></div>
                    <span class="legend-label">{config.label}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Fullscreen Screenshot Container with Scroll -->
        <div class="screenshot-container" class:has-sidebar={annotatedScreenshot}>
          <div class="relative min-h-full flex items-center justify-center p-4">
            {#if annotatedScreenshot}
              <img 
                src={annotatedScreenshot} 
                alt="Fullscreen Annotated Screenshot" 
                class="max-w-none h-auto rounded-lg shadow-lg border border-gray-200"
                style="min-width: 100%;"
              />
            {:else if screenshot}
              <img 
                src={screenshot} 
                alt="Fullscreen Website Screenshot" 
                class="max-w-none h-auto rounded-lg shadow-lg border border-gray-200"
                style="min-width: 100%;"
              />
            {:else}
              <div class="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p class="text-gray-500 text-lg">No screenshot available</p>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center justify-center">
          <div class="text-sm text-gray-500">
            {#if annotatedScreenshot}
              View annotated screenshot with visual highlights • Scroll to view full image • Press ESC to close
            {:else}
              Use this screenshot to visually identify elements • Scroll to view full image • Press ESC to close
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure modal is above everything */
  :global(.fullscreen-modal) {
    z-index: 9999;
  }

  /* Modal Body Container */
  .modal-body-container {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
  }

  /* Fixed Legend Sidebar - positioned to the left of the screenshot */
  .fixed-legend-sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 260px;
    background: #F9FAFB;
    border-right: 2px solid #E5E7EB;
    padding: 20px;
    overflow-y: auto;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .legend-card {
    background: white;
    border: 2px solid #DDDDDD;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 220px;
  }

  .legend-title {
    font-size: 16px;
    font-weight: bold;
    color: #333333;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #EEEEEE;
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .legend-color-indicator {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid #333333;
    flex-shrink: 0;
  }

  .legend-label {
    font-size: 13px;
    color: #333333;
    font-weight: 500;
  }

  /* Screenshot container - accounts for sidebar width */
  .screenshot-container {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .screenshot-container.has-sidebar {
    margin-left: 260px;
  }
</style>
