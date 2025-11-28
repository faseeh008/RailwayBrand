<script lang="ts">
  import { onMount } from 'svelte';
  import SlideManager from '$lib/components/SlideManager.svelte';
  import { adaptBrandDataForSlides } from '$lib/services/brand-data-adapter';
  
  let brandData: any = null;
  let loading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      console.log('🔍 Loading brand data for slide editor...');
      const raw = sessionStorage.getItem('preview_brand_data');
      
      if (!raw) {
        error = 'No preview data found. Please generate brand guidelines first.';
        loading = false;
        return;
      }
      
      const parsed = JSON.parse(raw);
      const adapted = adaptBrandDataForSlides({
        ...parsed,
        generatedSteps: parsed.stepHistory || parsed.generatedSteps || []
      });
      brandData = { ...parsed, ...adapted };
      console.log('✅ Brand data loaded:', {
        brandName: brandData.brandName || brandData.brand_name,
        hasColors: !!brandData.colors,
        hasTypography: !!brandData.typography,
        hasLogo: !!brandData.logoFiles
      });
    } catch (e: any) {
      error = e?.message || 'Failed to load brand data';
      console.error('❌ Error loading brand data:', e);
    } finally {
      loading = false;
    }
  });
</script>

<div class="slide-editor-page">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading slide editor...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <h2>⚠️ Error</h2>
      <p>{error}</p>
      <a href="/dashboard/builder" class="btn">Go to Builder</a>
    </div>
  {:else if brandData}
    <SlideManager {brandData} />
  {:else}
    <div class="empty-state">
      <h2>No Brand Data</h2>
      <p>Please generate brand guidelines first.</p>
      <a href="/dashboard/builder" class="btn">Go to Builder</a>
    </div>
  {/if}
</div>

<style>
  .slide-editor-page {
    min-height: 100vh;
    background: #f5f5f5;
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    text-align: center;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: white;
    border-radius: 6px;
    text-decoration: none;
    margin-top: 1rem;
    transition: background 0.2s;
  }
  
  .btn:hover {
    background: #0056b3;
  }
</style>



