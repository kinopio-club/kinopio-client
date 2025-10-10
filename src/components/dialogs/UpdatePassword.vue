<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import UpdatePassword from '@/components/UpdatePassword.vue'

const globalStore = useGlobalStore()

const visible = computed(() => globalStore.passwordResetIsVisible)
</script>

<template lang="pug">
dialog.narrow.reset-password(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section.title-section
    p Update Password
  UpdatePassword
</template>

<style lang="stylus">
dialog.reset-password
  top calc(100% - 8px)
  left initial
  right 8px
</style>
