<template lang="pug">
span.markdown(v-if="segment.markdown")
  template(v-for="markdown in segment.markdown")
    template(v-if="markdown.type === 'text'")
      span {{markdown.content}}
    template(v-else-if="markdown.type === 'link'")
      a(:href="markdown.result[2]") {{markdown.result[1]}}
    template(v-else-if="markdown.type === 'bold'")
      strong {{markdown.content}}
    template(v-else-if="markdown.type === 'emphasis'")
      em {{markdown.content}}
    template(v-else-if="markdown.type === 'strikethrough'")
      del {{markdown.content}}
    template(v-else-if="markdown.type === 'codeBlock'")
      pre {{markdown.content}}
    template(v-else-if="markdown.type === 'code'")
      code {{markdown.content}}
</template>

<script>
export default {
  name: 'Markdown',
  props: {
    segment: Object
  }
}
</script>

<style lang="stylus">
.markdown
  a
    color var(--text-link)
    text-decoration underline
    &:hover
      text-decoration none
  strong
    font-weight normal
    background-color var(--info-background)
    border-radius 3px
  pre
    font-weight normal
    background-color var(--secondary-active-background)
    border-radius 3px
    margin 0
    white-space pre-wrap
  code
    font-weight normal
    background-color var(--secondary-active-background)
    border-radius 3px
</style>
