<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${count} customer${count > 1 ? 's' : ''}?`"
    :description="$t('CustomersDeleteModal.description')"
    :ui="{ description: 'text-neutral-500 dark:text-neutral-400' }"
  >
    <slot />

    <template
      #body
    >
      <div
        class="flex justify-end gap-2"
      >
        <UButton
          :label="$t('CustomersDeleteModal.cancel')"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          :label="$t('CustomersDeleteModal.delete')"
          color="error"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  count?: number
}>(), {
  count: 0
})

const open = ref(false)

async function onSubmit() {
  await new Promise(resolve => setTimeout(resolve, 1000))
  open.value = false
}
</script>

