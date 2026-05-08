<template>
  <UForm :state="state" class="space-y-4" @submit="$emit('submit', state)">
    <!-- Row 1: Name & Amount (Optimized Widths) -->
    <div :class="['grid grid-cols-1 gap-4', layout === 'onboarding' ? 'md:grid-cols-10' : 'md:grid-cols-2']">
      <UInput v-model="state.name" placeholder="Nom de la transaction" size="lg" :class="layout === 'onboarding' ? 'md:col-span-7' : 'w-full'" />
      <UInput v-model="state.amount" type="number" step="0.01" placeholder="Montant (€)" size="lg" :class="layout === 'onboarding' ? 'md:col-span-3' : 'w-full'" />
    </div>

    <!-- ONBOARDING LAYOUT (Refined) -->
    <template v-if="layout === 'onboarding'">
      <!-- Line 2: Account, Date & End Date Switch -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-3">
          <USelect v-model="state.account" :items="accountOptions" placeholder="Compte" size="lg" class="w-full" />
        </div>
        
        <div class="md:col-span-6">
          <UInputDate v-if="isRangeMode" ref="inputDate" v-model="rangeDate" range size="lg">
            <template #trailing>
              <UPopover :reference="inputDate?.inputsRef[0]?.$el">
                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                <template #content>
                  <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-default">
                    <div class="p-2 space-y-1 bg-default/5 w-fit min-w-32 shrink-0">
                      <p class="text-[10px] font-bold text-muted uppercase tracking-wider px-2 py-1">Raccourcis</p>
                      <UButton 
                        v-for="preset in datePresets" 
                        :key="preset.label"
                        :label="preset.label" 
                        variant="ghost" 
                        color="neutral" 
                        size="xs" 
                        class="w-full justify-start font-medium"
                        @click="setDatePreset(preset.value)"
                      />
                    </div>
                    <UCalendar v-model="rangeDate" class="p-2" :number-of-months="2" range />
                  </div>
                </template>
              </UPopover>
            </template>
          </UInputDate>
          <UInputDate v-else ref="inputDate" v-model="singleDate" size="lg">
            <template #trailing>
              <UPopover :reference="inputDate?.inputsRef[0]?.$el">
                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                <template #content>
                  <UCalendar v-model="singleDate" class="p-2" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </div>

        <div class="md:col-span-3 flex items-center gap-3">
          <USwitch 
            v-model="isRangeMode" 
            unchecked-icon="i-lucide-x" 
            checked-icon="i-lucide-check"
            color="primary"
            size="lg"
          />
          <span class="text-sm text-white/60">Date de fin</span>
        </div>
      </div>

      <!-- Line 3: Frequency & Add Button -->
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2">
        <div class="w-full md:flex-1">
          <UTabs 
            v-model="state.frequency" 
            :items="frequencyOptions" 
            class="w-full frequency-tabs"
          />
        </div>

        <UButton 
          type="submit" 
          :label="submitLabel" 
          color="primary"
          size="lg" 
          :loading="loading" 
          :disabled="!isValid" 
          class="px-12 font-bold"
        />
      </div>
    </template>

    <!-- DEFAULT LAYOUT -->
    <template v-else>
      <!-- Row 2: Account & Type -->
      <div :class="['grid grid-cols-1 gap-4', showType ? 'md:grid-cols-2' : '']">
        <USelect v-model="state.account" :items="accountOptions" placeholder="Compte" size="lg" class="w-full" />
        <USelect v-if="showType" v-model="state.type" :items="typeOptions" size="lg" class="w-full" />
      </div>

      <!-- Row 3 & 4: Frequency & Date -->
      <div class="space-y-4 pt-2">
        <UTabs 
          v-model="state.frequency" 
          :items="frequencyOptions" 
          class="w-full frequency-tabs"
        />

        <div class="flex flex-col sm:flex-row items-center justify-start gap-6 pt-2">
          <div class="w-full sm:w-auto min-w-[280px]">
            <UInputDate v-if="isRangeMode" ref="inputDate" v-model="rangeDate" range size="lg">
              <template #trailing>
                <UPopover :reference="inputDate?.inputsRef[0]?.$el">
                  <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                  <template #content>
                    <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-default">
                      <div class="p-2 space-y-1 bg-default/5 w-fit min-w-32 shrink-0">
                        <p class="text-[10px] font-bold text-muted uppercase tracking-wider px-2 py-1">Raccourcis</p>
                        <UButton 
                          v-for="preset in datePresets" 
                          :key="preset.label"
                          :label="preset.label" 
                          variant="ghost" 
                          color="neutral" 
                          size="xs" 
                          class="w-full justify-start font-medium"
                          @click="setDatePreset(preset.value)"
                        />
                      </div>
                      <UCalendar v-model="rangeDate" class="p-2" :number-of-months="2" range />
                    </div>
                  </template>
                </UPopover>
              </template>
            </UInputDate>
            <UInputDate v-else ref="inputDate" v-model="singleDate" size="lg">
              <template #trailing>
                <UPopover :reference="inputDate?.inputsRef[0]?.$el">
                  <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                  <template #content>
                    <UCalendar v-model="singleDate" class="p-2" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <USwitch 
              v-model="isRangeMode" 
              unchecked-icon="i-lucide-x" 
              checked-icon="i-lucide-check"
              color="primary"
            />
            <span class="text-sm font-medium text-white/80">Date de fin</span>
          </div>
        </div>
      </div>

      <!-- Row 5: Action Button -->
      <div class="flex justify-start pt-4">
        <UButton 
          type="submit" 
          :label="submitLabel" 
          color="primary"
          size="lg" 
          :loading="loading" 
          :disabled="!isValid" 
          class="px-8"
        />
      </div>
    </template>
  </UForm>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, useTemplateRef } from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { TabsItem } from '@nuxt/ui'

