<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'

const store = useStore()

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean
})

const closeDialogs = () => {
  emit('closeDialogs')
}
const group = computed(() => store.getters['groups/spaceGroup']())

</script>

<template lang="pug">
section.invite-to-group(v-if="props.visible" @click.stop="closeDialogs" :data-group-collaboratorKey="group.collaboratorKey")
  .row
    GroupLabel(:group="group")
    span Invite to Group

</template>

<style lang="stylus">
// section.invite-to-group
</style>
