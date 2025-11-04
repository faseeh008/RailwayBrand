<script lang="ts">
  import ColorPicker from '$lib/components/ColorPicker.svelte';
  import DraggableElement from '$lib/components/DraggableElement.svelte';
  
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
  
  function handleColorMove(event: CustomEvent, index: number) {
    // Update color position in the array if needed
    console.log('Color moved:', event.detail, 'at index:', index);
  }
  
  function handleColorResize(event: CustomEvent, index: number) {
    // Update color size if needed
    console.log('Color resized:', event.detail, 'at index:', index);
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-br from-gray-50 to-white p-16 relative">
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
  
  <!-- Color Grid with Enhanced Controls -->
  <div class="flex justify-center gap-8 mb-8 flex-wrap">
    {#each slideData.colors || [] as color, index}
      <div class="text-center group relative">
        {#if isEditable}
          <DraggableElement
            x={200 + (index * 250)}
            y={200}
            width={200}
            height={280}
            {isDraggable}
            isResizable={false}
            on:move={(e) => handleColorMove(e, index)}
            on:resize={(e) => handleColorResize(e, index)}
          >
            <!-- Color Swatch -->
            <div 
              class="w-full h-48 rounded-lg shadow-lg border-4 border-white mb-4 relative"
              style="background-color: {color.hex}"
            >
              {#if isEditable}
                <button 
                  on:click={() => removeColor(index)}
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
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
              class="text-center font-bold text-lg mb-1 border-none bg-transparent w-full focus:border-2 focus:border-blue-400 focus:rounded px-2 py-1"
              readonly={!isEditable}
              placeholder="Color name"
            />
            
            <!-- Color Hex -->
            <input 
              type="text"
              bind:value={color.hex}
              on:input={() => updateColor(index, 'hex', color.hex)}
              class="text-center text-sm text-gray-600 mb-1 border-none bg-transparent w-full focus:border-2 focus:border-blue-400 focus:rounded px-2 py-1"
              readonly={!isEditable}
              placeholder="#000000"
            />
            
            <!-- Color Usage -->
            <input 
              type="text"
              bind:value={color.usage}
              on:input={() => updateColor(index, 'usage', color.usage)}
              class="text-center text-xs text-gray-500 italic border-none bg-transparent w-full focus:border-2 focus:border-blue-400 focus:rounded px-2 py-1"
              readonly={!isEditable}
              placeholder="Usage description"
            />
            
            <!-- Enhanced Color Picker -->
            {#if isEditable}
              <div class="mt-3 flex justify-center">
                <ColorPicker
                  bind:value={color.hex}
                  on:change={(e) => updateColor(index, 'hex', e.detail.value)}
                  label=""
                  showLabel={false}
                  size="md"
                />
              </div>
            {/if}
          </DraggableElement>
        {:else}
          <!-- Static version for non-editable mode -->
          <div class="text-center">
            <!-- Color Swatch -->
            <div 
              class="w-48 h-48 rounded-lg shadow-lg border-4 border-white mb-4"
              style="background-color: {color.hex}"
            ></div>
            
            <!-- Color Name -->
            <div class="font-bold text-lg mb-1 text-gray-800">
              {color.name}
            </div>
            
            <!-- Color Hex -->
            <div class="text-sm text-gray-600 mb-1">
              {color.hex}
            </div>
            
            <!-- Color Usage -->
            <div class="text-xs text-gray-500 italic">
              {color.usage}
            </div>
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
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-lg"
      >
        + Add Color
      </button>
    </div>
  {/if}
  
  <!-- Enhanced Color Controls (only visible when editing) -->
  {#if isEditable}
    <div class="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200">
      <div class="text-sm font-semibold text-gray-700 mb-3">🎨 Color Controls</div>
      
      <div class="space-y-3">
        <div>
          <ColorPicker
            value={slideData.colors?.[0]?.hex || '#000000'}
            on:change={(e) => {
              if (slideData.colors?.[0]) {
                updateColor(0, 'hex', e.detail.value);
              }
            }}
            label="Primary Color"
            size="md"
          />
        </div>
        
        <div>
          <ColorPicker
            value={slideData.colors?.[1]?.hex || '#7C3AED'}
            on:change={(e) => {
              if (slideData.colors?.[1]) {
                updateColor(1, 'hex', e.detail.value);
              }
            }}
            label="Secondary Color"
            size="md"
          />
        </div>
      </div>
      
      <div class="mt-3 text-xs text-gray-500">
        💡 Drag colors to rearrange
      </div>
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
    background: rgba(255, 255, 255, 0.8);
  }
  
  input:not([readonly]):focus {
    background: white;
    border-color: #3B82F6;
  }
</style>
