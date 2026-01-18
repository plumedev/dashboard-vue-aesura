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
          <UInputDate v-model="formState.date" placeholder="Date de la transaction" />
        </UFormField>

      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { reactive } from 'vue';


const formState = reactive({
  name: '',
  date: '',
})
</script>
