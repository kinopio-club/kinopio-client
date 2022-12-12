<template lang="pug">
aside.notifications-with-position
  .item.badge(
    v-for="item in items"
    v-bind:key="item.id"
    :data-notification-id="item.id"
    :style="{ left: item.position.x + 'px', top: item.position.y + 'px' }"
    :class="item.type"
    @animationend="remove"
  )
    img.icon.cancel(v-if="item.icon === 'cancel'" src="@/assets/add.svg")
    img.icon.add(v-if="item.icon === 'add'" src="@/assets/add.svg")
    img.icon.checkmark(v-if="item.icon === 'checkmark'" src="@/assets/checkmark.svg")
    img.icon.cut(v-if="item.icon === 'cut'" src="@/assets/cut.svg")
    img.icon.undo(v-if="item.icon === 'undo'" src="@/assets/undo.svg")

    span {{item.message}}
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import isEqual from 'lodash-es/isEqual'

export default {
  name: 'NotificationsWithPosition',
  props: {
    layer: String // app, space
  },
  computed: {
    ...mapState([
      'notificationsWithPosition'
    ]),
    ...mapGetters([
      'currentScrollPosition'
    ]),
    items () {
      const itemsInLayer = this.notificationsWithPosition.filter(item => item.layer === this.layer)
      return itemsInLayer
    }
  },
  methods: {
    remove () {
      this.$store.commit('removeNotificationWithPosition')
    }
  },
  watch: {
    currentScrollPosition (position, prevPosition) {
      const cursorIsUnchanged = isEqual(position, prevPosition)
      if (cursorIsUnchanged) { return }
      this.$store.commit('clearNotificationsWithPosition')
    }
  }
}

</script>

<style lang="stylus">
.notifications-with-position
  .item
    position absolute
    z-index var(--max-z)
    pointer-events none
    animation-name hideme
    animation-delay 5s
    animation-duration 0.1s
    animation-iteration-count 1
    animation-direction forward
    animation-fill-mode forwards
    animation-timing-function ease-out
  .checkmark
    vertical-align 2px
</style>
