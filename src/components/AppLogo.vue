<template>
  <div
    v-if="!collapsed"
    class="text-2xl font-bold w-full"
  >
    {{ $t('AppLogo.logo') }}
  </div>
  <div
    v-else
    class="text-2xl font-bold text-center w-full"
  >
    {{ $t('AppLogo.logoCollapsed') }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>
