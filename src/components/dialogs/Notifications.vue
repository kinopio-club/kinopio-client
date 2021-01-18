<template lang="pug">
dialog.narrow.notifications(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p
      span.badge.info {{unreadCount}}
      span Notifications

  section(v-if="loading")
    Loader(:visible="loading")
  section(v-else-if="!loading && !notifications.length")
    p Cards added to your spaces by collaborators can be found here
  section.results-section(v-else)
    ul.results-list
      template(v-for="(notification in notifications")
        //- template(v-for="group in groupedItems") , tagDetails

        //- li.space-name(v-if="group.spaceId" :data-space-id="group.spaceId" @click="changeSpace(group.spaceId)" :class="{ active: spaceIsCurrentSpace(group.spaceId) }")
        //-   .background(v-if="group.background" :style="{ backgroundImage: `url(${group.background})` }")

        //- li
        //-   span.badge.space-badge
        //-     span {{space(notification.spaceId).name}}

        //- group by spaces

        li
          p
            span.badge.info(v-if="!notification.isRead") New
            span.badge.user-badge.user-badge(:style="{background: notification.user.color}")
              User(:user="notification.user" :isClickable="false" :hideYouLabel="true")
              span {{notification.user.name}}
            span(v-if="notification.type === 'addCard'")
          .notification-info
            img.icon(src="@/assets/add.svg")
            //- use NameSegments, refactor TagDetails to use NameSegments?
            span {{notification.card.name}}

</template>

<script>
import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

export default {
  name: 'Notifications',
  components: {
    Loader,
    User
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    notifications: Array,
    unreadCount: Number
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      dialogHeight: null
      // loading: false, // to prop,
      // cards: [
      //   {
      //     id: 'rZ-5dp0XYb0VqqgcZ4TeK',
      //     name: 'a cool note about basic good times'
      //   }
      // ],
      // groups: []
    }
  },
  computed: {
    // notifications () {
    //   return [
    //     {
    //       userId: '0MoKRbktXMtYEjYgwxik0',
    //       type: 'addCard',
    //       spaceId: 'qkj8V84p5ar23U9Pv7GeR',
    //       cardId: 'rZ-5dp0XYb0VqqgcZ4TeK',
    //       isRead: false
    //     }
    //   ]
    // }
  },
  methods: {
    // space (spaceId) {
    //   // console.log('☮️',spaceId, this.notifications)
    //   let space = this.$store.getters.cachedOrOtherSpaceById(spaceId)
    //   // if (!space) {
    //   //   console.log('🔔')
    //   //   await this.$store.dispatch('currentSpace/saveOtherSpace', { spaceId })
    //   //   space = this.$store.getters.cachedOrOtherSpaceById(spaceId)
    //   // }
    //   // console.log('🌹',space, space.name)
    //   return space
    // },
    // user (userId) {
    //   let user = this.$store.getters['currentSpace/userById'](userId)
    //   console.log('🚗', userId, user)
    //   return user
    // },
    // card (cardId) {
    //   return this.cards.find(card => card.id === cardId)
    // },

    // spaceName (spaceId) {
    //   await space
    // },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        // download notifications, mark isRead: true
        // this.group = by spaces (like TagDetails)
        // get other spaces
        // get other users, if not in userById
      }
      if (!visible) {
        // all local notifications isRead (emit)
      }
    }
  }
}
</script>

<style lang="stylus">
.notifications
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  section
    width 100%
  .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
    li
      display block
  .notification-info
    margin-top 4px
  .space-badge
    background-color var(--secondary-background)

  // .background
  //   border-radius 3px
  //   display inline-grid
  //   height 24px
  //   width 24px
  //   vertical-align middle
  //   margin-right 3px
  //   background-repeat no-repeat
  //   background-size cover
  // .card-image
  //   width 48px
  //   vertical-align middle
  //   border-radius 3px

</style>
