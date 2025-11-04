<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { AlertTriangle, CheckCircle, XCircle, Info, ExternalLink, Copy, Check, ChevronDown, ChevronRight, Maximize2 } from 'lucide-svelte';
  import FullscreenScreenshotModal from './FullscreenScreenshotModal.svelte';

  export let auditData: any;
  export let websiteUrl: string;
  export let brandName: string;
  export let screenshot: string | null = null;
  export let visualData: any = null;
  export let fixPrompt: string | null = null;

  // Copy functionality
  let copiedItems: Set<string> = new Set();
  let expandedSections: Set<string> = new Set();
  
  // Visual audit functionality
  let selectedIssue: any = null;
  let showAllHighlights = true;
  let showVisualAudit = false;
  let showFullscreenModal = false;


  async function copyToClipboard(text: string, itemId: string) {
    try {
      await navigator.clipboard.writeText(text);
      copiedItems.add(itemId);
      setTimeout(() => copiedItems.delete(itemId), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  function toggleSection(sectionId: string) {
    if (expandedSections.has(sectionId)) {
      expandedSections.delete(sectionId);
    } else {
      expandedSections.add(sectionId);
    }
    expandedSections = expandedSections; // Trigger reactivity
  }

  // Visual audit functions
  function selectIssue(issue: any) {
    selectedIssue = selectedIssue === issue ? null : issue;
  }

  function openFullscreenModal() {
    showFullscreenModal = true;
  }

  function closeFullscreenModal() {
    showFullscreenModal = false;
  }

  function getHighlightStyle(issue: any) {
    const colors = {
      colors: '#FF6B6B',
      typography: '#4ECDC4',
      logo: '#45B7D1',
      layout: '#96CEB4',
      spacing: '#FFA726'
    };
    
    return {
      borderColor: colors[issue.category as keyof typeof colors] || '#666666',
      borderWidth: issue.severity === 'high' ? '3px' : issue.severity === 'medium' ? '2px' : '1px'
    };
  }

  function getCategoryIcon(category: string) {
    switch (category?.toLowerCase()) {
      case 'colors': return '🎨';
      case 'typography': return '📝';
      case 'logo': return '🏷️';
      case 'layout': return '📐';
      case 'spacing': return '📏';
      default: return '⚠️';
    }
  }

  function getCategoryColor(category: string) {
    switch (category?.toLowerCase()) {
      case 'colors': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600', badge: 'bg-red-100 text-red-800' };
      case 'typography': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' };
      case 'logo': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-800' };
      case 'layout': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600', badge: 'bg-green-100 text-green-800' };
      case 'spacing': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' };
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' };
    }
  }

  function getScoreColor(score: number) {
    if (score >= 0.8) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', progress: 'bg-green-500' };
    if (score >= 0.6) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', progress: 'bg-yellow-500' };
    return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', progress: 'bg-red-500' };
  }

  function getCategoryDisplayName(category: string) {
    switch (category?.toLowerCase()) {
      case 'colors': return 'Colors';
      case 'typography': return 'Typography';
      case 'logo': return 'Logo';
      case 'layout': return 'Layout';
      case 'spacing': return 'Spacing';
      default: return 'General';
    }
  }

  // Group issues by category and selector
  function groupIssues(issues: any[]) {
    const grouped: Record<string, any> = {};
    
    issues.forEach(issue => {
      // Fix empty category issue
      const category = issue.category || 'general';
      const element = issue.element || 'general';
      const key = `${category}_${element}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          category: category,
          element: element,
          severity: issue.severity || 'medium',
          issues: [],
          elements: new Set()
        };
      }
      grouped[key].issues.push(issue);
      if (issue.element) {
        grouped[key].elements.add(issue.element);
      }
    });

    // Clean up elements and determine highest severity
    Object.values(grouped).forEach((group: any) => {
      group.elements = Array.from(group.elements);
      // Determine highest severity in the group
      const severities = ['low', 'medium', 'high'];
      const maxSeverity = group.issues.reduce((max: string, issue: any) => {
        const currentIdx = severities.indexOf(issue.severity || 'medium');
        const maxIdx = severities.indexOf(max);
        return currentIdx > maxIdx ? issue.severity : max;
      }, group.severity);
      group.severity = maxSeverity;
    });

    return grouped;
  }

  // Get severity color
  function getSeverityColor(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  }

  function getSeverityBadgeStyle(severity: string) {
    switch (severity?.toLowerCase()) {
      case 'high': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
      case 'medium': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' };
      case 'low': return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    }
  }


  // Check if issue is color-related
  function isColorIssue(issue: any): boolean {
    return issue.category === 'colors' || 
           issue.cssProperty?.includes('color') || 
           issue.property?.includes('color');
  }

  // Get color value for swatch
  function getColorValue(issue: any): string {
    return issue.expected || issue.correctValue || issue.found || '#000000';
  }

  // Parse potential comma/space-separated color strings into an array of CSS colors
  function parseColors(value?: string): string[] {
    if (!value) return [];
    
    // First, try to extract hex codes from parentheses (e.g., "White (#ECECEC)" -> "#ECECEC")
    const hexInParens = value.match(/#[0-9A-Fa-f]{6}/g);
    if (hexInParens) {
      return hexInParens.map(h => h.toUpperCase()).slice(0, 8);
    }
    
    // Then try to extract RGB values
    const rgbValues = value.match(/rgba?\([^)]+\)/g);
    if (rgbValues) {
      return rgbValues.slice(0, 8);
    }
    
    // Fallback: split and filter
    return value
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => c && (c.startsWith('#') || c.startsWith('rgb')))
      .slice(0, 8);
  }

  // Convert RGB to hex format
  function rgbToHex(rgb: string): string {
    if (!rgb || !rgb.startsWith('rgb')) return rgb;
    
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return rgb;
    
    const r = parseInt(matches[0]);
    const g = parseInt(matches[1]);
    const b = parseInt(matches[2]);
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  }

  // Format color to hex (normalize RGB to hex)
  function formatColorToHex(color: string): string {
    if (!color) return '';
    if (color.startsWith('#')) return color.toUpperCase();
    if (color.startsWith('rgb')) return rgbToHex(color);
    return color;
  }

  // Get display text for color (hex code)
  function getColorDisplay(color: string): string {
    return formatColorToHex(color);
  }

  // Generate summary statistics
  function getSummaryStats() {
    const issues = auditData?.issues || [];
    const grouped = groupIssues(issues);
    
    const stats = {
      total: issues.length,
      byCategory: {} as Record<string, number>,
      bySeverity: { high: 0, medium: 0, low: 0 }
    };

    Object.values(grouped).forEach((group: any) => {
      const category = group.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + group.issues.length;
      
      const severity = group.severity?.toLowerCase() || 'medium';
      if (severity === 'high') stats.bySeverity.high++;
      else if (severity === 'medium') stats.bySeverity.medium++;
      else stats.bySeverity.low++;
    });

    return stats;
  }

  const groupedIssues = groupIssues(auditData?.issues || []);
  const summaryStats = getSummaryStats();
</script>

<div class="space-y-6">
  <!-- Header with Overall Score -->
  <Card class="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle class="text-2xl font-bold text-gray-900">
            Brand Compliance Analysis
          </CardTitle>
          <CardDescription class="text-gray-600 mt-2">
            Analysis for <strong>{brandName}</strong> • {websiteUrl}
          </CardDescription>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold text-blue-600">
            {Math.round((auditData?.overallScore || 0) * 100)}%
          </div>
          <div class="text-sm text-gray-500">
            {auditData?.overallScore > 0.8 ? 'Excellent' : 
             auditData?.overallScore > 0.6 ? 'Good' : 
             auditData?.overallScore > 0.4 ? 'Needs Improvement' : 'Poor'}
          </div>
        </div>
      </div>
    </CardHeader>
  </Card>

  <!-- Website Screenshot with Visual Audit -->
  {#if screenshot || visualData?.annotatedScreenshot}
    <Card class="bg-gray-50 border-gray-200">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-lg font-semibold text-gray-900 flex items-center">
              📸 Website Screenshot
              {#if visualData?.annotatedScreenshot}
                <span class="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Visual Audit Mode
                </span>
              {/if}
            </CardTitle>
            <CardDescription>
              {#if visualData?.annotatedScreenshot}
                Interactive visual reference with issue annotations
              {:else}
                Visual reference for identifying issues on the webpage
              {/if}
            </CardDescription>
          </div>
          {#if visualData?.annotatedScreenshot}
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onclick={openFullscreenModal}
                class="flex items-center gap-2"
                type="button"
              >
                <Maximize2 class="w-4 h-4" />
                Fullscreen
              </Button>
            </div>
          {/if}
        </div>
      </CardHeader>
      <CardContent>
        <div class="relative">
          <img 
            src={visualData?.annotatedScreenshot || screenshot} 
            alt="Website Screenshot" 
            class="max-w-full h-auto rounded-lg shadow-lg border border-gray-200"
            style="max-height: 600px;"
          />
          
          <!-- Removed interactive overlays and warning box -->
        </div>
        
        <!-- Removed instructional text about clicking highlighted areas -->
      </CardContent>
    </Card>
  {/if}

  <!-- Priority Summary Cards -->
  <Card class="mb-6">
    <CardHeader>
      <CardTitle class="text-lg font-semibold text-gray-900 flex items-center">
        <AlertTriangle class="h-5 w-5 text-gray-600 mr-2" />
        Priority Summary
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- High Priority -->
        <div class="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-4xl font-bold text-red-700 mb-1">{summaryStats.bySeverity.high}</div>
              <div class="text-sm font-semibold text-red-800 uppercase tracking-wide">High Priority</div>
              <div class="text-xs text-red-600 mt-1">Requires immediate attention</div>
            </div>
            <div class="bg-red-200 rounded-full p-3">
              <AlertTriangle class="h-8 w-8 text-red-700" />
            </div>
          </div>
        </div>

        <!-- Medium Priority -->
        <div class="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-4xl font-bold text-orange-700 mb-1">{summaryStats.bySeverity.medium}</div>
              <div class="text-sm font-semibold text-orange-800 uppercase tracking-wide">Medium Priority</div>
              <div class="text-xs text-orange-600 mt-1">Should be addressed soon</div>
            </div>
            <div class="bg-orange-200 rounded-full p-3">
              <Info class="h-8 w-8 text-orange-700" />
            </div>
          </div>
        </div>

        <!-- Low Priority -->
        <div class="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-4xl font-bold text-yellow-700 mb-1">{summaryStats.bySeverity.low}</div>
              <div class="text-sm font-semibold text-yellow-800 uppercase tracking-wide">Low Priority</div>
              <div class="text-xs text-yellow-600 mt-1">Nice to have improvements</div>
            </div>
            <div class="bg-yellow-200 rounded-full p-3">
              <Info class="h-8 w-8 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Category Scores -->
  <Card class="mb-6">
    <CardHeader>
      <CardTitle class="text-lg font-semibold text-gray-900 flex items-center">
        <CheckCircle class="h-5 w-5 text-gray-600 mr-2" />
        Category Scores
      </CardTitle>
      <CardDescription>
        Compliance scores for each brand guideline category
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each Object.entries(auditData?.categoryScores || {}) as [category, score]}
          {@const scoreNum = score as number}
          {@const scorePercent = Math.round(scoreNum * 100)}
          {@const scoreStyle = getScoreColor(scoreNum)}
          {@const categoryColors = getCategoryColor(category)}
          
          <div class="relative overflow-hidden {categoryColors.bg} {categoryColors.border} border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">{getCategoryIcon(category)}</div>
                <div>
                  <div class="font-semibold {categoryColors.text} capitalize text-base">
                    {getCategoryDisplayName(category)}
                  </div>
                  <div class="text-xs {categoryColors.text} opacity-75 mt-0.5">
                    Brand compliance
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold {scoreStyle.color}">
                  {scorePercent}%
                </div>
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                class="h-full {scoreStyle.progress} rounded-full transition-all duration-500"
                style="width: {scorePercent}%"
              ></div>
            </div>
            
            <!-- Score Indicator -->
            <div class="mt-2 text-xs {scoreStyle.color} font-medium">
              {#if scorePercent >= 80}
                ✓ Excellent
              {:else if scorePercent >= 60}
                ⚠ Needs Improvement
              {:else}
                ✗ Critical
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </CardContent>
  </Card>

  <!-- Issues Section -->
  {#if Object.keys(groupedIssues).length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center">
          <AlertTriangle class="h-5 w-5 text-red-500 mr-2" />
          Issues Found ({summaryStats.total})
        </CardTitle>
        <CardDescription>
          Click on any section to expand and see detailed fixes
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#each Object.entries(groupedIssues) as [key, group]}
          {@const sectionId = key}
          {@const isExpanded = expandedSections.has(sectionId)}
          {@const categoryColors = getCategoryColor(group.category)}
          {@const severityStyle = getSeverityBadgeStyle(group.severity)}
          {@const displayCategory = getCategoryDisplayName(group.category)}
          {@const displayElement = group.element === 'general' ? '' : group.element}
          
          <div class="border-2 {categoryColors.border} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <button
              class="w-full p-5 {categoryColors.bg} hover:opacity-90 transition-all flex items-center justify-between"
              onclick={() => toggleSection(sectionId)}
            >
              <div class="flex items-center space-x-4 flex-1">
                <div class="bg-white rounded-lg p-2 shadow-sm">
                  <span class="text-2xl">{getCategoryIcon(group.category)}</span>
                </div>
                <div class="text-left flex-1">
                  <div class="font-bold {categoryColors.text} text-lg mb-1">
                    {displayCategory}{displayElement ? ` — ${displayElement}` : ''}
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="text-sm {categoryColors.text} opacity-75">
                      {group.issues.length} issue{group.issues.length !== 1 ? 's' : ''}
                    </span>
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full border {severityStyle.bg} {severityStyle.text} {severityStyle.border}">
                      {group.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div class="ml-4">
                {#if isExpanded}
                  <ChevronDown class="h-5 w-5 {categoryColors.text}" />
                {:else}
                  <ChevronRight class="h-5 w-5 {categoryColors.text}" />
                {/if}
              </div>
            </button>

            {#if isExpanded}
              <div class="p-5 bg-white border-t-2 {categoryColors.border}">
                <!-- Issues List -->
                <div class="space-y-4 mb-4">
                  {#each group.issues as issue}
                    {@const issueSeverity = getSeverityBadgeStyle(issue.severity || 'medium')}
                    <div class="border-l-4 {categoryColors.border} bg-gray-50 rounded-r-lg p-4 hover:bg-gray-100 transition-colors">
                      <div class="flex items-start justify-between mb-2">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-0.5 text-xs font-semibold rounded {issueSeverity.bg} {issueSeverity.text}">
                              {issue.severity?.toUpperCase() || 'MEDIUM'}
                            </span>
                          </div>
                          <div class="font-semibold text-gray-900 text-base leading-relaxed">
                            {issue.message || issue.description || issue.title || `${issue.cssProperty}: ${issue.found} → ${issue.expected}`}
                          </div>
                          {#if issue.recommendation || issue.suggestion}
                            <div class="mt-2 text-sm text-gray-600 italic">
                              💡 {issue.recommendation || issue.suggestion}
                            </div>
                          {/if}
                        </div>
                      </div>
                      {#if isColorIssue(issue)}
                          {@const expectedColors: string[] = parseColors(issue.expected || issue.correctValue)}
                          {@const foundColors: string[] = parseColors(issue.found || issue.actualValue)}
                          {@const isSuggestion = issue.type === 'secondary_color_missing'}
                          <div class="mt-3 space-y-3">
                            <!-- Expected Colors -->
                            <div class="flex flex-col space-y-2">
                              <span class="text-xs font-medium text-gray-700 uppercase tracking-wide">Expected</span>
                              <div class="flex flex-wrap items-center gap-3">
                                {#if expectedColors.length > 0}
                                  {#each expectedColors as c}
                                    <div class="flex items-center space-x-2 bg-white px-2 py-1.5 rounded border border-gray-200 shadow-sm">
                                      <div class="w-6 h-6 rounded border border-gray-300 flex-shrink-0" style="background-color: {c}"></div>
                                      <span class="text-xs font-mono font-semibold text-gray-700">{getColorDisplay(c)}</span>
                                    </div>
                                  {/each}
                                {:else}
                                  <div class="flex items-center space-x-2 bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                                    <div class="w-6 h-6 rounded border border-gray-300 bg-gray-100"></div>
                                    <span class="text-xs text-gray-400 italic">No colors specified</span>
                                  </div>
                                {/if}
                              </div>
                            </div>
                            <!-- Found Colors - Only show if not a suggestion issue -->
                            {#if !isSuggestion}
                              <div class="flex flex-col space-y-2">
                                <span class="text-xs font-medium text-gray-700 uppercase tracking-wide">Found</span>
                                <div class="flex flex-wrap items-center gap-3">
                                  {#if foundColors.length > 0}
                                    {#each foundColors as c}
                                      <div class="flex items-center space-x-2 bg-white px-2 py-1.5 rounded border border-gray-200 shadow-sm">
                                        <div class="w-6 h-6 rounded border border-gray-300 flex-shrink-0" style="background-color: {c}"></div>
                                        <span class="text-xs font-mono font-semibold text-gray-700">{getColorDisplay(c)}</span>
                                      </div>
                                    {/each}
                                  {:else}
                                    <div class="flex items-center space-x-2 bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                                      <div class="w-6 h-6 rounded border border-gray-300 bg-gray-100"></div>
                                      <span class="text-xs text-gray-400 italic">No colors detected</span>
                                    </div>
                                  {/if}
                                </div>
                              </div>
                            {/if}
                          </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </CardContent>
    </Card>
  {:else}
    <Card class="bg-green-50 border-green-200">
      <CardContent class="p-8 text-center">
        <CheckCircle class="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-green-800 mb-2">No Issues Found!</h3>
        <p class="text-green-700">
          Your website is fully compliant with the brand guidelines. Great job! 🎉
        </p>
      </CardContent>
    </Card>
  {/if}

  <!-- Recommendations -->
  {#if auditData?.recommendations && auditData.recommendations.length > 0}
    <Card>
      <CardHeader>
        <CardTitle class="text-lg flex items-center">
          <Info class="h-5 w-5 text-blue-500 mr-2" />
          Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2">
          {#each auditData.recommendations as recommendation}
            <li class="flex items-start space-x-2">
              <CheckCircle class="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span class="text-gray-700">{recommendation.message || recommendation.action || recommendation.title || recommendation}</span>
            </li>
          {/each}
        </ul>
      </CardContent>
    </Card>
  {/if}

  <!-- Auto-Fix Prompt (moved below recommendations) -->
  {#if fixPrompt}
    <Card class="mt-8">
      <CardHeader>
        <CardTitle class="text-lg font-semibold">🪄 Auto-Fix Prompt</CardTitle>
        <CardDescription>
          Copy and paste this prompt into your preferred AI agent (e.g., Gemini) to auto-correct your code to the brand guidelines.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <textarea readonly class="w-full h-72 p-3 bg-gray-50 rounded border font-mono text-sm">{fixPrompt}</textarea>
          <div class="flex justify-end">
            <Button variant="outline" size="sm" onclick={() => copyToClipboard(fixPrompt || '', 'aiPrompt')}>Copy Prompt</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Issue Detail Modal for Visual Audit -->
  {#if selectedIssue}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card class="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <span class="text-lg">{getCategoryIcon(selectedIssue.category)}</span>
            Issue #{auditData?.issues?.indexOf(selectedIssue) + 1}: {selectedIssue.category}
          </CardTitle>
          <CardDescription>
            Detailed information about this compliance issue
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Issue Description</h4>
            <p class="text-gray-700">{selectedIssue.message}</p>
          </div>
          
          {#if selectedIssue.suggestion}
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Recommendation</h4>
              <p class="text-gray-700">{selectedIssue.suggestion}</p>
            </div>
          {/if}
          
          <div class="flex items-center gap-4">
            <div>
              <span class="text-sm text-gray-500">Severity:</span>
              <span class="ml-1 px-2 py-1 rounded text-xs font-medium text-white" 
                    style="background-color: {getSeverityColor(selectedIssue.severity)}">
                {selectedIssue.severity}
              </span>
            </div>
            <div>
              <span class="text-sm text-gray-500">Category:</span>
              <span class="ml-1 capitalize">{selectedIssue.category}</span>
            </div>
          </div>
        </CardContent>
        <div class="p-4 border-t">
          <Button onclick={() => selectIssue(null)} class="w-full">
            Close
          </Button>
        </div>
      </Card>
    </div>
  {/if}

  <!-- Fullscreen Screenshot Modal -->
  <FullscreenScreenshotModal
    isOpen={showFullscreenModal}
    screenshot={screenshot}
    annotatedScreenshot={visualData?.annotatedScreenshot}
    issues={auditData?.issues || []}
    elementPositions={visualData?.elementPositions || []}
    on:close={closeFullscreenModal}
  />
</div>

<style>
  /* Visual Audit Styles */
  .highlights-overlay {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .issue-highlight {
    position: absolute;
    border: 2px dashed;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 4px;
    background: transparent;
    padding: 0;
    margin: 0;
  }

  .issue-highlight:hover {
    border-style: solid;
    transform: scale(1.02);
  }

  .issue-highlight.colors { border-color: #FF6B6B; }
  .issue-highlight.typography { border-color: #4ECDC4; }
  .issue-highlight.logo { border-color: #45B7D1; }
  .issue-highlight.layout { border-color: #96CEB4; }
  .issue-highlight.spacing { border-color: #FFA726; }

  .issue-highlight.high { border-width: 3px; }
  .issue-highlight.medium { border-width: 2px; }
  .issue-highlight.low { border-width: 1px; }

  .issue-marker {
    position: absolute;
    top: -12px;
    left: -12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
  }

  .issue-highlight.colors .issue-marker { background: #FF6B6B; }
  .issue-highlight.typography .issue-marker { background: #4ECDC4; }
  .issue-highlight.logo .issue-marker { background: #45B7D1; }
  .issue-highlight.layout .issue-marker { background: #96CEB4; }
  .issue-highlight.spacing .issue-marker { background: #FFA726; }
</style>