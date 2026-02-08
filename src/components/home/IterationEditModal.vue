<template>
    <UModal v-model:open="isOpen">
        <template #content>
            <UCard>
                <h2 class="text-2xl font-bold mb-4">{{ $t('IterationEditModal.title') }}</h2>
                <UForm :state="formState" @submit="handleSubmit">
                    <div class="grid grid-cols-1 gap-4">
                        <UFormField :label="$t('IterationEditModal.name')" name="name">
                            <UInput v-model="formState.name" class="w-full" />
                        </UFormField>

                        <UFormField :label="$t('IterationEditModal.amount')" name="amount">
                            <UInput v-model="formState.amount" type="number" step="0.01" class="w-full" />
                        </UFormField>

                        <UFormField :label="$t('IterationEditModal.type')" name="type">
                            <USelect v-model="formState.type" :items="typeOptions" class="w-full" />
                        </UFormField>

                        <UFormField :label="$t('IterationEditModal.date')" name="date">
                            <UInputDate v-model="dateValue" class="w-full">
                                <template #trailing>
                                    <UPopover>
                                        <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                            class="px-0" />
                                        <template #content>
                                            <UCalendar v-model="dateValue" class="p-2" />
                                        </template>
                                    </UPopover>
                                </template>
                            </UInputDate>
                        </UFormField>
                    </div>

                    <div class="flex justify-end mt-6 gap-2">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="isOpen = false" />
                        <UButton label="Enregistrer" type="submit" color="primary" :loading="isLoading" />
                    </div>
                </UForm>
            </UCard>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'
import { useUpdateIteration } from '@/composables/firebase/dedicated/useUpdateIteration'
import { useSynthesisStore } from '@/stores/synthesisStore'

interface IterationData {
    id?: string
    transactionId: string
    name: string
    date: Date
    amount: number
    type: string
}

const props = defineProps<{
    modelValue: boolean
    iteration: IterationData | null
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'saved'): void
}>()

const synthesisStore = useSynthesisStore()
const { doRequest: updateIteration, isLoading } = useUpdateIteration()

const isOpen = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
})

const typeOptions = [
    { label: 'Revenu', value: 'income' },
    { label: 'Dépense', value: 'expense' }
]

const formState = ref({
    name: '',
    amount: 0,
    type: 'expense' as 'income' | 'expense'
})

const dateValue = ref<CalendarDate | undefined>()

watch(() => props.iteration, (newVal) => {
    if (newVal) {
        formState.value = {
            name: newVal.name,
            amount: newVal.amount,
            type: newVal.type as 'income' | 'expense'
        }

        const d = new Date(newVal.date)
        dateValue.value = new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
    }
}, { immediate: true })

const handleSubmit = async () => {
    if (!props.iteration?.id || !props.iteration?.transactionId || !dateValue.value) return

    try {
        const jsDate = dateValue.value.toDate(getLocalTimeZone())

        await updateIteration({
            transactionId: props.iteration.transactionId,
            iterationId: props.iteration.id,
            data: {
                name: formState.value.name,
                amount: Number(formState.value.amount),
                type: formState.value.type,
                date: jsDate
            }
        })

        await synthesisStore.getRecurringTransactions()

        emit('saved')
        isOpen.value = false
    } catch (error) {
        console.error(error)
    }
}
</script>
