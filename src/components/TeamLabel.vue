<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  team: Object,
  showIcon: Boolean,
  showName: Boolean
})
</script>

<template lang="pug">
.team-color(:style="{ background: props.team.color }" :title="props.team.name")
img.icon.team(v-if="props.showIcon" src="@/assets/team.svg" :title="props.team.name")
span.team-name(v-if="props.showName") {{ props.team.name }}

</template>

<style lang="stylus">
</style>
