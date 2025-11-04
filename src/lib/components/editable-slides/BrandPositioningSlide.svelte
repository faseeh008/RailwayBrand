<script lang="ts">
  export let slideData: any;
  export let isEditable: boolean = false;
  
  function updateField(field: string, value: string) {
    slideData[field] = value;
    slideData = slideData; // Trigger reactivity
  }
</script>

<div class="slide w-[1280px] h-[720px] bg-gradient-to-b from-blue-50 to-white p-16">
  <!-- Title -->
  <h1 
    class="text-4xl font-bold mb-4"
    style="color: {slideData.primaryColor || '#2563EB'}"
    contenteditable={isEditable}
    on:blur={(e) => updateField('title', e.target.innerText)}
    suppressContentEditableWarning
  >
    {slideData.title || 'BRAND POSITIONING'}
  </h1>
  
  <!-- Divider -->
  <div class="w-full h-1 bg-amber-800 mb-6"></div>
  
  <!-- Mission and Vision Row -->
  <div class="flex gap-5 mb-5">
    <!-- Mission Card -->
    <div class="flex-1 bg-blue-50 p-5 rounded-lg border-2 border-blue-500">
      <div 
        class="text-lg font-bold mb-3 text-blue-600"
        contenteditable={isEditable}
        on:blur={(e) => updateField('missionTitle', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.missionTitle || 'MISSION'}
      </div>
      <div 
        class="text-sm leading-relaxed text-blue-800"
        contenteditable={isEditable}
        on:blur={(e) => updateField('mission', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.mission || 'Your mission statement goes here. This should clearly define your company\'s purpose and what you aim to achieve.'}
      </div>
    </div>
    
    <!-- Vision Card -->
    <div class="flex-1 bg-purple-50 p-5 rounded-lg border-2 border-purple-500">
      <div 
        class="text-lg font-bold mb-3 text-purple-600"
        contenteditable={isEditable}
        on:blur={(e) => updateField('visionTitle', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.visionTitle || 'VISION'}
      </div>
      <div 
        class="text-sm leading-relaxed text-purple-800"
        contenteditable={isEditable}
        on:blur={(e) => updateField('vision', e.target.innerText)}
        suppressContentEditableWarning
      >
        {slideData.vision || 'Your vision statement goes here. This should describe the future you want to create and your long-term aspirations.'}
      </div>
    </div>
  </div>
  
  <!-- Values Card -->
  <div class="bg-green-50 p-5 rounded-lg border-2 border-green-500 mb-4">
    <div 
      class="text-lg font-bold mb-3 text-green-600"
      contenteditable={isEditable}
      on:blur={(e) => updateField('valuesTitle', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.valuesTitle || 'CORE VALUES'}
    </div>
    <div 
      class="text-sm leading-relaxed text-green-800"
      contenteditable={isEditable}
      on:blur={(e) => updateField('values', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.values || 'Your core values go here. These are the fundamental beliefs that guide your company\'s decisions and actions.'}
    </div>
  </div>
  
  <!-- Personality Card -->
  <div class="bg-green-50 p-5 rounded-lg border-2 border-green-500">
    <div 
      class="text-lg font-bold mb-3 text-green-600"
      contenteditable={isEditable}
      on:blur={(e) => updateField('personalityTitle', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.personalityTitle || 'TARGET AUDIENCE'}
    </div>
    <div 
      class="text-sm leading-relaxed text-green-800"
      contenteditable={isEditable}
      on:blur={(e) => updateField('personality', e.target.innerText)}
      suppressContentEditableWarning
    >
      {slideData.personality || 'Your target audience description goes here. This should define who your ideal customers are and what they care about.'}
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
