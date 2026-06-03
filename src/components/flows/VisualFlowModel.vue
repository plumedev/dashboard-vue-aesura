<template>
  <div class="border border-default bg-elevated/40 rounded-xl p-6 relative overflow-hidden">
    <div class="flex items-center gap-2 mb-6 border-b border-default/50 pb-4">
      <UIcon name="i-lucide-network" class="w-5 h-5 text-tertiary" style="color: #00A36C;" />
      <h3 class="text-md font-semibold text-highlighted uppercase tracking-wider font-mono">
        Modèle de flux visuel
      </h3>
    </div>

    <div v-if="rules.length === 0" class="text-center py-12 text-muted font-mono text-xs">
      Aucune règle de transfert configurée pour générer le schéma.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 relative min-h-[300px]">
      <!-- Column 1: Sources -->
      <div class="flex flex-col gap-4 justify-center">
        <div class="text-[10px] font-bold text-muted font-mono uppercase tracking-widest border-b border-dashed border-default pb-1 mb-2">
          Sources de fonds
        </div>
        <div 
          v-for="source in computedFlowData.sources" 
          :key="source.id"
          class="flow-card p-4 rounded-lg border border-default bg-surface shadow-sm relative group transition-all duration-300 hover:border-tertiary"
          :class="{ 'border-active': activeNode === source.name }"
          @mouseenter="activeNode = source.name"
          @mouseleave="activeNode = null"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-wallet" class="text-muted w-4 h-4" />
            <span class="font-mono text-sm font-semibold text-highlighted uppercase">{{ source.name }}</span>
          </div>
          <div class="mt-2 text-xl font-bold text-highlighted font-mono">
            {{ formatMoney(source.amount) }}
          </div>
          <div class="text-[10px] text-muted font-mono mt-1">
            Total distribué
          </div>
        </div>
      </div>

      <!-- Column 2: Transits -->
      <div class="flex flex-col gap-4 justify-center relative">
        <div class="text-[10px] font-bold text-muted font-mono uppercase tracking-widest border-b border-dashed border-default pb-1 mb-2">
          Comptes de Transit
        </div>
        
        <div v-if="computedFlowData.transits.length === 0" class="flex items-center justify-center h-full border border-dashed border-default/50 rounded-lg p-6 text-center text-muted font-mono text-[10px]">
          (Virements directs uniquement)
        </div>

        <div 
          v-else
          v-for="transit in computedFlowData.transits" 
          :key="transit.id"
          class="flow-card p-4 rounded-lg border border-default bg-surface shadow-sm relative group transition-all duration-300 hover:border-tertiary"
          :class="{ 'border-active': activeNode === transit.name }"
          @mouseenter="activeNode = transit.name"
          @mouseleave="activeNode = null"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-refresh-cw" class="text-muted w-4 h-4 animate-spin-slow" />
              <span class="font-mono text-sm font-semibold text-highlighted uppercase">{{ transit.name }}</span>
            </div>
            <UBadge size="sm" variant="subtle" color="neutral" class="font-mono">
              Transit
            </UBadge>
          </div>
          <div class="mt-2 text-xl font-bold text-highlighted font-mono">
            {{ formatMoney(transit.amount) }}
          </div>
          <div class="text-[10px] text-muted font-mono mt-1">
            Reçu & dispatché
          </div>
        </div>
      </div>

      <!-- Column 3: Destinations -->
      <div class="flex flex-col gap-4 justify-center">
        <div class="text-[10px] font-bold text-muted font-mono uppercase tracking-widest border-b border-dashed border-default pb-1 mb-2">
          Enveloppes & Epargnes
        </div>
        <div 
          v-for="dest in computedFlowData.destinations" 
          :key="dest.id"
          class="flow-card p-4 rounded-lg border border-default bg-surface shadow-sm relative group transition-all duration-300 hover:border-tertiary"
          :class="{ 'border-active': activeNode === dest.name || activeNode === dest.transitName }"
          @mouseenter="activeNode = dest.name"
          @mouseleave="activeNode = null"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <UIcon :name="getDestIcon(dest.name)" class="text-muted w-4 h-4" />
              <span class="font-mono text-sm font-semibold text-highlighted uppercase">{{ dest.name }}</span>
            </div>
            <UBadge 
              v-if="dest.transitName" 
              size="sm" 
              variant="subtle" 
              color="success" 
              class="font-mono text-[9px]"
              style="color: #00A36C; background: rgba(0, 163, 108, 0.1);"
            >
              via {{ dest.transitName }}
            </UBadge>
            <UBadge 
              v-else 
              size="sm" 
              variant="subtle" 
              color="neutral" 
              class="font-mono text-[9px]"
            >
              Direct
            </UBadge>
          </div>
          <div class="mt-2 text-xl font-bold text-highlighted font-mono">
            {{ formatMoney(dest.amount) }}
          </div>
          <div class="text-[10px] text-muted font-mono mt-1">
            {{ dest.ruleName }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatMoney } from '@/helpers/moneyHelpers'
import type { DocumentData } from 'firebase/firestore'

const props = defineProps<{
  rules: DocumentData[]
  steps: any[]
}>()

const activeNode = ref<string | null>(null)

const getDestIcon = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('bybit') || n.includes('crypto')) return 'i-lucide-coins'
  if (n.includes('course') || n.includes('groceries')) return 'i-lucide-shopping-cart'
  if (n.includes('commun') || n.includes('joint')) return 'i-lucide-users'
  if (n.includes('loyer') || n.includes('rent')) return 'i-lucide-home'
  if (n.includes('épargne') || n.includes('voyage') || n.includes('save')) return 'i-lucide-compass'
  return 'i-lucide-arrow-right-circle'
}

const computedFlowData = computed(() => {
  const sourcesMap = new Map<string, { id: string; name: string; amount: number }>()
  const transitsMap = new Map<string, { id: string; name: string; amount: number }>()
  const destinations: { id: string; name: string; amount: number; transitName?: string; ruleName: string }[] = []

  props.steps.forEach((step, index) => {
    const amount = Number(step.amount || 0)
    
    // 1. Source aggregation
    const sourceName = step.sourceName || 'Source inconnue'
    if (sourcesMap.has(sourceName)) {
      sourcesMap.get(sourceName)!.amount += amount
    } else {
      sourcesMap.set(sourceName, { id: `src-${index}`, name: sourceName, amount })
    }

    // 2. Transit aggregation
    if (step.transitName) {
      const transitName = step.transitName
      if (transitsMap.has(transitName)) {
        transitsMap.get(transitName)!.amount += amount
      } else {
        transitsMap.set(transitName, { id: `trans-${index}`, name: transitName, amount })
      }
    }

    // 3. Destination list
    const destName = step.destName || 'Destination inconnue'
    destinations.push({
      id: `dest-${index}`,
      name: destName,
      amount,
      transitName: step.transitName || undefined,
      ruleName: step.name
    })
  })

  return {
    sources: Array.from(sourcesMap.values()),
    transits: Array.from(transitsMap.values()),
    destinations: destinations.sort((a, b) => (b.transitName ? 1 : 0) - (a.transitName ? 1 : 0))
  }
})
</script>

<style scoped>
.animate-spin-slow {
  animation: spin 8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.flow-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.border-active {
  border-color: #00A36C !important;
  box-shadow: 0 0 10px rgba(0, 163, 108, 0.15) !important;
}
</style>
