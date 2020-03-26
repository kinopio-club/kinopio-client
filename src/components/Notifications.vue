<template lang="pug">
aside.notifications(@click="closeAllDialogs")
  .item(v-for="(item in items" v-bind:key="item.id" :data-notification-id="item.id" :class="item.type")
    p
      img.icon(v-if="item.icon" :src="icon(item.icon).path" :class="item.icon")
      span {{item.message}}

  .item.success(v-if="notifySpaceIsOpenAndEditable")
    p
      img.icon.open(src="@/assets/open.svg")
      span This space is open, which means you can add to it too

  .persistent-item.success(v-if="notifySignUpToEditOpenSpace")
    p
      img.icon.open(src="@/assets/open.svg")
      span This space is open to edits, but you'll need to sign up or in first
    .row
      button(@click.stop="triggerSignUpOrInIsVisible") Sign Up or In

  .persistent-item(v-if="notifyReadOnly" ref="readOnly" :class="{'notification-jiggle': notifyReadOnlyJiggle}")
    p You can't edit this space, but you can save your own copy
    .row
      //- button(@click="triggerSpaceDetailsVisible") Your Spaces
      button(@click="copyCurrentSpace")
        img.icon(src="@/assets/add.svg")
        span Save a Copy

  .persistent-item.danger(v-if="notifySpaceNotFound")
    p Space could not be found, or is private
    .row
      button(@click="triggerSpaceDetailsVisible") Your Spaces
      button(v-if="!userIsSignedIn" @click.stop="triggerSignUpOrInIsVisible") Sign Up or In

  .persistent-item(v-if="notifySpaceIsRemoved")
    p This space has been removed
    .row
      button(@click="restoreSpace")
        img.icon(src="@/assets/undo.svg")
        span Restore
      button.danger(@click="removeSpacePermanent")
        img.icon(src="@/assets/remove.svg")
        span Permanently Remove

  .persistent-item.danger(v-if="notifyConnectionError")
    p A connection error has occured, please refresh
    .row
      .button-wrap
        a(href="mailto:support@kinopio.club?subject=Connection Error")
          button Email Support

  .persistent-item.success(v-if="notifyNewUser")
    p Welcome to Kinopio
    .row
      button(@click="createNewHelloSpace")
        img.icon(src="@/assets/add.svg")
        span How does this work?

</template>

<script>
import cache from '@/cache.js'

export default {
  name: 'Notifications',
  data () {
    return {
      notifyReadOnlyJiggle: false
    }
  },
  created () {
    this.update()
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'addNotification') {
        this.update()
      }
      if (mutation.type === 'currentUserIsPainting') {
        const element = this.$refs.readOnly
        if (!element) { return }
        if (state.currentUserIsPainting && element) {
          this.notifyReadOnlyJiggle = true
          element.addEventListener('animationend', this.removeNotifyReadOnlyJiggle, false)
        }
      }
      if (mutation.type === 'notifyReadOnlyJiggle') {
        const element = this.$refs.readOnly
        if (!element) { return }
        this.notifyReadOnlyJiggle = true
        element.addEventListener('animationend', this.removeNotifyReadOnlyJiggle, false)
      }
    })
  },
  computed: {
    items () { return this.$store.state.notifications },
    notifyReadOnly () { return this.$store.state.notifyReadOnly },
    notifySpaceNotFound () { return this.$store.state.notifySpaceNotFound },
    notifyConnectionError () { return this.$store.state.notifyConnectionError },
    notifySpaceIsRemoved () { return this.$store.state.notifySpaceIsRemoved },
    notifyNewUser () { return this.$store.state.notifyNewUser },
    notifySignUpToEditOpenSpace () { return this.$store.state.notifySignUpToEditOpenSpace },
    notifySpaceIsOpenAndEditable () { return this.$store.state.notifySpaceIsOpenAndEditable },
    userIsSignedIn () {
      return this.$store.getters['currentUser/isSignedIn']
    }
  },
  methods: {
    icon (icon) {
      return {
        path: require(`@/assets/${icon}.svg`)
      }
    },
    closeAllDialogs () {
      this.$store.commit('closeAllDialogs')
    },
    update () {
      const notifications = this.$store.state.notifications
      notifications.forEach(item => {
        this.$nextTick(() => {
          const element = document.querySelector(`.notifications .item[data-notification-id="${item.id}"]`)
          element.addEventListener('animationend', this.remove, false)
        })
      })
    },
    remove () {
      this.$store.commit('removeNotification')
    },
    removeNotifyReadOnlyJiggle () {
      this.notifyReadOnlyJiggle = false
    },
    copyCurrentSpace () {
      this.$store.dispatch('currentSpace/copyCurrentSpace')
    },
    triggerSpaceDetailsVisible () {
      this.$store.commit('triggerSpaceDetailsVisible')
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    restoreSpace () {
      const space = this.$store.state.currentSpace
      this.$store.dispatch('currentSpace/restoreRemovedSpace', space)
      this.$store.commit('notifySpaceIsRemoved', false)
    },
    removeSpacePermanent () {
      const space = this.$store.state.currentSpace
      this.$store.dispatch('currentSpace/removeSpacePermanent', space)
      this.$store.commit('notifySpaceIsRemoved', false)
      const firstSpace = cache.getAllSpaces()[0]
      this.$store.dispatch('currentSpace/loadSpace', firstSpace)
    },
    createNewHelloSpace () {
      this.$store.commit('notifyNewUser', false)
      window.location.href = '/'
    }
  }
}
</script>

<style lang="stylus">
.notifications
  margin-bottom 10px
  display flex
  flex-direction column
  align-items flex-start
  max-width 260px
  .item,
  .persistent-item
    pointer-events all
    box-shadow 3px 3px 0 var(--heavy-shadow)
    border-radius 3px
    margin-bottom 10px
    margin-right 0
    background-color var(--info-background)
    padding 5px 8px
    animation-name hideme
    animation-delay 5s
    animation-duration 0.1s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out
    &.success
      background-color var(--success-background)
    &.danger
      background-color var(--danger-background)
    &:last-child
      margin-bottom 0
    p
      margin 0
      user-select text
  .persistent-item
    animation none
  .row
    margin-top 5px
    display flex
    align-items flex-end
    button
      &:first-child
        margin-left 0
  button
    margin-left 6px

  button + button,
  button + label
    margin-left 6px

  .notification-jiggle
    animation-name notificationJiggle
    animation-duration 0.2s
    animation-iteration-count 2
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out

@keyframes notificationJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-3deg)
  50%
    transform rotate(2deg)
  75%
    transform rotate(-3deg)
  100%
    transform rotate(0deg)

@keyframes hideme
  from
    opacity 1
  to
    opacity 0
</style>
