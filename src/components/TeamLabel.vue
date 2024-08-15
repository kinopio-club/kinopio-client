<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import OfflineBadge from '@/components/OfflineBadge.vue'

const store = useStore()

const props = defineProps({
  team: Object,
  showIcon: Boolean,
  showName: Boolean
})

const isVisible = computed(() => Boolean(props.team))
</script>

<template lang="pug">
span.team-label(v-if="isVisible")
  //- OfflineBadge
  .team-color(v-if="props.team.color" :style="{ background: props.team.color }" :title="props.team.name")
  img.icon.team(v-if="props.showIcon" src="@/assets/team.svg" :title="props.team.name")
  span.team-name(v-if="props.showName") {{ props.team.name }}

</template>

<style lang="stylus">
.team-label
  flex-shrink 0
  .loader
    margin 0
    margin-right 5px
  .icon.team
    margin 0
.team-label + span
  margin-left 5px
</style>
