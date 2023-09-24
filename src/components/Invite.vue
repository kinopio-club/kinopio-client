<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore, mapState, mapGetters } from 'vuex'

import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'
const store = useStore()

onMounted(() => {
  store.commit('clearNotificationsWithPosition')
})

const state = reactive({
  loading: false,
  tipsIsVisible: false
})

const currentUser = computed(() => store.state.currentUser)
const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const spaceIsPrivate = computed(() => store.state.currentSpace.privacy === 'private')
const spaceName = computed(() => store.state.currentSpace.name)
const randomUser = computed(() => {
  const luminosity = store.state.currentUser.theme
  const color = randomColor({ luminosity })
  return { color }
})
const collaboratorKey = computed(() => store.state.currentSpace.collaboratorKey)
const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}

// urls

const editUrl = computed(() => {
  const currentSpace = store.state.currentSpace
  const spaceId = currentSpace.id
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value })
  console.log('🍇 invite edit url', url)
  return url
})
const readOnlyUrl = computed(() => {
  const currentSpace = store.state.currentSpace
  const spaceId = currentSpace.id
  const readOnlyKey = currentSpace.readOnlyKey
  const url = utils.readOnlyUrl({ spaceId, spaceName: spaceName.value, readOnlyKey })
  console.log('🍇 read only url', url)
  return url
})

//  copy urls

const copyEditUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(editUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const copyReadUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(readOnlyUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// native web share

const webShareIsSupported = computed(() => navigator.share)
const webShareEdit = () => {
  const data = {
    title: `Invite to Edit`,
    text: spaceName.value,
    url: editUrl.value
  }
  navigator.share(data)
}
const webShareRead = () => {
  const data = {
    title: `Invite to Edit Only`,
    text: spaceName.value,
    url: readOnlyUrl.value
  }
  navigator.share(data)
}
</script>

<template lang="pug">
section.invite
  section.subsection
    .row
      p
        .users
          User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
          User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
        span Invite Collaborators

    Loader(:visible="state.loading")
    template(v-if="!state.loading")

      //- Copy buttons
      template(v-if="collaboratorKey")
        .row
          .segmented-buttons
            button(@click.left="copyEditUrl")
              img.icon.copy(src="@/assets/copy.svg")
              span Copy Edit URL
            button(v-if="webShareIsSupported" @click="webShareEdit")
              img.icon.share(src="@/assets/share.svg")
          button.small-button.extra-options-button.inline-button(@click="toggleTipsIsVisible" :class="{active: state.tipsIsVisible}")
            span Tips

        template(v-if="spaceIsPrivate")
          .row
            .segmented-buttons
              button(@click.left="copyReadUrl")
                img.icon.copy(src="@/assets/copy.svg")
                span Copy Read Only URL
              button(v-if="webShareIsSupported" @click="webShareRead")
                img.icon.share(src="@/assets/share.svg")

      //- Tips
      .more-info(v-if="state.tipsIsVisible")
        .row
          p
            span No account is needed to read spaces, but editing requires an account
        .row
          p.badge.success You'll both earn a $6 credit when someone you invite signs up for a Kinopio account
        template(v-if="currentUserIsUpgraded")
          hr
          .row
            .badge.success
              span Because your account is upgraded, others can create cards here for free
</template>

<style lang="stylus">
section.invite
  user-select text
  .badge
    margin 0
    color var(--primary)
    vertical-align 0
  .users
    margin-right 5px
</style>
