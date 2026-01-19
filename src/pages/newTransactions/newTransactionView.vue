<template>
  <UModal>
    <UButton label="Open" color="neutral" variant="subtle" />

    <template #content>
      <UCard>
        <h2 class="text-2xl font-bold mb-4">
          Nouvelle transaction
        </h2>
        <UForm>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField required>
              <UInput v-model="formState.name" placeholder="Nom de la transaction" class="w-full" />
            </UFormField>
            <UFormField required>
              <UInput v-model="formState.amount" placeholder="Montant (€)" class="w-full" />
            </UFormField>
            <UFormField required>
              <USelect v-model="formState.account" :items="accountsOptions" class="w-full" />
            </UFormField>
            <UFormField required>
              <USelect v-model="formState.type" :items="typeOptions" class="w-full" />
            </UFormField>
          </div>
          <UFormField class="mt-4" required>
            <UTabs v-model="formState.frequency" :items="frequencyOptions" class="w-full" />
          </UFormField>
          <div class="flex flex-col md:flex-row justify-between md:items-center">
            <UFormField class="mt-2 mb-4">
              <UInputDate v-if="isRangeMode" ref="inputDate" v-model="rangeDate" range>
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
                      <UCalendar v-model="rangeDate" class="p-2" :number-of-months="2" range />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <UInputDate v-else ref="inputDate" v-model="singleDate">
                <template #trailing>
                  <UPopover :reference="inputDate?.inputsRef[0]?.$el">
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-calendar"
                      aria-label="Select a date"
                      class="px-0"
                    />
  
                    <template #content>
                      <UCalendar v-model="singleDate" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>
            <UFormField class="mt-2 mb-4">
              <USwitch
                v-model="isRangeMode"
                unchecked-icon="i-lucide-x"
                checked-icon="i-lucide-check"
                label="Date de fin"
              />
            </UFormField>
          </div>
          <UButton label="Ajouter" color="primary" />
        </UForm>
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
  amount: number | null
  account: string
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly',
  startDate: CalendarDate,
  endDate: CalendarDate
  type: 'income' | 'expense'
}

const inputDate = useTemplateRef('inputDate')
const isRangeMode = ref(true)

const singleDate = shallowRef(
  new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
)
const rangeDate = shallowRef({
  start: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
  end: new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
})

const { doRequest: getAccounts } = useReadFireDoc()

const accounts = ref<DocumentData[]>([])

const accountsOptions = computed<{ label: string; value: string }[]>(() => {
  if (!accounts.value.length) return [
    {
      label: 'Aucun compte',
      value: '',
    }
  ]
  return accounts.value.map((account) => {
    return {
      label: account.accountName,
      value: account.id,
    }
  })
})

const frequencyOptions = ref<TabsItem[]>([
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

const typeOptions = ref<SelectItem[]>([
  {
    label: 'Revenu',
    value: 'income',
  },
  {
    label: 'Dépense',
    value: 'expense',
  }
])

const formState = ref<FormState>({
  name: '',
  amount: null,
  account: '',
  frequency: 'once',
  startDate: rangeDate.value.start,
  endDate: rangeDate.value.end,
  type: 'expense'
})

watch(rangeDate, (newValue) => {
  formState.value.startDate = newValue.start
  formState.value.endDate = newValue.end
}, { deep: true })

watch(singleDate, (newValue) => {
  formState.value.startDate = newValue
  formState.value.endDate = newValue
})

onMounted(async () => {
  const result = await getAccounts({ collectionName: 'accounts' })
  if (result && Array.isArray(result)) {
    accounts.value = result
  }
  formState.value.account = accountsOptions.value[0]?.value as string
})

</script>
