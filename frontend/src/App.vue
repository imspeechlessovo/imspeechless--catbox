<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-violet-100">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
</script>
