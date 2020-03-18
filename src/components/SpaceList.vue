<template lang="pug">
ul.results-list.space-list
  template(v-for="(space in spaces")
    li(@click="selectSpace(space)" :class="{ active: spaceIsActive(space) }" :key="space.id" tabindex="0" v-on:keyup.enter="selectSpace(space)")

      User(v-if="showUser" :user="user(space)" :isClickable="false" :key="user(space).id")
      .badge.info.template-badge(v-if="showCategory") {{space.category}}
      .badge.info.template-badge(v-else-if="spaceIsTemplate(space)") Template

      .name
        span {{space.name}}
        .badge.status(v-if="showInExplore(space)")
          img.icon(src="@/assets/checkmark.svg")
        img.icon.privacy-icon(v-if="spaceIsNotClosed(space)" :src="privacyIcon(space)")
</template>

<script>
import privacy from '@/spaces/privacy.js'
import templates from '@/spaces/templates.js'

export default {
  name: 'SpaceList',
  components: {
    User: () => import('@/components/User.vue')
  },
  props: {
    spaces: Array,
    selectedSpace: Object,
    showCategory: Boolean,
    showUser: Boolean,
    hideExploreBadge: Boolean
  },
  methods: {
    spaceIsActive (space) {
      if (this.selectedSpace) {
        return Boolean(this.selectedSpace.id === space.id)
      } else {
        return this.spaceIsCurrentSpace(space)
      }
    },
    spaceIsCurrentSpace (space) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === space.id)
    },
    spaceIsTemplate (space) {
      const templateSpaceIds = templates.spaces().map(template => template.id)
      return templateSpaceIds.includes(space.id)
    },
    selectSpace (space) {
      this.$emit('selectSpace', space)
    },
    spaceIsNotClosed (space) {
      return space.privacy !== 'closed'
    },
    privacyIcon (space) {
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      if (privacyState) {
        return require(`@/assets/${privacyState.icon}.svg`)
      }
    },
    // privacyBadgeColor (space) {
    //   const privacyState = privacy.states().find(state => {
    //     return state.name === space.privacy
    //   })
    //   return privacyState.color
    // },
    showInExplore (space) {
      if (this.hideExploreBadge) { return }
      if (space.privacy === 'private') { return }
      return space.showInExplore
    },
    user (space) {
      return space.users[0]
    }

  }
}
</script>

<style lang="stylus">
.space-list
  .template-badge
    margin-left 0
    flex none

  .badge.status
    display inline-flex
    margin 0
    margin-left 6px
    min-height auto
    height 14px
    img
      margin 0

  .name
    margin 0
    white-space wrap
    overflow hidden
    .icon
      margin-left 6px

  .privacy-icon
    height 12px
    vertical-align -2px

  .user
    margin-right 6px
    vertical-align middle

</style>
