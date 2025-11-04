<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let x: number = 0;
  export let y: number = 0;
  export let width: number = 200;
  export let height: number = 100;
  export let isDraggable: boolean = true;
  export let isResizable: boolean = false;
  export let minWidth: number = 50;
  export let minHeight: number = 30;
  
  const dispatch = createEventDispatcher();
  
  let isDragging = false;
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startWidth = 0;
  let startHeight = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  
  function handleMouseDown(event: MouseEvent) {
    if (!isDraggable) return;
    
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dragStartX = x;
    dragStartY = y;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    event.preventDefault();
  }
  
  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    
    x = Math.max(0, Math.min(1280 - width, dragStartX + deltaX));
    y = Math.max(0, Math.min(720 - height, dragStartY + deltaY));
    
    dispatch('move', { x, y });
  }
  
  function handleMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    dispatch('moveEnd', { x, y });
  }
  
  function handleResizeMouseDown(event: MouseEvent) {
    if (!isResizable) return;
    
    isResizing = true;
    startX = event.clientX;
    startY = event.clientY;
    startWidth = width;
    startHeight = height;
    
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
    
    event.preventDefault();
    event.stopPropagation();
  }
  
  function handleResizeMouseMove(event: MouseEvent) {
    if (!isResizing) return;
    
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    
    width = Math.max(minWidth, startWidth + deltaX);
    height = Math.max(minHeight, startHeight + deltaY);
    
    dispatch('resize', { width, height });
  }
  
  function handleResizeMouseUp() {
    isResizing = false;
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
    
    dispatch('resizeEnd', { width, height });
  }
</script>

<div 
  class="draggable-element absolute border-2 border-transparent hover:border-blue-400 transition-colors {isDragging ? 'border-blue-500' : ''}"
  style="left: {x}px; top: {y}px; width: {width}px; height: {height}px;"
  on:mousedown={handleMouseDown}
  role="button"
  tabindex="0"
>
  <slot />
  
  {#if isResizable}
    <div 
      class="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
      on:mousedown={handleResizeMouseDown}
    ></div>
  {/if}
</div>

<style>
  .draggable-element {
    cursor: move;
  }
  
  .draggable-element:focus {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
  
  .resize-handle {
    background: linear-gradient(-45deg, transparent 30%, #3B82F6 30%, #3B82F6 70%, transparent 70%);
  }
</style>
