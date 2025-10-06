<template lang="pug">
section.how-to
  //- TODO vids, replace txt?
  //- https://help.kinopio.club/about/ w green bk
  .step
    p ❶ Click anywhere and type to add cards
  .step
    p ❷ Drag cards to move them
  .step
    p ❸ Drag to connect related cards together
  .step
    p ❹ Paint select to edit together
</template>

<style lang="stylus">
section.how-to
  display flex
  overflow-x auto
  gap 20px
  flex-wrap nowrap
  .step
    min-width 200px
    background pink
    p
      margin 0
</style>
