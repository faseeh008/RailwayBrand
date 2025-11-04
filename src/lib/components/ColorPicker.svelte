<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let value: string = '#000000';
  export let label: string = 'Color';
  export let showLabel: boolean = true;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  const dispatch = createEventDispatcher();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    dispatch('change', { value: newValue });
  }
  
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    dispatch('input', { value: newValue });
  }
</script>

<div class="color-picker-container">
  {#if showLabel}
    <label class="block text-xs text-gray-600 mb-1 font-medium">
      {label}
    </label>
  {/if}
  
  <div class="relative">
    <input 
      type="color" 
      bind:value
      on:change={handleChange}
      on:input={handleInput}
      class="color-input {sizeClasses[size]} rounded border-2 border-gray-300 shadow-lg cursor-pointer hover:border-blue-400 transition-colors"
    />
    
    <!-- Color preview with hex value -->
    <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
      {value}
    </div>
  </div>
</div>

<style>
  .color-input {
    appearance: none;
    background: none;
    border: none;
    cursor: pointer;
  }
  
  .color-input::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  .color-input::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }
  
  .color-input::-moz-color-swatch {
    border: none;
    border-radius: 4px;
  }
</style>
