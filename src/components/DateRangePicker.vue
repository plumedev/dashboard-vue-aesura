<template>
  <UFormField :label="label" :class="fieldClass">
    <UInputDate 
      :id="id" 
      ref="inputEffectDate" 
      v-model="dateRange" 
      class="mt-0.5"
      locale="fr-FR" 
      range
    >
      <template #trailing>
        <UPopover :reference="inputEffectDate?.inputsRef[0]?.$el">
          <UButton 
            color="neutral" 
            variant="link" 
            size="sm" 
            icon="i-lucide-calendar"
            :aria-label="ariaLabel" 
            class="px-0" 
          />

          <template #content>
            <UCalendar 
              v-model="dateRange" 
              class="p-2" 
              :number-of-months="numberOfMonths" 
              locale="fr-FR" 
              range 
            />
          </template>
        </UPopover>
      </template>
    </UInputDate>
  </UFormField>
</template>

<script setup lang="ts">
import { shallowRef, useTemplateRef, watch } from 'vue'
import { CalendarDate } from '@internationalized/date'

export interface DateRange {
  start: CalendarDate
  end: CalendarDate
}

interface Props {
  modelValue: DateRange
  label?: string
  id?: string
  ariaLabel?: string
  fieldClass?: string
  numberOfMonths?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  id: 'date-range-picker',
  ariaLabel: 'Sélectionner une date',
  fieldClass: 'flex-1 mt-2',
  numberOfMonths: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
}>()

const inputEffectDate = useTemplateRef('inputEffectDate')

const dateRange = shallowRef<DateRange>({
  start: props.modelValue?.start || new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
  end: props.modelValue?.end || new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
})

// Synchroniser avec le v-model externe
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    dateRange.value = {
      start: newValue.start,
      end: newValue.end
    }
  }
}, { deep: true, immediate: true })

// Émettre les changements vers le parent
watch(dateRange, (newValue) => {
  emit('update:modelValue', {
    start: newValue.start,
    end: newValue.end
  })
}, { deep: true })
</script>
