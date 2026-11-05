import { AbsoluteLayout, GridLayout, isIOS } from '@nativescript/core'
import { motionScope, onReducedMotion, reducedMotion, type MotionScope } from '@rafaelaugusto/jolt'
import { shape, type Shape } from '@rafaelaugusto/jolt/shapes'
import { pulseAt } from '../domain/sessions'

const dot = (x: number, y: number, r: number) => `M${(x - r).toFixed(2)} ${y.toFixed(2)} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 `

export class SignalView extends GridLayout {
  private owner?: MotionScope
  private playback?: MotionScope
  private drawings: Shape[] = []
  private strip?: GridLayout
  private period = 140
  private bpm = 72
  private running = true
  private dimensions = ''

  constructor() { super(); this.on('layoutChanged', this.draw); this.isUserInteractionEnabled = false; this.accessibilityHidden = true; this.clipToBounds = true }
  override onLoaded() { super.onLoaded(); this.owner = motionScope(); this.owner.use(() => onReducedMotion(this.play)); this.draw() }
  override onLayout(left: number, top: number, right: number, bottom: number) {
    super.onLayout(left, top, right, bottom)
    if (isIOS) (this.nativeViewProtected as UIView).clipsToBounds = true
  }
  private draw = () => { queueMicrotask(this.render) }
  private render = () => {
    const { width, height } = this.getActualSize()
    if (!this.isLoaded || width <= 0 || height <= 0 || this.dimensions === `${width}:${height}`) return
    this.dimensions = `${width}:${height}`
    this.playback?.dispose(); this.drawings.forEach(drawing => drawing.dispose()); this.drawings = []; this.removeChildren()
    const canvas = new AbsoluteLayout(); canvas.width = width; canvas.height = height; canvas.clipToBounds = true; this.addChild(canvas)
    const columns = 37, rows = 7, dx = width / (columns - 1), dy = (height - 8) / (rows - 1)
    this.period = dx * 20
    const grid: string[] = []
    for (let x = 0; x < columns; x++) for (let y = 0; y < rows; y++) grid.push(dot(x * dx, 4 + y * dy, 1.4))
    this.paint(canvas, grid, width, height, '#302A37')
    const strip = this.strip = new GridLayout(); strip.width = width + this.period * 2; strip.height = height; canvas.addChild(strip)
    const bright: string[] = [], dim: string[] = []
    for (let col = 0; col < columns + 40; col++) {
      const signal = pulseAt(col / 20)
      const center = 4 - signal * 4
      for (let row = 0; row < rows; row++) {
        const distance = Math.abs(row - center)
        if (distance < .57) bright.push(dot(col * dx, 4 + row * dy, 2.4))
        else if (distance < 1.25) dim.push(dot(col * dx, 4 + row * dy, 1.8))
      }
    }
    this.paint(strip, dim, width + this.period * 2, height, '#66253C')
    this.paint(strip, bright, width + this.period * 2, height, '#FF4067')
    this.play()
  }
  private paint(parent: GridLayout | AbsoluteLayout, dots: string[], width: number, height: number, fill: string) {
    // RC.11 allows 256 commands. Arc normalization can use up to seven per dot.
    for (let offset = 0; offset < dots.length; offset += 32) {
      const layer = new GridLayout(); layer.width = width; layer.height = height
      parent.addChild(layer)
      this.drawings.push(shape(layer, { viewBox: [0, 0, width, height], d: dots.slice(offset, offset + 32).join(''), fill, strokeWidth: 0 }))
    }
  }
  private play = () => {
    this.playback?.dispose(); this.playback = motionScope()
    if (this.strip && this.running && !reducedMotion()) this.playback.animate(this.strip, { x: [0, -this.period] }, { duration: 60000 / this.bpm * 1.6, repeat: Infinity, ease: 'linear' })
  }
  setTempo(bpm: number) { this.bpm = bpm; this.play() }
  setRunning(running: boolean) { this.running = running; this.play() }
  override onUnloaded() {
    this.owner?.dispose(); this.playback?.dispose(); this.drawings.forEach(drawing => drawing.dispose()); this.drawings = []
    this.dimensions = ''; this.removeChildren(); super.onUnloaded()
  }
}
