<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// const props = defineProps({
//   hideActions: Boolean
// })

</script>

<template lang="pug">
section.groups-info

  //- what is groups
  //- .row.title-row
  //- p Use groups to organize related spaces and share them your closest friends or team. Each member of the group can see and edit all Group spaces.
  p Group spaces together and collaborate with group members
  p
    a(href="https://help.kinopio.club/posts/teams")
      button
        span More Info{{' '}}
        img.icon.visit(src="@/assets/visit.svg")
  //- p
  //-   a(href="mailto:support@kinopio.club?subject=Kinopio Groups Beta")
  //-     button
  //-       img.icon(src="@/assets/mail.svg")
  //-       span Email Support

  //- p
  //-   button
  //-     span Info{{' '}}
  //-     img.icon.visit(src="@/assets/visit.svg")

  img.placeholder(src="@/assets/collaborators.jpg")

</template>

<style lang="stylus">
section.groups-info
  .title-row
    align-items flex-start
  .small-button
    margin-top 0
  .placeholder
    border-radius var(--small-entity-radius)
    margin-top 10px
</style>
