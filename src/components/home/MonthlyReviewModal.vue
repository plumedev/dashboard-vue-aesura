<template>
  <UModal v-model:open="open" :title="`Revue du mois : ${currentMonthName}`" description="Passez en revue vos transactions prévues pour ce mois." size="xl">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Revue du mois : {{ currentMonthName }}
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              @click="open = false"
            />
          </div>
        </template>

        <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div v-if="sortedIterations.length === 0" class="text-center py-8 text-muted">
            Aucune transaction trouvée pour ce mois.
          </div>
          
          <div v-for="(iteration, index) in sortedIterations" :key="iteration.id || index" 
            class="p-4 border rounded-lg flex flex-col gap-4 transition-all duration-200"
            :class="[
              iteration.active 
                ? 'border-default bg-elevated/50 shadow-sm' 
                : 'border-dashed border-muted/30 bg-muted/5 opacity-60'
            ]"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1 flex items-center gap-2">
                <UIcon 
                  :name="iteration.active ? 'i-lucide-check-circle' : 'i-lucide-circle-dashed'" 
                  :class="iteration.active ? 'text-primary' : 'text-muted'"
                />
                <UInput v-model="iteration.name" placeholder="Nom" variant="none" class="font-medium text-base w-full" />
              </div>
              <div class="flex items-center gap-3">
                <UBadge :color="iteration.type === 'income' ? 'success' : 'error'" variant="subtle" size="sm" class="capitalize">
                  {{ iteration.type === 'income' ? 'Revenu' : 'Dépense' }}
                </UBadge>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted font-medium uppercase">{{ iteration.active ? 'Activé' : 'Exclu' }}</span>
                  <USwitch v-model="iteration.active" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4" :class="{ 'pointer-events-none opacity-50': !iteration.active }">
              <UFormField label="Montant (€)">
                <UInput v-model="iteration.amount" type="number" step="0.01" icon="i-lucide-euro" />
              </UFormField>
              <UFormField label="Date">
                <UInput v-model="iteration.dateStr" type="date" icon="i-lucide-calendar" />
              </UFormField>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" />
            <UButton label="Valider la revue" color="primary" @click="handleSave" :loading="isSaving" />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc'
import { toDate } from '@/helpers/dateHelpers'
import { useSynthesisStore } from '@/stores/synthesisStore'
import { endOfMonth, format, isWithinInterval, startOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { computed, ref } from 'vue'

const open = ref(false)
const isSaving = ref(false)
const synthesisStore = useSynthesisStore()
const { doRequest: updateDoc } = useUpdateFireDoc()

interface LocalIteration {
  id: string
  transactionId: string
  name: string
  amount: number
  type: 'income' | 'expense'
  date: Date
  dateStr: string
  active: boolean
}

const localIterations = ref<LocalIteration[]>([])

const sortedIterations = computed(() => {
  return [...localIterations.value].sort((a, b) => {
    // Les actifs en haut
    if (a.active !== b.active) {
      return a.active ? -1 : 1
    }
    // Puis par date
    return a.date.getTime() - b.date.getTime()
  })
})

const currentMonthName = computed(() => {
  return format(new Date(), 'MMMM yyyy', { locale: fr })
})

const openModal = async () => {
  await synthesisStore.init()
  
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const iterations: LocalIteration[] = []

  synthesisStore.recurringTransactions.forEach(t => {
    if (t.iterations && Array.isArray(t.iterations)) {
      t.iterations.forEach(it => {
        const itDate = toDate(it.date)
        if (isWithinInterval(itDate, { start: monthStart, end: monthEnd })) {
          iterations.push({
            id: it.id,
            transactionId: t.id,
            name: it.name || t.name,
            amount: it.amount ?? t.amount,
            type: it.type || t.type,
            date: itDate,
            dateStr: format(itDate, 'yyyy-MM-dd'),
            active: it.active !== false // Default to true
          })
        }
      })
    }
  })

  // Sort by date
  localIterations.value = iterations.sort((a, b) => a.date.getTime() - b.date.getTime())
  open.value = true
}

const handleSave = async () => {
  isSaving.value = true
  try {
    for (const it of localIterations.value) {
      const itDate = new Date(it.dateStr)
      
      await updateDoc({
        collectionName: `recurringTransactions/${it.transactionId}/iterations`,
        documentId: it.id,
        data: {
          name: it.name,
          amount: Number(it.amount),
          date: Timestamp.fromDate(itDate),
          active: it.active
        },
        showToast: false,
        requireAuth: false // We bypass auth check for iterations as they don't have userId
      })
    }
    
    await synthesisStore.getRecurringTransactions()
    open.value = false
  } catch (error) {
    console.error('Error saving review:', error)
  } finally {
    isSaving.value = false
  }
}

defineExpose({ openModal })
</script>
