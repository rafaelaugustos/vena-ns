<script setup lang="ts">
import { onBeforeUnmount } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { motionScope, type MotionScope } from '@rafaelaugusto/jolt'

withDefaults(defineProps<{ icon: string; label: string; active?: boolean; quiet?: boolean }>(), { active: false, quiet: false })
const emit = defineEmits<{ tap: [] }>()
let motion: MotionScope | undefined
function loaded(event: EventData) {
  motion?.dispose(); motion = motionScope()
  motion.press(event.object as View, { scale: .88 })
}
onBeforeUnmount(() => motion?.dispose())
</script>

<template>
  <GridLayout width="44" height="44" borderRadius="22" :backgroundColor="quiet ? 'transparent' : active ? '#35101D' : '#151519'"
    @loaded="loaded" @tap="emit('tap')" accessible="true" accessibilityRole="button" :accessibilityLabel="label" :automationText="label">
    <IconView :name="icon" :ink="active ? '#FF5277' : '#E9E7EC'" width="21" height="21" />
  </GridLayout>
</template>
