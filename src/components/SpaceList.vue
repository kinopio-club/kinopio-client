<template lang="pug">
ul.results-list.space-list
  template(v-for="(space in spaces")
    li(@click="selectSpace(space)" :class="{ active: spaceIsCurrentSpace(space) }" :key="space.id" tabindex="0" v-on:keyup.enter="selectSpace(space)")
      .badge.info.template-badge(v-show="spaceIsTemplate(space)")
        span Template
      .name
        span {{space.name}}
        //-  refine shouldShowInExploreBadge, based on param and state
        .badge.status(v-if="shouldShowInExploreBadge(space)")
          img.icon(src="@/assets/checkmark.svg")
        //- used modified privacy icon
        img.icon(v-if="spaceIsPrivate(space)" src="@/assets/lock.svg")
</template>

<script>
import privacy from '@/spaces/privacy.js'
import templates from '@/spaces/templates.js'

export default {
  name: 'SpaceList',
  props: {
    spaces: Array
  },
  methods: {
    privacyIcon (space) {
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      return require(`@/assets/${privacyState.icon}.svg`)
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
    // replace w privacyIcon
    spaceIsPrivate (space) {
      return space.privacy === 'private'
    },
    // refine
    shouldShowInExploreBadge (space) {
      if (space.privacy === 'private') { return }
      return space.showInExplore
    }
  }
}
</script>

<style lang="stylus">
.space-list
  .template-badge
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
    white-space wrap
    overflow hidden
    .icon
      margin-left 6px

</style>
