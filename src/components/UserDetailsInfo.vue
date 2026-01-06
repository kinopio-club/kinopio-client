<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import UserBadges from '@/components/UserBadges.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import User from '@/components/User.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const descriptionElement = ref(null)

onMounted(() => {
  updateTextareaSize()
})
const updateTextareaSize = async () => {
  await nextTick()
  const textarea = descriptionElement.value
  if (!textarea) { return }
  textarea.style.height = textarea.scrollHeight + 1 + 'px'
}

const props = defineProps({
  user: Object,
  showExploreSpaces: Boolean,
  showUserBadges: Boolean
})

const state = reactive({
  colorPickerIsVisible: false
})

// toggle dialogs

const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const closeDialogs = () => {
  state.colorPickerIsVisible = false
  globalStore.triggerCloseChildDialogs()
}

// user info

const isDevelopment = computed(() => consts.isDevelopment())
const userColor = computed(() => props.user.color)
const userIsUpgraded = computed(() => props.user.isUpgraded)
const isCurrentUser = computed(() => userStore.getUserIsCurrentUser(props.user))
const userName = computed({
  get () {
    return props.user.name
  },
  set (newValue) {
    updateUser({ name: newValue })
  }
})
const userDescription = computed({
  get () {
    return props.user.description
  },
  set (newValue) {
    updateUser({ description: newValue })
    updateTextareaSize()
  }
})
const userWebsite = computed({
  get () {
    return props.user.website
  },
  set (newValue) {
    updateUser({ website: newValue })
  }
})
const websiteUrl = computed(() => {
  if (!userWebsite.value) { return }
  const urls = utils.urlsFromString(userWebsite.value, true)
  if (!urls) { return }
  return urls[0]
})

// update user

const updateUser = (update) => {
  userStore.updateUser(update)
}
const updateUserColor = (newValue) => {
  updateUser({ color: newValue })
}

</script>

<template lang="pug">
.user-details-info(@click.stop="closeDialogs")
  //- Other User
  section(v-if="!isCurrentUser")
    .user-info
      .row
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id")
        p.name.user-details-name {{user.name}}
      .row(v-if="userDescription")
        p {{userDescription}}
      .row.website(v-if="user.website")
        p(v-if="!websiteUrl") {{user.website}}
        a(:href="websiteUrl" v-if="websiteUrl")
          span {{user.website}}
      .other-user-info(v-if="props.showUserBadges")
        UserBadges(:user="user" :isCurrentUser="isCurrentUser")
  //- Current User
  template(v-if="isCurrentUser")
    section.current-user
      //- color and name
      .row
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
            .current-color(:style="{ background: userColor }")
          ColorPicker(:currentColor="userColor" :visible="state.colorPickerIsVisible" @selectedColor="updateUserColor")
        input.name.user-details-name(placeholder="What's your name?" v-model="userName" name="Name" maxlength=100)
      //- description
      .row
        textarea(ref="descriptionElement" placeholder="Tell us about yourself" v-model="userDescription" name="Description" maxlength=220 rows="1")
      //- website
      .row
        input(ref="website" placeholder="Website" v-model="userWebsite" name="Website" maxlength=200 rows="1")
        a(:href="websiteUrl" v-if="websiteUrl")
          button.inline-button
            img.icon.visit.arrow-icon(src="@/assets/visit.svg")
      //- badges
      UserBadges(:user="user" :isCurrentUser="isCurrentUser")

  ItemDetailsDebug(:item="props.user")
</template>

<style lang="stylus">
.user-details-info
  .user-badges
    margin-top -10px
  .user-details-name
    margin-left 6px
  .error-message
    margin-top 10px
  .upgrade
    .badge
      display inline-block

  .upgrade-user
    max-height calc(100vh - 175px)

  textarea
    margin-bottom 0

  .inline-button
    margin-left 6px
    background-color var(--primary-background)
    cursor pointer
    &:hover
      background var(--secondary-hover-background)
    &:active
      background var(--secondary-active-background)

  .arrow-icon
    position absolute
    left 5px
    top 3.5px

  .user-info
    .row
      align-items center
    p
      margin 0
    .website
      word-break break-all
      align-items flex-start
      .inline-button
        margin-top -1px
    textarea:disabled
      color var(--primary)
      -webkit-text-fill-color var(--primary)
      -webkit-opacity 1
    .user
      margin-right 6px

  .other-user-info
    max-height 200px
    overflow scroll
    margin-bottom -8px
    padding-bottom 8px
  .explore-spaces-section
    max-height 120px
</style>
