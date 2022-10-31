<template lang="pug">
.tag.badge(
  @click.left.stop="clickTag"
  @touchend.stop="clickTag"
  @keyup.stop.enter="clickTag"
  :data-tag-id="tag.id"
  :data-tag-name="tag.name"
  :class="{ 'button-badge': isClickable, 'active': isActive }"
  :style="tagStyle"
)
  span.tag-name(:class="{ 'is-dark': isDark }") {{tag.name}}
  .badge.label-badge(v-if="badgeLabel")
    span {{badgeLabel}}
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'Tag',
  components: {
  },
  props: {
    tag: Object,
    isActive: Boolean,
    isClickable: Boolean,
    badgeLabel: String
  },
  computed: {
    tagStyle () { return utils.tagStyle(this.tag) },
    isDark () { return utils.colorIsDark(this.tag.color) }
  },
  methods: {
    clickTag (event) {
      this.$emit('clickTag', event, this.tag)
    }
  }
}
</script>

<style lang="stylus">
.tag
  .tag-name
    color var(--primary)
    &.is-dark
      filter invert(1)
</style>
