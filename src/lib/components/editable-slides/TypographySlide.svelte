<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateFont(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData;
  }
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData;
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-r from-green-50 to-white p-16">
  <!-- Title -->
  <h1 
    class="text-4xl font-bold mb-4"
    style="color: {slideData.primaryColor || '#000000'}"
    contenteditable={isEditable}
    on:blur={(e) => updateField('title', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.title || 'TYPEFACE'}
  </h1>
  
  <!-- Divider -->
  <div class="w-full h-1 bg-amber-800 mb-6"></div>
  
  <!-- Font Cards Row -->
  <div class="flex gap-5 mb-5">
    <!-- Primary Font Card -->
    <div class="flex-1 bg-gray-100 p-6 rounded-lg border border-gray-300">
      <div class="text-sm text-gray-600 font-bold mb-2">PRIMARY FONT</div>
      
      <!-- Font Name -->
      <div 
        class="text-3xl font-bold mb-4"
        style="font-family: '{slideData.primaryFont || 'Arial'}', Arial, sans-serif; color: #2563EB;"
        contenteditable={isEditable}
        on:blur={(e) => updateFont('primaryFont', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.primaryFont || 'Arial'}
      </div>
      
      <!-- Font Sample -->
      <div 
        class="text-base text-gray-800 mb-2"
        style="font-family: '{slideData.primaryFont || 'Arial'}', Arial, sans-serif;"
        contenteditable={isEditable}
        on:blur={(e) => updateField('primarySample', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.primarySample || 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789'}
      </div>
      
      <!-- Font Weights -->
      <div class="flex gap-2 mt-2">
        <span class="bg-white px-2 py-1 rounded text-xs text-gray-800">Regular</span>
        <span class="bg-white px-2 py-1 rounded text-xs text-gray-800">Bold</span>
      </div>
    </div>
    
    <!-- Secondary Font Card -->
    <div class="flex-1 bg-gray-100 p-6 rounded-lg border border-gray-300">
      <div class="text-sm text-gray-600 font-bold mb-2">SECONDARY FONT</div>
      
      <!-- Font Name -->
      <div 
        class="text-3xl font-bold mb-4"
        style="font-family: '{slideData.secondaryFont || 'Arial'}', Arial, sans-serif; color: #2563EB;"
        contenteditable={isEditable}
        on:blur={(e) => updateFont('secondaryFont', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.secondaryFont || 'Arial'}
      </div>
      
      <!-- Font Sample -->
      <div 
        class="text-base text-gray-800 mb-2"
        style="font-family: '{slideData.secondaryFont || 'Arial'}', Arial, sans-serif;"
        contenteditable={isEditable}
        on:blur={(e) => updateField('secondarySample', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.secondarySample || 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789'}
      </div>
      
      <!-- Font Weights -->
      <div class="flex gap-2 mt-2">
        <span class="bg-white px-2 py-1 rounded text-xs text-gray-800">Regular</span>
        <span class="bg-white px-2 py-1 rounded text-xs text-gray-800">Medium</span>
      </div>
    </div>
  </div>
  
  <!-- Typography Hierarchy -->
  <div class="bg-gray-100 p-6 rounded-lg border border-gray-300">
    <div 
      class="text-sm text-gray-600 font-bold mb-4"
      contenteditable={isEditable}
      on:blur={(e) => updateField('hierarchyTitle', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.hierarchyTitle || 'TYPOGRAPHY HIERARCHY'}
    </div>
    
    <div 
      class="grid grid-cols-2 gap-4 text-sm text-gray-800"
      contenteditable={isEditable}
      on:blur={(e) => updateField('hierarchyContent', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.hierarchyContent || 'H1: 32pt - Main titles\nH2: 24pt - Section headers\nH3: 20pt - Subsection headers\nBody: 16pt - Main content'}
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
