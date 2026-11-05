import { View } from '@nativescript/core'

/** Runtime implementations are selected by NativeScript's platform resolver. */
export class HeartScene extends View {
  setTempo(_bpm: number) {}
  setRunning(_running: boolean) {}
  setReveal(_progress: number, _duration = 0) {}
  setFocus(_focused: boolean) {}
  tapAt(_x: number, _y: number) {}
  pointerAt(_x: number, _y: number, _active: boolean) {}
  setInteractionEnabled(_enabled: boolean) {}
  resetPose() {}
}
