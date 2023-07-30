<template lang="pug">
.row.collaboration-info(v-if="visible" @click.left.stop="closeDialogs")
  .badge.status.button-badge(@click.left.prevent.stop="toggleFilterShowAbsoluteDates" @touchend.prevent.stop="toggleFilterShowAbsoluteDates")
    img.icon.time(src="@/assets/time.svg")
    span.name {{dateUpdatedAt}}
  .users
    //- created by
    template(v-if="createdByUserIsNotEmpty")
      UserLabelInline(:user="createdByUser" :isClickable="true" :title="'Created by'" :isOnDarkBackground="true")
    //- updated by
    template(v-if="isUpdatedByDifferentUser")
      UserLabelInline(:user="updatedByUser" :isClickable="true" :title="'Updated by'" :isOnDarkBackground="true")
    //- created through api
    .badge.status.system-badge(v-if="card.isCreatedThroughPublicApi" title="Created via public API")
      img.icon.system(src="@/assets/system.svg")

</template>

<script>
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'

let dateIsUpdated
let updatedAbsoluteDate

export default {
  name: 'CardCollaborationInfo',
  components: {
    UserLabelInline
  },
  props: {
    visible: Boolean,
    createdByUser: Object,
    updatedByUser: Object,
    card: Object,
    parentElement: Object
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerCloseChildDialogs' && this.visible) {
        this.closeDialogsFromParent()
      }
    })
  },
  mounted () {
    dateIsUpdated = false
    updatedAbsoluteDate = ''
  },
  computed: {
    createdByUserIsNotEmpty () { return utils.objectHasKeys(this.createdByUser) },
    isUpdatedByDifferentUser () { return this.createdByUser.id !== this.updatedByUser.id },
    dateUpdatedAt () {
      const date = this.card.nameUpdatedAt || this.card.createdAt
      const showAbsoluteDate = this.$store.state.currentUser.filterShowAbsoluteDates
      if (date) {
        if (showAbsoluteDate) {
          return new Date(date).toLocaleString()
        } else {
          return utils.shortRelativeTime(date)
        }
      } else {
        return 'now'
      }
    },
    userDetailsIsVisible () { return this.$store.state.userDetailsIsVisible }
  },
  methods: {
    userDetailsIsUser (user) {
      if (!this.userDetailsIsVisible) { return }
      const userDetailsUser = this.$store.state.userDetailsUser
      return user.id === userDetailsUser.id
    },
    closeDialogsFromParent () {
      this.$store.commit('userDetailsIsVisible', false)
    },
    closeDialogs () {
      this.$store.commit('userDetailsIsVisible', false)
      this.$emit('closeDialogs')
    },
    toggleFilterShowAbsoluteDates () {
      this.closeDialogs()
      const value = !this.$store.state.currentUser.filterShowAbsoluteDates
      this.$store.dispatch('currentUser/toggleFilterShowAbsoluteDates', value)
    },
    scrollParentIntoView () {
      const element = this.parentElement
      if (!element) { return }
      utils.scrollIntoView({ element })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollParentIntoView()
        }
      })
    }
  }
}
</script>

<style lang="stylus">
.collaboration-info
  .users
    display flex
    flex-wrap wrap
  .system-badge
    margin-top 1px
  .name
    color var(--primary)
</style>
