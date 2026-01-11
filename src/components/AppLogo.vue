<template>
  <div v-if="!collapsed" class="text-2xl font-bold w-full">
    Aesura
  </div>
  <div v-else class="text-2xl font-bold text-center w-full">
    A
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>
