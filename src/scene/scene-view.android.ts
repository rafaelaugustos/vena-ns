import { AbsoluteLayout, GridLayout, Image, ImageSource } from '@nativescript/core'
import { motionScope, onReducedMotion, reducedMotion, type MotionScope } from '@rafaelaugusto/jolt'
import { createAnatomy, type PointCloud } from './anatomy'

/** Android renders the same cloud to native bitmaps and moves the layers with Jolt. */
export class HeartScene extends GridLayout {
  private scope?: MotionScope
  private pulse?: MotionScope
  private body?: Image
  private heart?: Image
  private plane?: AbsoluteLayout
  private bpm = 72
  private running = true
  private reveal = 0
  private focused = true
  private dimensions = ''

  constructor() { super(); this.on('layoutChanged', this.layoutScene) }
  override onLoaded() {
    super.onLoaded()
    this.scope = motionScope()
    this.scope.use(() => onReducedMotion(this.play))
    this.layoutScene()
  }
  private layoutScene = () => {
    const { width, height } = this.getActualSize()
    if (!this.isLoaded || width <= 0 || height <= 0 || this.dimensions === `${width}:${height}`) return
    this.dimensions = `${width}:${height}`
    this.removeChildren()
    const anatomy = createAnatomy()
    const plane = this.plane = new AbsoluteLayout()
    plane.width = width; plane.height = height
    this.addChild(plane)
    const draw = (cloud: PointCloud, red: boolean) => {
      const scale = 2
      const bitmap = android.graphics.Bitmap.createBitmap(Math.ceil(width * scale), Math.ceil(height * scale), android.graphics.Bitmap.Config.ARGB_8888)
      const canvas = new android.graphics.Canvas(bitmap)
      const paint = new android.graphics.Paint(3)
      for (let i = 0; i < cloud.positions.length / 3; i++) {
        const x = cloud.positions[i * 3]!, y = cloud.positions[i * 3 + 1]!, z = cloud.positions[i * 3 + 2]!
        const c = cloud.colors.slice(i * 4, i * 4 + 4)
        paint.setARGB(Math.round(c[3]! * 255 * (z > 0 ? 1 : .35)), Math.round(c[0]! * 255), Math.round(c[1]! * 255), Math.round(c[2]! * 255))
        canvas.drawCircle((width / 2 + x * height / 4.06) * scale, (height / 2 - (y - .1) * height / 4.06) * scale, red ? 1.25 : .85, paint)
      }
      const image = new Image()
      image.imageSource = new ImageSource(bitmap)
      image.width = width; image.height = height; image.stretch = 'fill'
      image.isUserInteractionEnabled = false
      plane.addChild(image)
      return image
    }
    this.body = draw(anatomy.body, false)
    this.heart = draw(anatomy.heart, true)
    this.heart.originX = .5 + .2 * height / 4.06 / width
    this.heart.originY = .5
    this.setReveal(this.reveal)
    this.setFocus(this.focused)
    this.play()
    this.notify({ eventName: 'sceneReady', object: this })
  }
  private play = () => {
    this.pulse?.dispose(); this.pulse = motionScope()
    if (this.heart && this.running && !reducedMotion()) this.pulse.animate(this.heart, { scale: [1, 1.09, 1, 1.045, 1, 1] }, { duration: 60000 / this.bpm, times: [0, .14, .24, .34, .45, 1], repeat: Infinity, ease: 'easeInOut' })
  }
  setTempo(bpm: number) { this.bpm = bpm; this.play() }
  setRunning(running: boolean) { this.running = running; this.play() }
  setReveal(progress: number, duration = 0) {
    this.reveal = progress
    if (this.plane) this.scope?.animate(this.plane, { opacity: progress, scale: progress ? 1 : 1.35 }, { duration })
  }
  setFocus(focused: boolean) {
    this.focused = focused
    if (this.body) this.scope?.animate(this.body, { opacity: focused ? .08 : 1 }, { duration: 800 })
    if (this.plane) this.scope?.animate(this.plane, { scale: focused ? 1.55 : 1 }, { type: 'spring', duration: 950, bounce: .05 })
  }
  touchAt(x: number, y: number, active: boolean) {
    if (!this.plane || reducedMotion()) return
    const size = this.getActualSize()
    this.scope?.animate(this.plane, { rotateY: active ? (x / size.width - .5) * 24 : 0, rotateX: active ? (y / size.height - .5) * -10 : 0 }, 'smooth')
  }
  resetPose() { this.touchAt(0, 0, false) }
  override onUnloaded() {
    this.pulse?.dispose(); this.scope?.dispose(); this.scope = undefined
    this.dimensions = ''; this.removeChildren()
    super.onUnloaded()
  }
}
