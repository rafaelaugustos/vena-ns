<script setup lang="ts">
import { onBeforeUnmount } from 'nativescript-vue'
import { Utils, isIOS, type EventData, type GridLayout, type View } from '@nativescript/core'
import { motionScope, reducedMotion, type MotionScope } from '@rafaelaugusto/jolt'
import { sessions, type SessionId } from '../domain/sessions'
import IconButton from './IconButton.vue'

defineProps<{ width: number; height: number; saved: SessionId[]; kind: 'library' | 'about' }>()
const emit = defineEmits<{ close: []; select: [id: SessionId]; replay: [] }>()
let scope: MotionScope | undefined
function ready(event: EventData) {
  const root = event.object as GridLayout
  if (isIOS) (root.nativeViewProtected as UIView).accessibilityViewIsModal = true
  scope = motionScope()
  scope.animate(root.getViewById<View>('sheet-panel'), { opacity: [0, 1], y: reducedMotion() ? 0 : [35, 0] }, { type: 'spring', duration: 600, bounce: .08 })
}
onBeforeUnmount(() => scope?.dispose())
</script>

<template>
  <GridLayout :width="width" :height="height" iosOverflowSafeArea="false" @loaded="ready" backgroundColor="rgba(0, 0, 0, 0.65)">
    <GridLayout @tap="emit('close')" accessibilityLabel="Close panel" />
    <StackLayout id="sheet-panel" iosOverflowSafeArea="false" verticalAlignment="bottom" backgroundColor="#19181D" borderRadius="30 30 0 0" padding="24 24 30 24">
      <GridLayout columns="*,44" height="60" marginBottom="23">
        <StackLayout>
          <Label :text="kind === 'library' ? 'Your collection' : 'A study in rhythm'" fontSize="24" fontWeight="500" color="#F2EDF2" />
          <Label :text="kind === 'library' ? 'Small moments, kept close.' : 'VENA  /  001'" fontSize="12" color="#95899B" marginTop="6" />
        </StackLayout>
        <IconButton col="1" icon="close" label="Close panel" @tap="emit('close')" />
      </GridLayout>
      <StackLayout v-if="kind === 'library'">
        <Label v-if="!saved.length" text="Save a rhythm from the heart screen to keep it here. These three samples are ready to explore." fontSize="13" lineHeight="4" textWrap="true" color="#A49AA9" marginBottom="20" />
        <GridLayout v-for="item in sessions" :key="item.id" iosOverflowSafeArea="false" columns="40,*,auto,22" height="84" padding="18 0" borderBottomWidth="1" borderColor="#2B2730" @tap="emit('select', item.id)" accessible="true" accessibilityRole="button" :accessibilityLabel="item.label + ', ' + item.bpm + ' beats per minute sample'" :automationText="'session-' + item.id">
          <IconView :name="saved.includes(item.id) ? 'bookmark' : 'heart'" :ink="saved.includes(item.id) ? '#FF5277' : '#6C5C70'" width="22" height="22" horizontalAlignment="left" />
          <StackLayout col="1"><Label :text="item.label" fontSize="16" color="#EFE8F0" /><Label :text="item.time + '  ·  Sample session'" fontSize="10" color="#807486" marginTop="4" /></StackLayout>
          <Label col="2" :text="item.bpm" fontSize="24" fontWeight="300" color="#E6DDE8" marginRight="13" />
          <IconView col="3" name="arrow" width="16" height="16" ink="#76677D" />
        </GridLayout>
      </StackLayout>
      <StackLayout v-else>
        <Label text="Some things are better felt." fontSize="18" color="#EAE0EB" marginBottom="13" />
        <Label text="Each heartbeat sends a flash of light through the body. Click or tap for another. Move the pointer to part the body's particles while the heart stays whole." fontSize="14" color="#A69AAB" lineHeight="5" textWrap="true" />
        <Label text="These are sample rhythms. Vena does not measure heart rate or provide a medical reading." fontSize="12" color="#827589" lineHeight="4" textWrap="true" marginTop="24" />
        <Label text="Heart: BodyParts3D, © The Database Center for Life Science. CC BY 4.0. Adapted to a point cloud from OrganUI’s prepared model. Torso: MakeHuman, CC0." fontSize="10" color="#827589" textWrap="true" marginTop="16" @tap="Utils.openUrl('https://creativecommons.org/licenses/by/4.0/')" accessibilityLabel="Anatomy attribution and license" />
        <GridLayout columns="24,*" height="56" iosOverflowSafeArea="false" backgroundColor="#2B1722" borderRadius="18" padding="18" marginTop="26" @tap="emit('replay')" accessible="true" accessibilityRole="button" accessibilityLabel="Replay opening">
          <IconView name="replay" ink="#FF6685" width="20" height="20" />
          <Label col="1" text="See the opening again" fontSize="13" color="#FFD3DD" marginLeft="10" />
        </GridLayout>
      </StackLayout>
    </StackLayout>
  </GridLayout>
</template>
