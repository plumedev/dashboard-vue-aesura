
<template>
  <UPopover
    :content="{ align: 'start' }"
    :modal="true"
  >
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar"
      class="data-[state=open]:bg-elevated group"
    >
      <span
        class="truncate"
      >
        <template
          v-if="selected.start"
        >
          <template
            v-if="selected.end"
          >
            {{ df.format(selected.start) }} - {{ df.format(selected.end) }}
          </template>
          <template
            v-else
          >
            {{ df.format(selected.start) }}
          </template>
        </template>
        <template
          v-else
        >
          Pick a date
        </template>
      </span>

      <template
        #trailing
      >
        <UIcon
          name="i-lucide-chevron-down"
          class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200"
        />
      </template>
    </UButton>

    <template
      #content
    >
      <div
        class="flex items-stretch sm:divide-x divide-default"
      >
        <div
          class="hidden sm:flex flex-col justify-center"
        >
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[isRangeSelected(range) ? 'bg-elevated' : 'hover:bg-elevated/50']"
            truncate
            @click="selectRange(range)"
          />
        </div>

        <UCalendar
          v-model="calendarRange"
          class="p-2"
          :number-of-months="2"
          range
          locale="fr-FR"
        />
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DateFormatter, getLocalTimeZone, CalendarDate, today } from '@internationalized/date'
import type { Range } from '../../types'

const df = new DateFormatter('fr-FR', {
  dateStyle: 'medium'
})

const selected = defineModel<Range>({ required: true })

const ranges = [
  { label: 'Ce mois-ci', currentMonth: true },
  { label: '7 derniers jours', days: 7 },
  { label: '14 derniers jours', days: 14 },
  { label: '30 derniers jours', days: 30 },
  { label: '3 derniers mois', months: 3 },
  { label: '6 derniers mois', months: 6 },
  { label: '1 an', years: 1 }
]

const toCalendarDate = (date: Date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

const calendarRange = computed({
  get: () => ({
    start: selected.value.start ? toCalendarDate(selected.value.start) : undefined,
    end: selected.value.end ? toCalendarDate(selected.value.end) : undefined
  }),
  set: (newValue: { start: CalendarDate | undefined, end: CalendarDate | undefined }) => {
    selected.value = {
      start: newValue.start ? newValue.start.toDate(getLocalTimeZone()) : new Date(),
      end: newValue.end ? newValue.end.toDate(getLocalTimeZone()) : new Date()
    }
  }
})

const isRangeSelected = (range: { days?: number, months?: number, years?: number, currentMonth?: boolean }) => {
  if (!selected.value.start || !selected.value.end) return false

  const currentDate = today(getLocalTimeZone())
  let startDate: CalendarDate
  let endDate: CalendarDate

  if (range.currentMonth) {

    startDate = new CalendarDate(currentDate.year, currentDate.month, 1)

    endDate = new CalendarDate(currentDate.year, currentDate.month, currentDate.calendar.getDaysInMonth(currentDate))
  } else {
    endDate = currentDate.copy()
    startDate = endDate.copy()
    if (range.days) {
      startDate = startDate.subtract({ days: range.days })
    } else if (range.months) {
      startDate = startDate.subtract({ months: range.months })
    } else if (range.years) {
      startDate = startDate.subtract({ years: range.years })
    }
  }

  const selectedStart = toCalendarDate(selected.value.start)
  const selectedEnd = toCalendarDate(selected.value.end)

  return selectedStart.compare(startDate) === 0 && selectedEnd.compare(endDate) === 0
}

const selectRange = (range: { days?: number, months?: number, years?: number, currentMonth?: boolean }) => {
  const currentDate = today(getLocalTimeZone())
  let startDate: CalendarDate
  let endDate: CalendarDate

  if (range.currentMonth) {

    startDate = new CalendarDate(currentDate.year, currentDate.month, 1)

    endDate = new CalendarDate(currentDate.year, currentDate.month, currentDate.calendar.getDaysInMonth(currentDate))
  } else {
    endDate = currentDate.copy()
    startDate = endDate.copy()
    if (range.days) {
      startDate = startDate.subtract({ days: range.days })
    } else if (range.months) {
      startDate = startDate.subtract({ months: range.months })
    } else if (range.years) {
      startDate = startDate.subtract({ years: range.years })
    }
  }

  selected.value = {
    start: startDate.toDate(getLocalTimeZone()),
    end: endDate.toDate(getLocalTimeZone())
  }
}
</script>
