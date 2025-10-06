<template lang="pug">
section.how-to
  //- h2 How To
  //- TODO vids, replace txt?
  //- https://help.kinopio.club/about/ w green bk
  .steps
    .step
      //-
      //- p ❶ Click anywhere and type to add cards
      video(autoplay loop muted playsinline)
        source(src="https://files.kinopio.club/connecting-cards.mp4")
    .step
      //- p ❷ Drag cards to move them
      video(autoplay loop muted playsinline)
        source(src="https://files.kinopio.club/connecting-cards.mp4")
    .step
      //- p ❸ Drag to connect related cards together
      video(autoplay loop muted playsinline)
        source(src="https://cdn.kinopio.club/R4JoZXWYNEbaZ3pRdKHQj/3.mp4")
    .step
      //- p ❹ Paint select to edit together
      video(autoplay loop muted playsinline)
        source(src="https://cdn.kinopio.club/JjjQdKPST3WoCvech3OjU/4.mp4")

</template>

<style lang="stylus">
section.how-to
  .steps
    display flex
    overflow-x auto
    gap 10px
    flex-wrap nowrap
    .step
      min-width 220px
      // background forestgreen
      // border-radius var(--page-entity-radius)
      video
        border-radius: calc(var(--entity-radius) * 2);
      // p
      //   // padding 10px
      //   margin 0
</style>
