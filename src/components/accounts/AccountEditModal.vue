<template>
  <UModal v-model:open="open" :title="isEdit ? 'Modifier le compte' : 'Nouveau compte'">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ isEdit ? 'Modifier le compte' : 'Nouveau compte' }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="open = false" />
          </div>
        </template>

        <UForm :state="formState" class="space-y-4" @submit="handleSubmit">
          <UFormField label="Nom du compte" required>
            <UInput v-model="formState.accountName" placeholder="Ex: Compte Courant, Épargne..." />
          </UFormField>

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
import { ref, reactive, watch } from 'vue'
import { useCreateFireDoc } from '@/composables/firebase/useCreateFireDoc'
import { useUpdateFireDoc } from '@/composables/firebase/useUpdateFireDoc'
import type { DocumentData } from 'firebase/firestore'

const props = defineProps<{
  account?: DocumentData | null
}>()

const emit = defineEmits(['saved'])

const open = ref(false)
const isEdit = ref(false)
const isLoading = ref(false)

const { doRequest: createDoc } = useCreateFireDoc()
const { doRequest: updateDoc } = useUpdateFireDoc()

const formState = reactive({
  accountName: ''
})

const openModal = () => {
  if (props.account) {
    isEdit.value = true
    formState.accountName = props.account.accountName
  } else {
    isEdit.value = false
    formState.accountName = ''
  }
  open.value = true
}

const handleSubmit = async () => {
  if (!formState.accountName) return

  isLoading.value = true
  try {
    if (isEdit.value && props.account) {
      await updateDoc({
        collectionName: 'accounts',
        documentId: props.account.id,
        data: {
          accountName: formState.accountName
        }
      })
    } else {
      await createDoc({
        collectionName: 'accounts',
        data: {
          accountName: formState.accountName
        }
      })
    }
    emit('saved')
    open.value = false
  } catch (error) {
    console.error('Error saving account:', error)
  } finally {
    isLoading.value = false
  }
}

defineExpose({ openModal })

watch(() => props.account, (val) => {
  if (val) {
    isEdit.value = true
    formState.accountName = val.accountName
  }
})
</script>
