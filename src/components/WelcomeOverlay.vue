<script setup lang="ts">
import { onBeforeUnmount } from 'nativescript-vue'
import type { EventData, GridLayout, View } from '@nativescript/core'
import { opening } from '../motion/entrance'

defineProps<{ width: number; height: number }>()
const emit = defineEmits<{ ready: []; finished: [] }>()
let animation: ReturnType<typeof opening> | undefined
let disposed = false
function loaded(event: EventData) {
  if (animation) return
  const root = event.object as GridLayout
  const view = (name: string) => root.getViewById<View>(name)
  emit('ready')
  animation = opening({ title: view('welcome-title'), caption: view('welcome-caption'), rule: view('welcome-rule'), skip: view('welcome-skip') })
  void animation.finished.then(finished => { if (finished && !disposed) emit('finished') })
}
onBeforeUnmount(() => { disposed = true; animation?.dispose() })
</script>

<template>
  <GridLayout :width="width" :height="height" @loaded="loaded">
    <AbsoluteLayout>
      <Label id="welcome-title" :top="height * .61" left="0" :width="width" height="60" text="VENA" textAlignment="center" fontSize="35" fontWeight="300" letterSpacing="0.30" color="#F5EDF0" opacity="0" />
      <GridLayout id="welcome-rule" :left="(width - 190) / 2" :top="height * .61 + 75" width="190" height="30" />
      <Label id="welcome-caption" :top="height * .61 + 122" left="0" :width="width" text="A rhythm of your own." textAlignment="center" fontSize="13" color="#AAA0AD" letterSpacing="0.02" opacity="0" />
      <Label id="welcome-skip" :top="height - 66" left="0" :width="width" height="44" text="Tap to enter" textAlignment="center" fontSize="11" color="#7F7282" letterSpacing="0.08" opacity="0" @tap="emit('finished')" accessible="true" accessibilityRole="button" accessibilityLabel="Skip introduction" automationText="skip-intro" />
    </AbsoluteLayout>
  </GridLayout>
</template>
