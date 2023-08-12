<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UpdatePassword from '@/components/UpdatePassword.vue'
const store = useStore()

const visible = computed(() => store.state.passwordResetIsVisible)
</script>

<template lang="pug">
dialog.narrow.reset-password(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  UpdatePassword
</template>

<style lang="stylus">
dialog.reset-password
  top calc(100% - 8px)
  left initial
  right 8px
</style>
