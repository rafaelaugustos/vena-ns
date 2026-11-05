import { GridLayout, Property } from '@nativescript/core'
import { shape, type Shape } from '@rafaelaugusto/jolt/shapes'

const paths: Record<string, string> = {
  back: 'M16 5 L9 12 L16 19 M9 12 L22 12',
  expand: 'M9 4 L4 4 L4 9 M4 4 L10 10 M15 20 L20 20 L20 15 M20 20 L14 14',
  close: 'M6 6 L18 18 M18 6 L6 18',
  pause: 'M9 5 L9 19 M15 5 L15 19',
  play: 'M8 5 L19 12 L8 19 Z',
  bookmark: 'M6 4 Q6 3 7 3 L17 3 Q18 3 18 4 L18 21 L12 17 L6 21 Z',
  heart: 'M12 20 C8 17 3 13 3 8 C3 2 10 2 12 7 C14 2 21 2 21 8 C21 13 16 17 12 20 Z',
  replay: 'M4 10 A8 8 0 1 1 5 17 M4 4 L4 10 L10 10',
  info: 'M12 3 A9 9 0 1 1 11.99 3 M12 11 L12 17 M12 7 L12 7.4',
  check: 'M4 12 L9 17 L20 6',
  arrow: 'M5 12 L19 12 M13 6 L19 12 L13 18',
  list: 'M5 6 L19 6 M5 12 L19 12 M5 18 L14 18',
}

export class IconView extends GridLayout {
  name = 'heart'
  ink = '#F1EFF2'
  private drawing?: Shape
  constructor() { super(); this.isUserInteractionEnabled = false; this.accessibilityHidden = true }
  override onLoaded() { super.onLoaded(); this.draw() }
  draw() {
    if (!this.isLoaded) return
    this.drawing?.dispose()
    this.drawing = shape(this, { viewBox: [0, 0, 24, 24], d: paths[this.name] ?? paths.heart!, fill: 'transparent', stroke: this.ink, strokeWidth: 1.65, lineCap: 'round', lineJoin: 'round' })
  }
  override onUnloaded() { this.drawing?.dispose(); this.drawing = undefined; super.onUnloaded() }
}
new Property<IconView, string>({ name: 'name', defaultValue: 'heart', valueChanged: target => target.draw() }).register(IconView)
new Property<IconView, string>({ name: 'ink', defaultValue: '#F1EFF2', valueChanged: target => target.draw() }).register(IconView)
