<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData;
  }
  
  function updateStyle(index: number, field: string, value: string) {
    slideData.styles[index][field] = value;
    slideData = slideData;
  }
  
  function addStyle() {
    slideData.styles = [...slideData.styles, { 
      name: 'New Style', 
      description: 'Style description'
    }];
  }
  
  function removeStyle(index: number) {
    slideData.styles = slideData.styles.filter((_: any, i: number) => i !== index);
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-br from-pink-50 to-white p-16">
  <!-- Title -->
  <h1 
    class="text-4xl font-bold mb-4"
    style="color: {slideData.primaryColor || '#000000'}"
    contenteditable={isEditable}
    on:blur={(e) => updateField('title', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.title || 'PHOTOGRAPHY'}
  </h1>
  
  <!-- Divider -->
  <div class="w-full h-1 bg-amber-800 mb-6"></div>
  
  <!-- Photography Styles Grid -->
  <div class="grid grid-cols-2 gap-6 mb-6">
    {#each slideData.styles || [] as style, index}
      <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 group">
        <!-- Image Placeholder -->
        <div 
          class="w-full h-32 mb-4 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500"
          style="background-color: {slideData.primaryColor || '#000000'}20"
        >
          📸 Image Placeholder
        </div>
        
        <!-- Style Name -->
        <div 
          class="text-lg font-bold mb-2 text-gray-800"
          contenteditable={isEditable}
          on:blur={(e) => updateStyle(index, 'name', e.target.innerText)}
          suppressContentEditableWarning
        >
          {style.name || 'Style Name'}
        </div>
        
        <!-- Style Description -->
        <div 
          class="text-sm text-gray-600 leading-relaxed"
          contenteditable={isEditable}
          on:blur={(e) => updateStyle(index, 'description', e.target.innerText)}
          suppressContentEditableWarning
        >
          {style.description || 'Style description goes here. This should explain the photography style and guidelines.'}
        </div>
        
        {#if isEditable}
          <button 
            on:click={() => removeStyle(index)}
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Add Style Button (only visible when editing) -->
  {#if isEditable}
    <div class="text-center">
      <button 
        on:click={addStyle} 
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        + Add Style
      </button>
    </div>
  {/if}
  
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
