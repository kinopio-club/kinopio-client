<template lang="pug">
aside.notifications
  .item(v-for="(item in items" v-bind:key="item.id" :data-notification-id="item.id" :class="item.type")
    span {{item.message}}

  .persistent-item(v-if="notifyReadOnly" ref="readOnly" :class="{'notification-jiggle': notifyReadOnlyJiggle}")
    span This space is view only
    button(@click="remixCurrentSpace") Remix Your Own Copy

  .persistent-item.danger(v-if="notifySpaceNotFound")
    span Space could not be found
    button(@click="triggerSpaceDetailsVisible") My Spaces

  .persistent-item.danger(v-if="notifyConnectionError")
    span A connection error has occured, please refresh
    .button-wrap
      a(href="mailto:support@kinopio.club?subject=Connection Error")
        button Email Support

</template>

<script>
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
        if (state.currentUserIsPainting && element) {
          this.notifyReadOnlyJiggle = true
          element.addEventListener('animationend', this.removeNotifyReadOnlyJiggle, false)
        }
      }
    })
  },
  computed: {
    items () { return this.$store.state.notifications },
    notifyReadOnly () { return this.$store.state.notifyReadOnly },
    notifySpaceNotFound () { return this.$store.state.notifySpaceNotFound },
    notifyConnectionError () { return this.$store.state.notifyConnectionError },
    spaceName () { return this.$store.state.currentSpace.name }
  },
  methods: {
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
    remixCurrentSpace () {
      this.$store.dispatch('currentSpace/remixCurrentSpace')
    },
    triggerSpaceDetailsVisible () {
      this.$store.commit('triggerSpaceDetailsVisible')
    }
  }
}
</script>

<style lang="stylus">
.notifications
  pointer-events all
  margin-bottom 10px
  display flex
  flex-direction column
  align-items flex-end
  .item,
  .persistent-item
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
    span
      user-select auto
  .persistent-item
    animation none
  button
    margin-left 6px

  .notification-jiggle
    animation-name notificationJiggle
    animation-duration 0.4s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out

@keyframes notificationJiggle
  0%
    transform rotate(0deg)
  25%
    transform rotate(-2deg)
  50%
    transform rotate(2deg)
  75%
    transform rotate(-2deg)
  100%
    transform rotate(0deg)

@keyframes hideme
  from
    opacity 1
  to
    opacity 0
</style>
