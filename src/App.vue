<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'nativescript-vue'
import { type EventData, type GridLayout, type View } from '@nativescript/core'
import { motionScope, reducedMotion } from '@rafaelaugusto/jolt'
import IconButton from './components/IconButton.vue'
import PulseCard from './components/PulseCard.vue'
import WelcomeOverlay from './components/WelcomeOverlay.vue'
import LibrarySheet from './components/LibrarySheet.vue'
import { sessions, type SessionId } from './domain/sessions'
import { useRhythm } from './composables/useRhythm'
import type { HeartScene } from './scene/scene-view'
import { revealInterface } from './motion/entrance'

const width = ref(402), height = ref(808)
const opening = ref(true), immersive = ref(false), focused = ref(false), hovering = ref(false)
const panel = ref<'library' | 'about' | null>(null)
const { session, selected, running, saved, isSaved, select, toggleSaved } = useRhythm()
const compact = computed(() => height.value < 730)
const cardHeight = computed(() => compact.value ? 300 : 338)
const cardTop = computed(() => height.value - cardHeight.value - 83)
const sceneHeight = computed(() => immersive.value ? height.value : cardTop.value * 1.48 + 40)
let scene: HeartScene | undefined
let root: GridLayout | undefined
let started = false
let closing = false
const motion = motionScope()

function layout(event: EventData) {
  root = event.object as GridLayout
  const size = root.getActualSize()
  if (size.width > 0 && size.height > 0) { width.value = Math.min(460, size.width); height.value = Math.min(880, size.height) }
}
function sceneReady(event: EventData) {
  scene = event.object as HeartScene
  scene.setTempo(session.value.bpm)
  scene.setRunning(running.value)
  scene.setInteractionEnabled(!opening.value && !panel.value)
  if (opening.value) startOpening()
  else { scene.setReveal(1); scene.setFocus(focused.value) }
}
function startOpening() {
  if (!scene || started || !opening.value) return
  started = true
  scene.setFocus(true)
  scene.setReveal(1, reducedMotion() ? 0 : 1600)
}
async function enter() {
  if (closing || !opening.value) return
  closing = true
  scene?.setReveal(1)
  scene?.setFocus(false)
  opening.value = false
  await nextTick()
  if (root) {
    const view = (id: string) => root!.getViewById<View>(id)
    revealInterface(motion, view('header'), view('reading'), view('navigation'), view('hint'))
  }
  closing = false
}
function replay() {
  panel.value = null; immersive.value = false; focused.value = false
  scene?.setReveal(0); started = false; opening.value = true
  void nextTick().then(startOpening)
}
function toggleImmersive() {
  immersive.value = !immersive.value
  focused.value = immersive.value
  scene?.setFocus(focused.value)
}
function changeSession(id: SessionId) { select(id); panel.value = null }
watch(() => session.value.bpm, bpm => scene?.setTempo(bpm))
watch([running, panel], ([playing, overlay]) => scene?.setRunning(playing && !overlay))
watch([opening, panel], ([intro, overlay]) => scene?.setInteractionEnabled(!intro && !overlay))
onBeforeUnmount(() => motion.dispose())
</script>

