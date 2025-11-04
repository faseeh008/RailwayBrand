<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData; // Trigger reactivity
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-b from-blue-50 to-white p-16">
  <!-- Header -->
  <div class="border-b-4 mb-8 pb-4" style="border-color: {slideData.primaryColor || '#2563EB'}">
    <h1 
      class="text-4xl font-bold mb-4"
      style="color: {slideData.primaryColor || '#2563EB'}"
      contenteditable={isEditable}
      on:blur={(e) => updateField('title', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.title || 'Brand Introduction'}
    </h1>
  </div>
  
  <!-- Content -->
  <div class="flex items-center justify-center h-[calc(100%-120px)]">
    <div 
      class="bg-white p-10 rounded-xl shadow-lg max-w-4xl border-l-6"
      style="border-left-color: {slideData.primaryColor || '#2563EB'}"
    >
      <div 
        class="text-2xl leading-relaxed text-gray-800 text-center"
        contenteditable={isEditable}
        on:blur={(e) => updateField('positioningStatement', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.positioningStatement || 'Your positioning statement goes here. This should clearly communicate what your brand stands for and how it differentiates from competitors.'}
      </div>
    </div>
  </div>
  
  <!-- Color Control (only visible when editing) -->
  {#if isEditable}
    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
      <div class="text-xs text-gray-600 mb-2">Primary Color</div>
      <input 
        type="color" 
        bind:value={slideData.primaryColor}
        on:input={() => slideData = slideData}
        class="w-8 h-8 rounded border-2 border-gray-300 shadow-lg"
      />
    </div>
  {/if}
</div>

<style>
  [contenteditable]:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    border-radius: 4px;
  }
</style>
