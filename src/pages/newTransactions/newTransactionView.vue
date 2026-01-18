<template>
  <UModal>
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #content>
      <UCard>
        <h2>Nouvelle transaction</h2>
        <UFormField>
          <UInput v-model="formState.name" placeholder="Nom de la transaction" />
        </UFormField>
        <UFormField>
          <UInput v-model="formState.amount" placeholder="Montant(€)" />
        </UFormField>
        <UFormField>
          <USelect v-model="formState.account" :items="accountsOptions" class="w-full" />
        </UFormField>
        <UFormField>
          <UTabs v-model="formState.frequency" :items="items" class="w-full" />
        </UFormField>
        <UInputDate ref="inputDate" v-model="mvDate" range>
          <template #trailing>
            <UPopover :reference="inputDate?.inputsRef[0]?.$el">
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-calendar"
                aria-label="Select a date range"
                class="px-0"
              />

              <template #content>
                <UCalendar v-model="mvDate" class="p-2" :number-of-months="2" range />
              </template>
            </UPopover>
          </template>
        </UInputDate>
        <pre>{{ formState }}</pre>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc';
import { onMounted } from 'vue';
import { DocumentData } from 'firebase/firestore';
import type { SelectItem } from '@nuxt/ui';
import type { TabsItem } from '@nuxt/ui';
import { CalendarDate } from '@internationalized/date'

interface FormState {
  name: string
  amount: number
  account: string
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly',
  startDate: CalendarDate,
  endDate: CalendarDate
}

const inputDate = useTemplateRef('inputDate')
const mvDate = shallowRef({
  start: new CalendarDate(2022, 1, 10),
  end: new CalendarDate(2022, 1, 20)
})

const { doRequest: getAccounts } = useReadFireDoc()

const accounts = ref<DocumentData[]>([])

const accountsOptions = computed<SelectItem[]>(() => {
  return accounts.value.map((account) => {
    return {
      label: account.accountName,
      value: account.id,
    }
  })
})

const items = ref<TabsItem[]>([
  {
    label: 'Unique',
    value: 'once',
  },
  {
    label: 'Mensuel',
    value: 'monthly',
  },
  {
    label: 'Trimestriel',
    value: 'quarterly',
  },
  {
    label: 'Annuel',
    value: 'yearly',
  }
])




const formState = ref<FormState>({
  name: '',
  amount: 0,
  account: '',
  frequency: 'once',
  startDate: mvDate.value.start,
  endDate: mvDate.value.end
})

watch(mvDate, (newValue) => {
  if (newValue) {
    formState.value.startDate = newValue.start
    formState.value.endDate = newValue.end
  }
}, { deep: true })


onMounted(async () => {
  const result = await getAccounts({ collectionName: 'accounts' })
  if (result && Array.isArray(result)) {
    accounts.value = result
  }
})

</script>
