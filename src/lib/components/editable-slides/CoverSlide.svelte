<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData; // Trigger reactivity
  }
</script>

<div class="slide w-[1280px] h-[720px] flex flex-col justify-center items-center p-16 relative overflow-hidden">
  <!-- Background Gradient -->
  <div 
    class="absolute inset-0 w-full h-full"
    style="background: linear-gradient(135deg, {slideData.primaryColor || '#2563EB'} 0%, {slideData.secondaryColor || '#7C3AED'} 100%)"
  ></div>
  
  <!-- Brand Name -->
  <h1 
    class="text-6xl font-bold text-white mb-5 uppercase text-shadow-lg relative z-10"
    contenteditable={isEditable}
    on:blur={(e) => updateField('brandName', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.brandName || 'Your Brand'}
  </h1>
  
  <!-- Tagline -->
  <h2 
    class="text-3xl text-white mb-10 text-shadow-md relative z-10"
    contenteditable={isEditable}
    on:blur={(e) => updateField('tagline', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.tagline || 'Brand Guidelines'}
  </h2>
  
  <!-- Date -->
  <div 
    class="text-lg text-white/90 mt-16 relative z-10"
    contenteditable={isEditable}
    on:blur={(e) => updateField('date', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.date || new Date().toLocaleDateString()}
  </div>
  
  <!-- Color Controls (only visible when editing) -->
  {#if isEditable}
    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 z-20">
      <div class="text-xs text-gray-600 mb-2">Background Colors</div>
      <div class="flex gap-2">
        <input 
          type="color" 
          bind:value={slideData.primaryColor}
          on:input={() => slideData = slideData}
          class="w-8 h-8 rounded border-2 border-white shadow-lg"
        />
        <input 
          type="color" 
          bind:value={slideData.secondaryColor}
          on:input={() => slideData = slideData}
          class="w-8 h-8 rounded border-2 border-white shadow-lg"
        />
      </div>
    </div>
  {/if}
</div>

<style>
  .text-shadow-lg {
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  .text-shadow-md {
    text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
  }
  
  [contenteditable]:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    border-radius: 4px;
  }
</style>
