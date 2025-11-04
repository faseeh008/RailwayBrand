<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateColor(index: number, field: string, value: string) {
    slideData.colors[index][field] = value;
    slideData = slideData;
  }
  
  function addColor() {
    slideData.colors = [...slideData.colors, { 
      name: 'New Color', 
      hex: '#000000', 
      usage: 'Usage description' 
    }];
  }
  
  function removeColor(index: number) {
    slideData.colors = slideData.colors.filter((_: any, i: number) => i !== index);
  }
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData;
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-br from-gray-50 to-white p-16">
  <!-- Title -->
  <h1 
    class="text-4xl font-bold mb-4"
    style="color: {slideData.colors?.[0]?.hex || '#000000'}"
    contenteditable={isEditable}
    on:blur={(e) => updateField('title', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.title || 'COLORS PALETTE'}
  </h1>
  
  <!-- Divider -->
  <div class="w-full h-1 bg-amber-800 mb-8"></div>
  
  <!-- Color Grid -->
  <div class="flex justify-center gap-8 mb-8 flex-wrap">
    {#each slideData.colors || [] as color, index}
      <div class="text-center group">
        <!-- Color Swatch -->
        <div 
          class="w-48 h-48 rounded-lg shadow-lg border-4 border-white mb-4 relative"
          style="background-color: {color.hex}"
        >
          {#if isEditable}
            <button 
              on:click={() => removeColor(index)}
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          {/if}
        </div>
        
        <!-- Color Name -->
        <input 
          type="text"
          bind:value={color.name}
          on:input={() => updateColor(index, 'name', color.name)}
          class="text-center font-bold text-lg mb-1 border-none bg-transparent w-full"
          readonly={!isEditable}
          placeholder="Color name"
        />
        
        <!-- Color Hex -->
        <input 
          type="text"
          bind:value={color.hex}
          on:input={() => updateColor(index, 'hex', color.hex)}
          class="text-center text-sm text-gray-600 mb-1 border-none bg-transparent w-full"
          readonly={!isEditable}
          placeholder="#000000"
        />
        
        <!-- Color Usage -->
        <input 
          type="text"
          bind:value={color.usage}
          on:input={() => updateColor(index, 'usage', color.usage)}
          class="text-center text-xs text-gray-500 italic border-none bg-transparent w-full"
          readonly={!isEditable}
          placeholder="Usage description"
        />
        
        <!-- Color Picker (only visible when editing) -->
        {#if isEditable}
          <div class="mt-2">
            <input 
              type="color" 
              bind:value={color.hex}
              on:input={() => updateColor(index, 'hex', color.hex)}
              class="w-8 h-8 rounded border-2 border-gray-300 shadow-lg"
            />
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Add Color Button (only visible when editing) -->
  {#if isEditable}
    <div class="text-center">
      <button 
        on:click={addColor} 
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        + Add Color
      </button>
    </div>
  {/if}
</div>

<style>
  [contenteditable]:focus,
  input:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    border-radius: 4px;
  }
  
  input[readonly] {
    cursor: default;
  }
  
  input:not([readonly]) {
    border: 1px solid #E5E7EB;
    padding: 2px 4px;
    border-radius: 4px;
  }
</style>
