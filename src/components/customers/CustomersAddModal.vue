<template>
  <UModal
    v-model:open="open"
    :title="$t('CustomersAddModal.title')"
    :description="$t('CustomersAddModal.description')"
  >
    <UButton
      :label="$t('CustomersAddModal.button')"
      icon="i-lucide-plus"
    />

    <template
      #body
    >
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField :label="$t('CustomersAddModal.name')" name="name">
          <UInput
            v-model="state.name"
            :placeholder="$t('CustomersAddModal.placeholderName')"
            class="w-full"
          />
        </UFormField>
        <UFormField :label="$t('CustomersAddModal.email')" name="email">
          <UInput
            v-model="state.email"
            :placeholder="$t('CustomersAddModal.placeholderEmail')"
            class="w-full"
          />
        </UFormField>
        <div
          class="flex justify-end gap-2"
        >
          <UButton :label="$t('CustomersAddModal.cancel')" color="neutral" variant="subtle" @click="open = false" />
          <UButton :label="$t('CustomersAddModal.create')" type="submit" color="primary" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email')
})
const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: undefined,
  email: undefined
})

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({ title: 'Success', description: `New customer ${event.data.name} added`, color: 'success' })
  open.value = false
}
</script>
