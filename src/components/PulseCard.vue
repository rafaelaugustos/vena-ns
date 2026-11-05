<script setup lang="ts">
import { onBeforeUnmount, watch } from 'nativescript-vue'
import type { EventData, GridLayout, Label } from '@nativescript/core'
import { motionScope, reducedMotion, type MotionScope } from '@rafaelaugusto/jolt'
import type { Session } from '../domain/sessions'
import type { SignalView } from '../scene/signal-view'
import IconButton from './IconButton.vue'

const props = defineProps<{ width: number; height: number; session: Session; running: boolean; saved: boolean; compact: boolean }>()
const emit = defineEmits<{ pause: []; save: [] }>()
let root: GridLayout | undefined
let graph: SignalView | undefined
let motion: MotionScope | undefined
function ready(event: EventData) { root = event.object as GridLayout; motion = motionScope() }
function graphReady(event: EventData) { graph = event.object as SignalView; graph.setTempo(props.session.bpm); graph.setRunning(props.running) }
watch(() => props.running, value => graph?.setRunning(value))
watch(() => props.session, session => {
  graph?.setTempo(session.bpm)
  if (root) {
    const number = root.getViewById<Label>('rate-number')
    motion?.animate(number, { opacity: [.5, 1], y: reducedMotion() ? 0 : [9, 0] }, { duration: 320, ease: 'easeOut' })
  }
})
onBeforeUnmount(() => motion?.dispose())
</script>

<template>
  <GridLayout :width="width" :height="height" :rows="compact ? '38,72,*,38' : '40,86,*,38'" padding="14 24 12" backgroundColor="#151518" borderRadius="36" @loaded="ready">
    <GridLayout row="0" columns="*,44" marginBottom="2">
      <StackLayout orientation="horizontal" verticalAlignment="center">
        <GridLayout width="6" height="6" borderRadius="3" :backgroundColor="running ? '#FF4067' : '#77717E'" marginRight="8" />
        <Label :text="running ? session.label.toUpperCase() : 'PAUSED'" class="eyebrow" color="#B3ABB8" />
      </StackLayout>
      <IconButton col="1" :icon="running ? 'pause' : 'play'" :label="running ? 'Pause rhythm' : 'Play rhythm'" quiet @tap="emit('pause')" />
    </GridLayout>
    <StackLayout row="1" orientation="horizontal" marginTop="-9" marginBottom="0">
      <Label id="rate-number" :text="session.bpm" :fontSize="compact ? 64 : 74" fontWeight="400" letterSpacing="-0.045" color="#F5F2F5" accessibilityLabel="Sample heart rate" />
      <StackLayout verticalAlignment="bottom" marginLeft="12" marginBottom="16">
        <Label text="BPM" fontSize="14" fontWeight="500" color="#A49CFF" />
        <Label text="SAMPLE" fontSize="8" letterSpacing="0.07" color="#6E6875" marginTop="4" />
      </StackLayout>
    </StackLayout>
    <GridLayout row="2" rows="25,22,*" marginBottom="12">
      <Label :text="session.title" fontSize="19" fontWeight="500" color="#EEE9EF" />
      <Label row="1" :text="session.subtitle" fontSize="11" color="#8C8593" marginTop="3" />
      <SignalView row="2" :width="width - 90" :height="compact ? 46 : 60" verticalAlignment="bottom" @loaded="graphReady" />
    </GridLayout>
    <GridLayout row="3" columns="*,auto" borderTopWidth="1" borderColor="#29252F" paddingTop="9">
      <StackLayout orientation="horizontal" verticalAlignment="center">
        <Label :text="session.time" fontSize="11" color="#AAA2B0" />
        <Label :text="'  ·  ' + session.duration + ' sample'" fontSize="11" color="#706978" />
      </StackLayout>
      <GridLayout col="1" columns="18,auto" padding="5 0 5 8" @tap="emit('save')" accessible="true" accessibilityRole="button" :accessibilityLabel="saved ? 'Remove saved rhythm' : 'Save rhythm'" automationText="save-rhythm">
        <IconView :name="saved ? 'check' : 'bookmark'" :ink="saved ? '#FF6685' : '#A29AA9'" width="15" height="15" />
        <Label col="1" :text="saved ? 'Saved' : 'Save'" fontSize="11" :color="saved ? '#FF6685' : '#A29AA9'" marginLeft="4" />
      </GridLayout>
    </GridLayout>
  </GridLayout>
</template>