const props = withDefaults(defineProps<{
  accountOptions: { label: string; value: string }[]
  loading?: boolean
  submitLabel?: string
  initialType?: 'income' | 'expense'
  showType?: boolean
  layout?: 'default' | 'onboarding'
}>(), {
  showType: true,
  initialType: 'expense',
  layout: 'default'
})

const emit = defineEmits(['submit'])

const inputDate = useTemplateRef('inputDate')
const isRangeMode = ref(true)

const singleDate = shallowRef(
  new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
)
const rangeDate = shallowRef({
  start: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
  end: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
})

const state = ref({
  name: '',
  amount: null as number | null,
  account: '',
  frequency: 'monthly' as 'once' | 'monthly' | 'quarterly' | 'yearly',
  type: props.initialType || 'expense',
  startDate: rangeDate.value.start,
  endDate: rangeDate.value.end
})

const frequencyOptions: TabsItem[] = [
  { label: 'Unique', value: 'once' },
  { label: 'Mensuel', value: 'monthly' },
  { label: 'Trimestriel', value: 'quarterly' },
  { label: 'Annuel', value: 'yearly' }
]

const typeOptions = [
  { label: 'Revenu', value: 'income' },
  { label: 'Dépense', value: 'expense' }
]

const isValid = computed(() => {
  return state.value.name.trim() && (state.value.amount ?? 0) > 0 && state.value.account
})

const submitLabel = computed(() => props.submitLabel || 'Ajouter')

watch(rangeDate, (newValue) => {
  state.value.startDate = newValue.start
  state.value.endDate = newValue.end
}, { deep: true })

watch(singleDate, (newValue) => {
  state.value.startDate = newValue
  state.value.endDate = newValue
})

watch(() => props.initialType, (newType) => {
  if (newType) {
    state.value.type = newType
  }
}, { immediate: true })

watch(() => state.value.frequency, (newFrequency) => {
  const currentStart = state.value.startDate
  const start = new CalendarDate(currentStart.year, currentStart.month, currentStart.day)
  const startDateObj = new Date(start.year, start.month - 1, start.day)
  let endDate = new Date(startDateObj)

  if (newFrequency !== 'once') {
    isRangeMode.value = true
  }

  switch (newFrequency) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1)
      break
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3)
      break
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1)
      break
    case 'once':
    default:
      singleDate.value = start
      break
  }

  const end = new CalendarDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate())
  rangeDate.value = { start, end }
})

const setDatePreset = (value: string | number) => {
  const start = rangeDate.value.start
  let end: CalendarDate

  if (value === 'endOfYear') {
    end = new CalendarDate(start.year, 12, 31)
  } else {
    const startDateObj = new Date(start.year, start.month - 1, start.day)
    const endDateObj = new Date(startDateObj)
    endDateObj.setMonth(endDateObj.getMonth() + (value as number))
    end = new CalendarDate(endDateObj.getFullYear(), endDateObj.getMonth() + 1, endDateObj.getDate())
  }

  rangeDate.value = { start, end }
}

const datePresets = [
  { label: 'Fin de l\'année', value: 'endOfYear' },
  { label: 'Pendant 1 mois', value: 1 },
  { label: 'Pendant 3 mois', value: 3 },
  { label: 'Pendant 6 mois', value: 6 },
  { label: 'Pendant 1 an', value: 12 }
]

const reset = () => {
  state.value.name = ''
  state.value.amount = null
  // On garde le compte par défaut
}

defineExpose({ reset })
</script>

<style scoped>
:deep(.frequency-tabs [role="tablist"]) {
  background-color: #18181B !important;
}
</style>
