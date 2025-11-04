<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData;
  }
  
  function updateGuideline(index: number, field: string, value: string) {
    slideData.guidelines[index][field] = value;
    slideData = slideData;
  }
  
  function addGuideline() {
    slideData.guidelines = [...slideData.guidelines, { 
      title: 'New Guideline', 
      description: 'Guideline description' 
    }];
  }
  
  function removeGuideline(index: number) {
    slideData.guidelines = slideData.guidelines.filter((_: any, i: number) => i !== index);
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-br from-orange-50 to-white p-16">
  <!-- Title -->
  <h1 
    class="text-4xl font-bold mb-4"
    style="color: {slideData.primaryColor || '#000000'}"
    contenteditable={isEditable}
    on:blur={(e) => updateField('title', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.title || 'LOGO GUIDELINES'}
  </h1>
  
  <!-- Divider -->
  <div class="w-full h-1 bg-amber-800 mb-6"></div>
  
  <!-- Logo Guidelines Grid -->
  <div class="grid grid-cols-2 gap-6 mb-6">
    {#each slideData.guidelines || [] as guideline, index}
      <div class="bg-white p-6 rounded-lg shadow-lg border border-gray-200 group">
        <div 
          class="text-lg font-bold mb-3 text-gray-800"
          contenteditable={isEditable}
          on:blur={(e) => updateGuideline(index, 'title', e.target.innerText)}
          suppressContentEditableWarning
        >
          {guideline.title || 'Guideline Title'}
        </div>
        
        <div 
          class="text-sm text-gray-600 leading-relaxed"
          contenteditable={isEditable}
          on:blur={(e) => updateGuideline(index, 'description', e.target.innerText)}
          suppressContentEditableWarning
        >
          {guideline.description || 'Guideline description goes here. This should explain the specific rule or requirement.'}
        </div>
        
        {#if isEditable}
          <button 
            on:click={() => removeGuideline(index)}
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        {/if}
      </div>
    {/each}
  </div>
  
  <!-- Add Guideline Button (only visible when editing) -->
  {#if isEditable}
    <div class="text-center">
      <button 
        on:click={addGuideline} 
        class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
      >
        + Add Guideline
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
