<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'

const store = useStore()

const props = defineProps({
  team: Object,
  showIcon: Boolean,
  showName: Boolean
})

const spaceIsLoading = computed(() => {
  return store.state.isLoadingSpace
})

</script>

<template lang="pug">
span.team-label
  OfflineBadge
  Loader(:visible="spaceIsLoading" :isSmall="true")
  .team-color(v-if="!spaceIsLoading" :style="{ background: props.team.color }" :title="props.team.name")
  img.icon.team(v-if="props.showIcon" src="@/assets/team.svg" :title="props.team.name")
  span.team-name(v-if="props.showName") {{ props.team.name }}

</template>

<style lang="stylus">
.team-label
  .loader
    margin 0
    margin-right 5px
</style>
