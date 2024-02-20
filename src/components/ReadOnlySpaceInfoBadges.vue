<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const spacePrivacyIsOpen = computed(() => store.state.currentSpace.privacy === 'open')
const showInExplore = computed(() => store.state.currentSpace.showInExplore)
</script>

<template lang="pug">
.row.align-items-top.read-only-space-info-badges(v-if="!isSpaceMember")
  .badge.info(v-if="!spacePrivacyIsOpen")
    span Read Only
  .badge.success(v-if="spacePrivacyIsOpen")
    span Open to All
  .badge.status(v-if="showInExplore")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span In Explore
</template>

<style lang="stylus">
.read-only-space-info-badges
  align-items flex-start
  .sunglasses
    margin-left 1px
</style>
