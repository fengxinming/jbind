<script setup lang="ts">
  import { useTemplateRef, onMounted, shallowReactive } from 'vue';
  import { VPButton } from 'vitepress/theme';
  import { YUVRender } from 'yuv-render';

  const scope = shallowReactive({
    waiting: false
  });
  const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
  let yuv: YUVRender;

  onMounted(()=> {
    const el = canvas.value!;
    yuv = new YUVRender(el);
    yuv.setDimension(768, 320);
  });

  const start = () => {
    scope.waiting = true;
    fetch(`${import.meta.env.BASE_URL}frame.json`)
      .then((res: Response) => res.json())
      .then((frameArray: ArrayBuffer) => {
        scope.waiting = false;
        yuv.render(new Uint8Array(frameArray));
      });
  };
</script>
<template>
  <div class="buttons">
    <VPButton
      text="Render"
      :disabled="scope.waiting"
      @click="start()"
    />
  </div>
  <div :class="{ 'yuv-render': true, 'v-waiting': scope.waiting }"
  >
    <canvas ref="canvas" />
    <div className="v-loading-spinner" />
  </div>
</template>
<style scoped lang="stylus">
  .buttons {
    margin-bottom: 16px;
  }
  .yuv-render
    display block
    box-sizing border-box
    background-color #000
    position relative
    padding 0
    width 768px
    height 320px

    canvas
      position absolute
      width 100%
      height 100%
      top 0
      left 0

  $primary-background-color = #2B333F
  $primary-background-transparency = 0.7
  $secondary-background-color = lighten($primary-background-color, 33%)
  $secondary-background-transparency = 0.5

  .v-loading-spinner
    display none
    position absolute
    top 50%
    left 50%
    margin -25px 0 0 -25px
    opacity 0.85
    // Need to fix centered page layouts
    text-align left
    border 6px solid rgba($primary-background-color, $primary-background-transparency)
    // border: 6px solid rgba(43, 51, 63, 0.5);
    box-sizing border-box
    background-clip padding-box
    width 50px
    height 50px
    border-radius 25px
    visibility hidden

  .v-seeking .v-loading-spinner, .v-waiting .v-loading-spinner
    display block
    // add a delay before actual show the spinner
    animation v-spinner-show 0s linear 0.3s forwards

  .v-loading-spinner:before, .v-loading-spinner:after
    content ''
    position absolute
    margin -6px
    box-sizing inherit
    width inherit
    height inherit
    border-radius inherit
    // Keep 100% opacity so they don't show through each other
    opacity 1
    border inherit
    border-color transparent
    border-top-color white

  // only animate when showing because it can be processor heavy
  .v-seeking .v-loading-spinner:before, .v-seeking .v-loading-spinner:after, .v-waiting .v-loading-spinner:before, .v-waiting .v-loading-spinner:after
    -webkit-animation v-spinner-spin 1.1s cubic-bezier(0.6, 0.2, 0, 0.8) infinite, v-spinner-fade 1.1s linear infinite
    animation v-spinner-spin 1.1s cubic-bezier(0.6, 0.2, 0, 0.8) infinite, v-spinner-fade 1.1s linear infinite

  .v-seeking .v-loading-spinner:before, .v-waiting .v-loading-spinner:before
    border-top-color rgb(255, 255, 255)

  .v-seeking .v-loading-spinner:after, .v-waiting .v-loading-spinner:after
    border-top-color rgb(255, 255, 255)
    -webkit-animation-delay 0.44s
    animation-delay 0.44s

  @keyframes v-spinner-show
    to
      visibility visible

  @keyframes v-spinner-show
    to
      visibility visible

  @keyframes v-spinner-spin
    100%
      transform rotate(360deg)

  @keyframes v-spinner-spin
    100%
      -webkit-transform rotate(360deg)

  @keyframes v-spinner-fade
    0%
      border-top-color $secondary-background-color

    20%
      border-top-color $secondary-background-color

    35%
      border-top-color white

    60%
      border-top-color $secondary-background-color

    100%
      border-top-color $secondary-background-color

  @keyframes v-spinner-fade
    0%
      border-top-color $secondary-background-color

    20%
      border-top-color $secondary-background-color

    35%
      border-top-color white

    60%
      border-top-color $secondary-background-color

    100%
      border-top-color $secondary-background-color
</style>