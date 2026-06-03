<template>
  <UModal v-model:open="open" :title="isEdit ? 'Modifier la règle de flux' : 'Nouvelle règle de flux'">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-highlighted">
              {{ isEdit ? 'Modifier la règle de flux' : 'Nouvelle règle de flux' }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="open = false" />
          </div>
        </template>

        <UForm :state="formState" class="space-y-4" @submit="handleSubmit">
          <UFormField label="Nom de la règle" required>
            <UInput v-model="formState.name" placeholder="Ex: Ravitaillement Courses, Top-up Bybit..." />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UFormField label="Compte Source" required>
              <USelect 
                v-model="formState.sourceAccountId" 
                :items="accountOptions" 
                class="w-full" 
                placeholder="Sélectionner..."
              />
            </UFormField>

            <UFormField label="Transit (Optionnel)">
              <USelect 
                v-model="formState.transitAccountId" 
                :items="transitAccountOptions" 
                class="w-full" 
              />
            </UFormField>

            <UFormField label="Destination" required>
              <USelect 
                v-model="formState.destAccountId" 
                :items="accountOptions" 
                class="w-full" 
                placeholder="Sélectionner..."
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Type de Montant" required>
              <USelect 
                v-model="formState.amountType" 
                :items="amountTypeOptions" 
                class="w-full" 
              />
            </UFormField>

            <UFormField v-if="formState.amountType === 'fixed'" label="Montant (€)" required>
              <UInput 
                v-model="formState.amount" 
                type="number" 
                step="0.01" 
                icon="i-lucide-euro" 
                placeholder="0.00" 
              />
            </UFormField>
          </div>

          <div v-if="formState.amountType === 'recurring'" class="space-y-3 border border-default p-4 rounded-lg bg-surface/50 max-h-60 overflow-y-auto">
            <div class="text-xs font-bold text-muted font-mono uppercase tracking-wider mb-2">
              Associer des transactions récurrentes
            </div>
            <div v-if="synthesisStore.recurringTransactions.length === 0" class="text-xs text-muted font-mono py-2">
              Aucune transaction récurrente configurée.
            </div>
            <div v-else class="space-y-2">
              <div 
                v-for="tx in synthesisStore.recurringTransactions" 
                :key="tx.id" 
                class="flex items-center justify-between gap-4 p-2 rounded-md hover:bg-default/10 transition"
              >
                <div class="flex items-center gap-2 flex-1">
                  <UCheckbox 
                    :model-value="isTxSelected(tx.id)" 
                    style="accent-color: #00A36C;"
                    @change="(val) => toggleTxSelection(tx.id, !!val)" 
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-highlighted">{{ tx.name }}</span>
                    <span class="text-[10px] text-muted font-mono capitalize">
                      {{ tx.amount }} € - {{ tx.frequency === 'monthly' ? 'Mensuel' : tx.frequency === 'yearly' ? 'Annuel' : tx.frequency === 'quarterly' ? 'Trimestriel' : 'Unique' }}
                    </span>
                  </div>
                </div>
                <div v-if="isTxSelected(tx.id)" class="flex items-center gap-1 w-24">
                  <UInput 
                    :model-value="getTxPercentage(tx.id)" 
                    type="number" 
                    min="1" 
                    max="100" 
                    class="font-mono text-xs w-16" 
                    placeholder="100"
                    @update:model-value="(val) => updateTxPercentage(tx.id, Number(val))" 
                  />
                  <span class="text-xs text-muted font-mono">%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" />
            <UButton type="submit" :label="isEdit ? 'Enregistrer' : 'Créer'" color="primary" :loading="isLoading" />
          </div>
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { useCreateFireDoc } from '@/composables/firebase/useCreateFireDoc'
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc'
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { useSynthesisStore } from '@/stores/synthesisStore'
import type { DocumentData } from 'firebase/firestore'

const props = defineProps<{
  rule?: DocumentData | null
}>()

const emit = defineEmits(['saved'])

const open = ref(false)
const isEdit = ref(false)
const isLoading = ref(false)

const { doRequest: createDoc } = useCreateFireDoc()
const { doRequest: updateDoc } = useUpdateFireDoc()
const { doRequest: getAccounts } = useReadFireDoc()
const synthesisStore = useSynthesisStore()

const accounts = ref<DocumentData[]>([])

const formState = reactive({
  name: '',
  sourceAccountId: '',
  transitAccountId: 'none',
  destAccountId: '',
  amountType: 'fixed' as 'fixed' | 'remaining' | 'recurring',
  amount: null as number | null,
  recurringTransactions: [] as Array<{ id: string; percentage: number }>
})

const accountOptions = computed(() => {
  return accounts.value.map(acc => ({
    label: acc.accountName,
    value: acc.id
  }))
})

const transitAccountOptions = computed(() => {
  return [
    { label: 'Aucun (virement direct)', value: 'none' },
    ...accountOptions.value
  ]
})

const amountTypeOptions = [
  { label: 'Montant fixe', value: 'fixed' },
  { label: 'Reste disponible', value: 'remaining' },
  { label: 'Montant récurrent', value: 'recurring' }
]

const isTxSelected = (id: string) => {
  return formState.recurringTransactions.some(item => item.id === id)
}

const toggleTxSelection = (id: string, checked: boolean) => {
  if (checked) {
    if (!formState.recurringTransactions.some(item => item.id === id)) {
      formState.recurringTransactions.push({ id, percentage: 100 })
    }
  } else {
    formState.recurringTransactions = formState.recurringTransactions.filter(item => item.id !== id)
  }
}

const getTxPercentage = (id: string) => {
  const found = formState.recurringTransactions.find(item => item.id === id)
  return found ? found.percentage : 100
}

const updateTxPercentage = (id: string, percentage: number) => {
  const found = formState.recurringTransactions.find(item => item.id === id)
  if (found) {
    found.percentage = Math.max(1, Math.min(100, percentage || 100))
  }
}

const openModal = async () => {
  await fetchAccounts()
  await synthesisStore.getRecurringTransactions()
  if (props.rule) {
    isEdit.value = true
    formState.name = props.rule.name
    formState.sourceAccountId = props.rule.sourceAccountId
    formState.transitAccountId = props.rule.transitAccountId || 'none'
    formState.destAccountId = props.rule.destAccountId
    formState.amountType = props.rule.amountType
    formState.amount = props.rule.amount ?? null
    formState.recurringTransactions = props.rule.recurringTransactions ? JSON.parse(JSON.stringify(props.rule.recurringTransactions)) : []
  } else {
    isEdit.value = false
    formState.name = ''
    formState.sourceAccountId = accountOptions.value[0]?.value || ''
    formState.transitAccountId = 'none'
    formState.destAccountId = ''
    formState.amountType = 'fixed'
    formState.amount = null
    formState.recurringTransactions = []
  }
  open.value = true
}

const fetchAccounts = async () => {
  const result = await getAccounts({ collectionName: 'accounts' })
  if (result && Array.isArray(result)) {
    accounts.value = result
  }
}

const handleSubmit = async () => {
  if (!formState.name || !formState.sourceAccountId || !formState.destAccountId) return
  if (formState.amountType === 'fixed' && (formState.amount === null || formState.amount <= 0)) return
  if (formState.amountType === 'recurring' && formState.recurringTransactions.length === 0) return

  isLoading.value = true
  try {
    const data = {
      name: formState.name,
      sourceAccountId: formState.sourceAccountId,
      transitAccountId: formState.transitAccountId === 'none' ? null : formState.transitAccountId,
      destAccountId: formState.destAccountId,
      amountType: formState.amountType,
      amount: formState.amountType === 'fixed' ? Number(formState.amount) : null,
      recurringTransactions: formState.amountType === 'recurring' ? formState.recurringTransactions : null,
      order: props.rule?.order || Date.now()
    }

    if (isEdit.value && props.rule) {
      await updateDoc({
        collectionName: 'transferRules',
        documentId: props.rule.id,
        data
      })
    } else {
      await createDoc({
        collectionName: 'transferRules',
        data
      })
    }
    emit('saved')
    open.value = false
  } catch (error) {
    console.error('Error saving transfer rule:', error)
  } finally {
    isLoading.value = false
  }
}

defineExpose({ openModal })

watch(() => props.rule, (val) => {
  if (val) {
    isEdit.value = true
    formState.name = val.name
    formState.sourceAccountId = val.sourceAccountId
    formState.transitAccountId = val.transitAccountId || 'none'
    formState.destAccountId = val.destAccountId
    formState.amountType = val.amountType
    formState.amount = val.amount ?? null
    formState.recurringTransactions = val.recurringTransactions ? JSON.parse(JSON.stringify(val.recurringTransactions)) : []
  }
}, { immediate: true })

onMounted(async () => {
  await fetchAccounts()
  await synthesisStore.getRecurringTransactions()
})
</script>