<template>
  <Page actionBarHidden="true" backgroundColor="#050507" statusBarStyle="light" androidStatusBarBackground="#050507">
    <GridLayout iosOverflowSafeArea="false" @loaded="layout" @layoutChanged="layout" backgroundColor="#050507" clipToBounds="true">
      <AbsoluteLayout :width="width" :height="height">
        <HeartScene left="0" top="-12" :width="width" :height="sceneHeight" @sceneReady="sceneReady" @pointerActive="hovering = $event.active" />

        <GridLayout v-if="!opening" key="header" id="header" left="24" top="8" :width="width - 48" height="52" columns="64,*,44">
          <Label text="VENA" fontSize="13" fontWeight="500" letterSpacing="0.13" color="#F1EAF0" verticalAlignment="center" @tap="replay" accessible="true" accessibilityRole="button" accessibilityLabel="Replay Vena opening" />
          <Label id="scene-anchor" col="1" text="My heart" textAlignment="center" fontSize="15" fontWeight="500" color="#DED6E2" verticalAlignment="center" />
          <IconButton col="2" :icon="immersive ? 'close' : 'expand'" :label="immersive ? 'Exit immersive view' : 'Expand heart'" quiet @tap="toggleImmersive" />
        </GridLayout>

        <GridLayout v-if="!opening" key="hint" id="hint" :left="24" :top="immersive ? height - 120 : cardTop - 40" :width="width - 48" height="25" columns="*,auto" :opacity="hovering ? 1 : .7">
          <StackLayout orientation="horizontal" verticalAlignment="center">
            <GridLayout width="3" height="3" borderRadius="2" backgroundColor="#FF5277" marginRight="7" />
            <Label :text="hovering ? 'Follow the light' : 'Move the pointer to explore'" fontSize="10" letterSpacing="0.04" color="#AAA0B1" />
          </StackLayout>
          <Label col="1" :text="'0' + (sessions.findIndex(item => item.id === selected) + 1) + ' / 03'" fontSize="9" letterSpacing="0.06" color="#63566B" verticalAlignment="center" :visibility="immersive ? 'collapse' : 'visible'" />
        </GridLayout>

        <GridLayout v-if="!opening" key="reading" id="reading" left="20" :top="cardTop" :width="width - 40" :height="cardHeight" :visibility="immersive ? 'collapse' : 'visible'">
          <PulseCard :width="width - 40" :height="cardHeight" :session="session" :running="running && !panel" :saved="isSaved" :compact="compact" @pause="running = !running" @save="toggleSaved" />
        </GridLayout>

        <GridLayout v-if="!opening" key="navigation" id="navigation" left="20" :top="height - 66" :width="width - 40" height="48" columns="*,44" :visibility="immersive ? 'collapse' : 'visible'">
          <GridLayout columns="*,*,*" backgroundColor="#101013" borderRadius="24" padding="4" marginRight="12">
            <GridLayout v-for="(item, index) in sessions" :key="item.id" :col="index" borderRadius="20" :backgroundColor="selected === item.id ? '#2D1B26' : 'transparent'" @tap="changeSession(item.id)" accessible="true" accessibilityRole="button" :accessibilityLabel="item.label" :automationText="'mode-' + item.id">
              <Label :text="item.label" textAlignment="center" fontSize="11" :fontWeight="selected === item.id ? '500' : '400'" :color="selected === item.id ? '#FFC4D4' : '#8D8297'" verticalAlignment="center" />
            </GridLayout>
          </GridLayout>
          <IconButton col="1" icon="list" label="Open saved rhythms" @tap="panel = 'library'" />
        </GridLayout>

        <GridLayout v-if="!opening && immersive" :left="(width - 150) / 2" :top="height - 75" width="150" height="44" backgroundColor="#27111C" borderRadius="22" @tap="focused = !focused; scene?.setFocus(focused)" accessible="true" accessibilityRole="button" accessibilityLabel="Toggle heart focus">
          <Label :text="focused ? 'See the whole body' : 'Closer to the heart'" textAlignment="center" fontSize="11" color="#FFB4C9" verticalAlignment="center" />
        </GridLayout>

        <Label v-if="!opening && !immersive && !panel" text="i" :left="width - 61" top="66" width="28" height="28" textAlignment="center" color="#66596D" fontSize="13" @tap="panel = 'about'" accessible="true" accessibilityRole="button" accessibilityLabel="About these sample rhythms" />
        <WelcomeOverlay v-if="opening" key="welcome" :width="width" :height="height" @ready="startOpening" @finished="enter" />
        <LibrarySheet v-if="panel" key="sheet" :width="width" :height="height" :saved="saved" :kind="panel" @close="panel = null" @select="changeSession" @replay="replay" />
      </AbsoluteLayout>
    </GridLayout>
  </Page>
</template>
