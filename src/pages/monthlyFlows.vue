<template>
  <UDashboardPanel id="monthly-flows">
    <template #header>
      <UDashboardNavbar title="Planificateur de flux" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton 
              label="Gérer les règles" 
              icon="i-lucide-settings-2" 
              variant="subtle" 
              @click="handleManageRules" 
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 overflow-auto h-full min-h-0 font-sans">
        
        <!-- Top bar: Date Selector & Income Entry -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <UCard class="lg:col-span-1 border border-default bg-elevated/40">
            <div class="space-y-4">
              <div class="text-xs font-bold text-muted font-mono uppercase tracking-widest">
                Période de planification
              </div>
              <div class="flex items-center gap-2">
                <UButton 
                  icon="i-lucide-chevron-left" 
                  variant="ghost" 
                  color="neutral" 
                  @click="changeMonth(-1)" 
                />
                <div class="flex-1 text-center font-semibold text-highlighted capitalize font-mono text-sm">
                  {{ currentMonthLabel }}
                </div>
                <UButton 
                  icon="i-lucide-chevron-right" 
                  variant="ghost" 
                  color="neutral" 
                  @click="changeMonth(1)" 
                />
              </div>
            </div>
          </UCard>

          <UCard class="lg:col-span-2 border border-default bg-elevated/40">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div class="flex-1 space-y-2">
                <label class="text-xs font-bold text-muted font-mono uppercase tracking-widest">
                  Salaire / Revenus reçus ce mois (€)
                </label>
                <div class="flex gap-2">
                  <UInput 
                    v-model="monthlyIncome" 
                    type="number" 
                    step="0.01" 
                    icon="i-lucide-euro" 
                    placeholder="Ex: 2500.00" 
                    class="flex-1 font-mono font-bold" 
                  />
                  <UButton 
                    label="Générer / Calculer" 
                    color="primary" 
                    icon="i-lucide-play" 
                    :loading="isCalculating"
                    @click="generateChecklist" 
                  />
                </div>
              </div>

              <!-- General Progress -->
              <div v-if="currentChecklist" class="w-full md:w-48 space-y-2">
                <div class="flex justify-between text-xs font-mono">
                  <span class="text-muted">Progression</span>
                  <span class="text-highlighted font-bold">{{ progressPercentage }}%</span>
                </div>
                <div class="w-full h-2 bg-default/30 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500" 
                    style="background-color: #00A36C;" 
                    :style="{ width: progressPercentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Visual Flow Model -->
        <VisualFlowModel 
          v-if="currentChecklist && currentChecklist.steps" 
          :rules="rules" 
          :steps="currentChecklist.steps" 
        />

        <!-- Two Columns: Rules Listing & Active Checklist -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Column 1: Rules List -->
          <div class="lg:col-span-1 space-y-4">
            <div class="flex items-center justify-between border-b border-default pb-2">
              <h3 class="text-sm font-semibold text-highlighted uppercase font-mono tracking-wider">
                Règles enregistrées ({{ rules.length }})
              </h3>
            </div>

            <div v-if="rules.length === 0" class="text-center py-8 text-muted font-mono text-xs border border-dashed border-default rounded-lg">
              Aucune règle configurée.
            </div>

            <div v-else class="space-y-3">
              <div 
                v-for="rule in rules" 
                :key="rule.id" 
                class="p-4 border border-default rounded-lg bg-surface/50 shadow-sm flex flex-col gap-2 hover:border-default/80 transition"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-highlighted font-mono text-xs uppercase">{{ rule.name }}</span>
                  <div class="flex items-center gap-1">
                    <UButton 
                      icon="i-lucide-pencil" 
                      variant="ghost" 
                      color="neutral" 
                      size="xs" 
                      @click="handleEditRule(rule)" 
                    />
                    <UButton 
                      icon="i-lucide-trash" 
                      variant="ghost" 
                      color="error" 
                      size="xs" 
                      @click="handleDeleteRule(rule.id)" 
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 text-xs font-mono text-muted">
                  <div>
                    <span class="block text-[10px] uppercase text-muted/60">Source</span>
                    <span class="text-highlighted font-semibold">{{ getAccountName(rule.sourceAccountId) }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] uppercase text-muted/60">Destination</span>
                    <span class="text-highlighted font-semibold">{{ getAccountName(rule.destAccountId) }}</span>
                  </div>
                  <div v-if="rule.transitAccountId">
                    <span class="block text-[10px] uppercase text-muted/60">Transit</span>
                    <span class="text-highlighted font-semibold">{{ getAccountName(rule.transitAccountId) }}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] uppercase text-muted/60">Montant</span>
                    <span class="text-highlighted font-semibold">
                      {{ rule.amountType === 'fixed' ? `${rule.amount} €` : (rule.amountType === 'recurring' ? getRecurringRuleAmountLabel(rule) : 'Reliquat') }}
                    </span>
                  </div>
                </div>

                <div v-if="rule.amountType === 'recurring'" class="text-[10px] text-muted font-mono mt-1 bg-default/10 p-1.5 rounded">
                  Inclus : {{ getRecurringRuleDetailsLabel(rule) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Active Checklist steps -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between border-b border-default pb-2">
              <h3 class="text-sm font-semibold text-highlighted uppercase font-mono tracking-wider">
                Plan d'action & Checklist - {{ currentMonthLabel }}
              </h3>
            </div>

            <div v-if="!currentChecklist" class="text-center py-12 text-muted font-mono text-xs border border-dashed border-default rounded-lg">
              Saisissez un salaire/revenu ci-dessus et cliquez sur "Générer / Calculer" pour obtenir votre plan.
            </div>

            <div v-else class="space-y-6">
              
              <!-- Category 1: Global Main Transfers (Funding Transit Accounts) -->
              <div v-if="groupedSteps.transits.length > 0" class="space-y-3">
                <div class="text-[11px] font-bold text-muted font-mono uppercase tracking-widest border-l-2 border-default pl-2">
                  Étape 1 : Ravitaillement des comptes de transit
                </div>
                <div class="space-y-3">
                  <div 
                    v-for="step in groupedSteps.transits" 
                    :key="step.id"
                    class="p-4 border rounded-lg bg-surface shadow-sm transition duration-300"
                    :class="step.completed ? 'border-dashed border-muted/30 opacity-60 bg-muted/5' : 'border-default'"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-3">
                        <UCheckbox 
                          v-model="step.completed" 
                          class="mt-1" 
                          style="accent-color: #00A36C;"
                          @change="saveStepState(step)" 
                        />
                        <div>
                          <div class="font-bold text-sm" :class="{ 'line-through text-muted': step.completed }">
                            Faire un virement global de {{ formatMoney(step.amount) }}
                          </div>
                          <div class="text-xs text-muted font-mono mt-1">
                            Depuis <strong class="text-highlighted uppercase">{{ step.sourceName }}</strong> vers <strong class="text-highlighted uppercase">{{ step.transitName }}</strong>
                          </div>
                          <div class="text-[10px] text-muted/80 font-mono mt-2 bg-default/20 p-2 rounded">
                            Regroupe les dispatchs suivants : {{ step.aggregatedRuleNames.join(', ') }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Category 2: Dispatches from Transit Accounts -->
              <div v-if="groupedSteps.dispatches.length > 0" class="space-y-3">
                <div class="text-[11px] font-bold text-muted font-mono uppercase tracking-widest border-l-2 border-default pl-2">
                  Étape 2 : Répartition depuis les comptes de transit
                </div>
                <div class="space-y-3">
                  <div 
                    v-for="step in groupedSteps.dispatches" 
                    :key="step.id"
                    class="p-4 border rounded-lg bg-surface shadow-sm transition duration-300"
                    :class="step.completed ? 'border-dashed border-muted/30 opacity-60 bg-muted/5' : 'border-default'"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-3">
                        <UCheckbox 
                          v-model="step.completed" 
                          class="mt-1" 
                          style="accent-color: #00A36C;"
                          @change="saveStepState(step)" 
                        />
                        <div>
                          <div class="font-bold text-sm" :class="{ 'line-through text-muted': step.completed }">
                            Transférer un total de {{ formatMoney(step.amount) }} vers {{ step.destName }}
                          </div>
                          <div class="text-xs text-muted font-mono mt-1">
                            Depuis <strong class="text-highlighted uppercase">{{ step.transitName }}</strong> vers <strong class="text-highlighted uppercase">{{ step.destName }}</strong>
                          </div>
                          <div class="text-[10px] text-muted/80 font-mono mt-2 bg-default/20 p-2 rounded">
                            Détails : {{ step.subSteps.map(s => `${s.name} (${formatMoney(s.amount)})`).join(', ') }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Category 3: Direct Transfers -->
              <div v-if="groupedSteps.directs.length > 0" class="space-y-3">
                <div class="text-[11px] font-bold text-muted font-mono uppercase tracking-widest border-l-2 border-default pl-2">
                  Étape 3 : Virements directs & prélèvements fixes
                </div>
                <div class="space-y-3">
                  <div 
                    v-for="step in groupedSteps.directs" 
                    :key="step.id"
                    class="p-4 border rounded-lg bg-surface shadow-sm transition duration-300"
                    :class="step.completed ? 'border-dashed border-muted/30 opacity-60 bg-muted/5' : 'border-default'"
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex items-start gap-3">
                        <UCheckbox 
                          v-model="step.completed" 
                          class="mt-1" 
                          style="accent-color: #00A36C;"
                          @change="saveStepState(step)" 
                        />
                        <div>
                          <div class="font-bold text-sm" :class="{ 'line-through text-muted': step.completed }">
                            Virer un total de {{ formatMoney(step.amount) }} vers {{ step.destName }}
                          </div>
                          <div class="text-xs text-muted font-mono mt-1">
                            Depuis <strong class="text-highlighted uppercase">{{ step.sourceName }}</strong> directement vers <strong class="text-highlighted uppercase">{{ step.destName }}</strong>
                          </div>
                          <div v-if="step.subSteps.length > 1" class="text-[10px] text-muted/80 font-mono mt-2 bg-default/20 p-2 rounded">
                            Détails : {{ step.subSteps.map(s => `${s.name} (${formatMoney(s.amount)})`).join(', ') }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <TransferRulesModal 
        ref="rulesModal" 
        :rule="selectedRule" 
        @saved="refreshRulesAndChecklist" 
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format, addMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useReadFireDoc } from '@/composables/firebase/useReadFireDoc'
import { useCreateFireDoc } from '@/composables/firebase/useCreateFireDoc'
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc'
import { useDeleteFireDoc } from '@/composables/firebase/useDeleteFireDoc'
import { formatMoney } from '@/helpers/moneyHelpers'
import type { DocumentData } from 'firebase/firestore'
import TransferRulesModal from '@/components/flows/TransferRulesModal.vue'
import VisualFlowModel from '@/components/flows/VisualFlowModel.vue'
import { useSynthesisStore } from '@/stores/synthesisStore'

const currentMonthDate = ref(new Date())
const monthlyIncome = ref<number | null>(null)
const isCalculating = ref(false)

const rules = ref<DocumentData[]>([])
const accounts = ref<DocumentData[]>([])
const currentChecklist = ref<any>(null)

const selectedRule = ref<DocumentData | null>(null)
const rulesModal = ref<InstanceType<typeof TransferRulesModal> | null>(null)

const { doRequest: getRules } = useReadFireDoc()
const { doRequest: getAccounts } = useReadFireDoc()
const { doRequest: getChecklists } = useReadFireDoc()
const { doRequest: createChecklist } = useCreateFireDoc()
const { doRequest: updateChecklist } = useUpdateFireDoc()
const { doRequest: deleteRule } = useDeleteFireDoc()
const synthesisStore = useSynthesisStore()

const currentMonthLabel = computed(() => {
  return format(currentMonthDate.value, 'MMMM yyyy', { locale: fr })
})

const currentMonthKey = computed(() => {
  return format(currentMonthDate.value, 'yyyy-MM')
})

const progressPercentage = computed(() => {
  if (!currentChecklist.value || !currentChecklist.value.steps || currentChecklist.value.steps.length === 0) return 0
  
  // Custom checklist progression counting both aggregate steps and dispatches/directs
  let totalStepsCount = 0
  let completedStepsCount = 0

  if (groupedSteps.value.transits.length > 0) {
    groupedSteps.value.transits.forEach((s: any) => {
      totalStepsCount++
      if (s.completed) completedStepsCount++
    })
  }
  if (groupedSteps.value.dispatches.length > 0) {
    groupedSteps.value.dispatches.forEach((s: any) => {
      totalStepsCount++
      if (s.completed) completedStepsCount++
    })
  }
  if (groupedSteps.value.directs.length > 0) {
    groupedSteps.value.directs.forEach((s: any) => {
      totalStepsCount++
      if (s.completed) completedStepsCount++
    })
  }

  return Math.round((completedStepsCount / totalStepsCount) * 100)
})

const getAccountName = (id: string) => {
  const acc = accounts.value.find(a => a.id === id)
  return acc ? acc.accountName : id
}

const fetchAccountsAndRules = async () => {
  const accountList = await getAccounts({ collectionName: 'accounts' })
  if (accountList && Array.isArray(accountList)) {
    accounts.value = accountList
  }

  const ruleList = await getRules({ collectionName: 'transferRules' })
  if (ruleList && Array.isArray(ruleList)) {
    rules.value = ruleList.sort((a, b) => a.order - b.order)
  }
}

const fetchChecklist = async () => {
  const result = await getChecklists({
    collectionName: 'monthlyChecklists',
    queryConstraints: [] // Automatically filtered by userId
  })
  
  if (result && Array.isArray(result)) {
    const matching = result.find(c => c.month === currentMonthKey.value)
    if (matching) {
      currentChecklist.value = matching
      monthlyIncome.value = matching.salary
    } else {
      currentChecklist.value = null
      monthlyIncome.value = null
    }
  }
}

const refreshRulesAndChecklist = async () => {
  await fetchAccountsAndRules()
  await fetchChecklist()
  await synthesisStore.getRecurringTransactions()
  if (currentChecklist.value) {
    await generateChecklist(true)
  }
}

const changeMonth = async (amount: number) => {
  currentMonthDate.value = addMonths(currentMonthDate.value, amount)
  await fetchChecklist()
}

const handleManageRules = () => {
  selectedRule.value = null
  rulesModal.value?.openModal()
}

const handleEditRule = (rule: DocumentData) => {
  selectedRule.value = rule
  rulesModal.value?.openModal()
}

const handleDeleteRule = async (id: string) => {
  if (confirm('Supprimer cette règle ?')) {
    await deleteRule({
      collectionName: 'transferRules',
      documentId: id
    })
    await fetchAccountsAndRules()
    if (currentChecklist.value) {
      await generateChecklist(true)
    }
  }
}

const getIterationOrBaseAmount = (tx: any, monthDate: Date): number => {
  if (tx.iterations && Array.isArray(tx.iterations)) {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    
    const matchingIt = tx.iterations.find((it: any) => {
      if (!it.date) return false
      const itDate = it.date.toDate ? it.date.toDate() : new Date(it.date)
      return isWithinInterval(itDate, { start: monthStart, end: monthEnd }) && it.active !== false
    })
    
    if (matchingIt) {
      return Number(matchingIt.amount ?? tx.amount)
    }
  }
  return Number(tx.amount || 0)
}

const getRecurringRuleAmount = (rule: any, monthDate: Date): number => {
  if (!rule.recurringTransactions || !Array.isArray(rule.recurringTransactions)) return 0
  
  let total = 0
  rule.recurringTransactions.forEach((linkedTx: any) => {
    const tx = synthesisStore.recurringTransactions.find(t => t.id === linkedTx.id)
    if (tx) {
      const amount = getIterationOrBaseAmount(tx, monthDate)
      total += amount * ((linkedTx.percentage || 100) / 100)
    }
  })
  return total
}

const getRecurringRuleAmountLabel = (rule: any) => {
  const amt = getRecurringRuleAmount(rule, currentMonthDate.value)
  return `${amt.toFixed(2)} €`
}

const getRecurringRuleDetailsLabel = (rule: any) => {
  if (!rule.recurringTransactions || !Array.isArray(rule.recurringTransactions)) return 'Aucune transaction'
  
  const parts = rule.recurringTransactions.map((linkedTx: any) => {
    const tx = synthesisStore.recurringTransactions.find(t => t.id === linkedTx.id)
    if (!tx) return `Inconnu (${linkedTx.percentage}%)`
    return `${tx.name} (${linkedTx.percentage}%)`
  })
  
  return parts.join(', ')
}

// Algorithm to generate steps based on transfer rules and monthly income input
const generateChecklist = async (preserveCompleted = false) => {
  if (!monthlyIncome.value || monthlyIncome.value <= 0) return
  isCalculating.value = true

  try {
    const salary = Number(monthlyIncome.value)
    const steps: any[] = []

    // Capture old completed states if we want to preserve them
    const completedRuleIds = new Set<string>()
    if (preserveCompleted && currentChecklist.value && currentChecklist.value.steps) {
      currentChecklist.value.steps.forEach((s: any) => {
        if (s.completed && s.ruleId) {
          completedRuleIds.add(s.ruleId)
        }
      })
    }

    // 1. Calculate rule values
    let remainingSalaries = new Map<string, number>()
    
    // Sort rules to compute fixed/recurring ones first, then remaining ones
    const sortedRules = [...rules.value].sort((a, b) => {
      if (a.amountType === 'remaining') return 1
      if (b.amountType === 'remaining') return -1
      return 0
    })

    sortedRules.forEach(rule => {
      const sourceName = getAccountName(rule.sourceAccountId)
      
      // Initialize balance of source account with the incoming salary if it's the main account
      if (!remainingSalaries.has(sourceName)) {
        remainingSalaries.set(sourceName, salary)
      }

      let amount = 0
      if (rule.amountType === 'fixed') {
        amount = Number(rule.amount || 0)
        const currentBalance = remainingSalaries.get(sourceName) || 0
        remainingSalaries.set(sourceName, currentBalance - amount)
      } else if (rule.amountType === 'recurring') {
        amount = getRecurringRuleAmount(rule, currentMonthDate.value)
        const currentBalance = remainingSalaries.get(sourceName) || 0
        remainingSalaries.set(sourceName, currentBalance - amount)
      } else {
        // Remaining
        amount = Math.max(0, remainingSalaries.get(sourceName) || 0)
        remainingSalaries.set(sourceName, 0)
      }

      steps.push({
        ruleId: rule.id,
        name: rule.name,
        sourceName,
        sourceAccountId: rule.sourceAccountId,
        transitName: rule.transitAccountId ? getAccountName(rule.transitAccountId) : null,
        transitAccountId: rule.transitAccountId || null,
        destName: getAccountName(rule.destAccountId),
        destAccountId: rule.destAccountId,
        amount,
        completed: preserveCompleted ? completedRuleIds.has(rule.id) : false,
        amountType: rule.amountType
      })
    })

    if (currentChecklist.value) {
      // Update existing checklist
      await updateChecklist({
        collectionName: 'monthlyChecklists',
        documentId: currentChecklist.value.id,
        data: {
          salary,
          steps
        }
      })
    } else {
      // Create new checklist
      await createChecklist({
        collectionName: 'monthlyChecklists',
        data: {
          month: currentMonthKey.value,
          salary,
          steps
        }
      })
    }

    await fetchChecklist()
  } catch (error) {
    console.error('Error generating checklist:', error)
  } finally {
    isCalculating.value = false
  }
}

const saveStepState = async (step: any) => {
  if (!currentChecklist.value) return
  
  try {
    // If it's a grouped transit step, update all sub-steps (including direct transfers to the transit account)
    if (step.id && step.id.startsWith('grouped-transit-')) {
      currentChecklist.value.steps.forEach((s: any) => {
        if (s.sourceName === step.sourceName && (s.transitName === step.transitName || (!s.transitName && s.destName === step.transitName))) {
          s.completed = step.completed
        }
      })
    }
    // If it's a grouped dispatch step, update all sub-steps
    else if (step.id && step.id.startsWith('grouped-dispatch-')) {
      currentChecklist.value.steps.forEach((s: any) => {
        if (s.transitName === step.transitName && s.destName === step.destName) {
          s.completed = step.completed
        }
      })
    }
    // If it's a grouped direct step, update all sub-steps
    else if (step.id && step.id.startsWith('grouped-direct-')) {
      currentChecklist.value.steps.forEach((s: any) => {
        if (s.sourceName === step.sourceName && s.destName === step.destName) {
          s.completed = step.completed
        }
      })
    }

    await updateChecklist({
      collectionName: 'monthlyChecklists',
      documentId: currentChecklist.value.id,
      data: {
        steps: currentChecklist.value.steps
      },
      showToast: false
    })
  } catch (error) {
    console.error('Error saving step state:', error)
  }
}

// Computed structure for hierarchical grouped layout
const groupedSteps = computed(() => {
  if (!currentChecklist.value || !currentChecklist.value.steps) {
    return { transits: [], dispatches: [], directs: [] }
  }

  // 1. Identify which accounts are transit accounts
  const transitAccounts = new Set<string>()
  currentChecklist.value.steps.forEach((step: any) => {
    if (step.transitName) {
      transitAccounts.add(step.transitName)
    }
  })

  const transitsMap = new Map<string, { id: string; sourceName: string; transitName: string; amount: number; completed: boolean; aggregatedRuleNames: string[] }>()
  const dispatchesMap = new Map<string, { id: string; transitName: string; destName: string; amount: number; completed: boolean; subSteps: { name: string; amount: number }[] }>()
  const directsMap = new Map<string, { id: string; sourceName: string; destName: string; amount: number; completed: boolean; subSteps: { name: string; amount: number }[] }>()

  currentChecklist.value.steps.forEach((step: any) => {
    // If this step transits, OR if it's a direct transfer to an account that acts as a transit account
    if (step.transitName || transitAccounts.has(step.destName)) {
      const transitName = step.transitName || step.destName
      const transitKey = `${step.sourceName}_to_${transitName}`

      // Aggregate into Étape 1 Ravitaillement
      if (transitsMap.has(transitKey)) {
        const item = transitsMap.get(transitKey)!
        item.amount += step.amount
        if (!item.aggregatedRuleNames.includes(step.name)) {
          item.aggregatedRuleNames.push(step.name)
        }
        if (!step.completed) {
          item.completed = false
        }
      } else {
        transitsMap.set(transitKey, {
          id: `grouped-transit-${transitKey}`,
          sourceName: step.sourceName,
          transitName: transitName,
          amount: step.amount,
          completed: step.completed,
          aggregatedRuleNames: [step.name]
        })
      }

      // If it is a cascading transfer (transitName exists), aggregate into Étape 2 Dispatch
      if (step.transitName) {
        const dispatchKey = `${step.transitName}_to_${step.destName}`
        if (dispatchesMap.has(dispatchKey)) {
          const item = dispatchesMap.get(dispatchKey)!
          item.amount += step.amount
          item.subSteps.push({ name: step.name, amount: step.amount })
          if (!step.completed) {
            item.completed = false
          }
        } else {
          dispatchesMap.set(dispatchKey, {
            id: `grouped-dispatch-${dispatchKey}`,
            transitName: step.transitName,
            destName: step.destName,
            amount: step.amount,
            completed: step.completed,
            subSteps: [{ name: step.name, amount: step.amount }]
          })
        }
      }
    } else {
      // 3. Direct Transfer to non-transit account (Étape 3)
      const directKey = `${step.sourceName}_to_${step.destName}`
      if (directsMap.has(directKey)) {
        const item = directsMap.get(directKey)!
        item.amount += step.amount
        item.subSteps.push({ name: step.name, amount: step.amount })
        if (!step.completed) {
          item.completed = false
        }
      } else {
        directsMap.set(directKey, {
          id: `grouped-direct-${directKey}`,
          sourceName: step.sourceName,
          destName: step.destName,
          amount: step.amount,
          completed: step.completed,
          subSteps: [{ name: step.name, amount: step.amount }]
        })
      }
    }
  })

  return {
    transits: Array.from(transitsMap.values()),
    dispatches: Array.from(dispatchesMap.values()),
    directs: Array.from(directsMap.values())
  }
})

onMounted(async () => {
  await fetchAccountsAndRules()
  await fetchChecklist()
  await synthesisStore.getRecurringTransactions()
})
</script>
