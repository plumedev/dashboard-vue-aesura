<template>
  <UModal v-model:open="open">
    <UButton v-if="!isEditMode" icon="i-lucide-plus" variant="solid" class="rounded-full" />

    <template #content>
      <UCard>
        <h2 class="text-2xl font-bold mb-4">
          {{ isEditMode ? 'Modifier la transaction' : 'Nouvelle transaction' }}
        </h2>
        <UForm>
          <UAlert v-if="!accounts.length" color="warning" variant="subtle" class="mb-4"
            :title="$t('NewTransactionPage.notReadyTitle')" icon="i-lucide-octagon-alert">
            <template #description>
              {{ $t('NewTransactionPage.noAccount') }} <br>
              Rendez-vous dans l'onglet 'Comptes' pour en créer un.
            </template>
          </UAlert>
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
                    <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                      aria-label="Select a date range" class="px-0" />

                    <template #content>
                      <UCalendar v-model="rangeDate" class="p-2" :number-of-months="2" range />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <UInputDate v-else ref="inputDate" v-model="singleDate">
                <template #trailing>
                  <UPopover :reference="inputDate?.inputsRef[0]?.$el">
                    <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                      aria-label="Select a date" class="px-0" />

                    <template #content>
                      <UCalendar v-model="singleDate" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>
            <UFormField class="mt-2 mb-4">
              <USwitch v-model="isRangeMode" unchecked-icon="i-lucide-x" checked-icon="i-lucide-check"
                label="Date de fin" />
            </UFormField>
          </div>
          <UButton :label="isEditMode ? 'Modifier' : 'Ajouter'" color="primary" @click="handleSubmit"
            :loading="isSubmitting" />
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc';
import { onMounted } from 'vue';
import { DocumentData, Timestamp } from 'firebase/firestore';
import type { SelectItem } from '@nuxt/ui';
import type { TabsItem } from '@nuxt/ui';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import { useCreateFireDoc } from '@/composables/firebase/useCreateFireDoc';
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc';
import { calendarDateToTimestamp, timestampToCalendarDate } from '@/helpers/dateHelpers';
import { useCreateIterations } from '@/composables/firebase/dedicated/useCreateIterations';

export interface TransactionData {
  id: string
  name: string
  amount: number
  type: 'income' | 'expense'
  account: { value: string; label: string }
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly'
  effectDate: Timestamp
  effectEndDate: Timestamp
}

const props = defineProps<{
  transaction?: TransactionData
}>()

const { doRequest: createTransaction, isLoading: isCreatingTransaction } = useCreateFireDoc()
const { doRequest: updateTransaction, isLoading: isUpdatingTransaction } = useUpdateFireDoc()
const { doRequest: createIterations } = useCreateIterations()

const isSubmitting = computed(() => isCreatingTransaction.value || isUpdatingTransaction.value)
const isEditMode = computed(() => !!props.transaction)

interface FormState {
  name: string
  amount: number | null
  account: string
  frequency: 'once' | 'monthly' | 'quarterly' | 'yearly',
  startDate: CalendarDate,
  endDate: CalendarDate
  type: 'income' | 'expense'
}

const emit = defineEmits(['transactionCreated', 'transactionUpdated'])

const open = ref(false)


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
  if (!accounts.value.length) {
    return [
      {
        label: 'Aucun compte',
        value: '',
      }
    ]
  }
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

const getDefaultFormState = (): FormState => ({
  name: '',
  amount: null,
  account: '',
  frequency: 'once',
  startDate: rangeDate.value.start,
  endDate: rangeDate.value.end,
  type: 'expense'
})

const formState = ref<FormState>(getDefaultFormState())


const initFormFromTransaction = (transaction: TransactionData) => {
  formState.value = {
    name: transaction.name,
    amount: transaction.amount,
    account: transaction.account.value,
    frequency: transaction.frequency,
    startDate: timestampToCalendarDate(transaction.effectDate),
    endDate: timestampToCalendarDate(transaction.effectEndDate),
    type: transaction.type
  }


  const startDate = timestampToCalendarDate(transaction.effectDate)
  const endDate = timestampToCalendarDate(transaction.effectEndDate)

  singleDate.value = startDate
  rangeDate.value = { start: startDate, end: endDate }

  isRangeMode.value = startDate.compare(endDate) !== 0
}


const handleSubmit = async () => {
  const selectedAccount = accounts.value.find(acc => acc.id === formState.value.account)

  const transactionData = {
    name: formState.value.name,
    amount: Number(formState.value.amount || 0),
    type: formState.value.type,
    account: {
      value: selectedAccount?.id || formState.value.account,
      label: selectedAccount?.accountName || ''
    },
    frequency: formState.value.frequency,
    effectDate: calendarDateToTimestamp(formState.value.startDate),
    effectEndDate: calendarDateToTimestamp(formState.value.endDate)
  }

  if (isEditMode.value && props.transaction) {
    await updateTransaction({
      collectionName: 'recurringTransactions',
      documentId: props.transaction.id,
      data: transactionData
    })
    emit('transactionUpdated')
  } else {
    const transactionId = await createTransaction({
      collectionName: 'recurringTransactions',
      data: transactionData
    })

    await createIterations({
      transactionId: transactionId,
      startDate: formState.value.startDate.toDate(getLocalTimeZone()),
      endDate: formState.value.endDate.toDate(getLocalTimeZone()),
      amount: Number(formState.value.amount || 0),
      name: formState.value.name,
      type: formState.value.type,
      frequency: formState.value.frequency
    })

    emit('transactionCreated')
  }
  open.value = false
}

const openModal = () => {
  if (props.transaction) {
    initFormFromTransaction(props.transaction)
  } else {
    formState.value = getDefaultFormState()
    formState.value.account = accountsOptions.value[0]?.value as string
  }
  open.value = true
}
defineExpose({ openModal })

watch(() => props.transaction, (newTransaction) => {
  if (newTransaction) {
    initFormFromTransaction(newTransaction)
  }
}, { immediate: true })

watch(rangeDate, (newValue) => {
  formState.value.startDate = newValue.start
  formState.value.endDate = newValue.end
}, { deep: true })

watch(singleDate, (newValue) => {
  formState.value.startDate = newValue
  formState.value.endDate = newValue
})

watch(() => formState.value.frequency, (newFrequency) => {
  const today = new Date()
  const start = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  let endDate = new Date(today)

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

onMounted(async () => {
  const result = await getAccounts({ collectionName: 'accounts' })
  if (result && Array.isArray(result)) {
    accounts.value = result
  }
  if (!isEditMode.value) {
    formState.value.account = accountsOptions.value[0]?.value as string
  }
})
</script>
