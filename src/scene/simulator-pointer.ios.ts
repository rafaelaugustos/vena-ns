import { Application, File, knownFolders, type View } from '@nativescript/core'

/** Development input from scripts/preview-pointer.swift. Never enabled on a device. */
export function observeSimulatorPointer(view: View, callback: (x: number, y: number, active: boolean) => void) {
  if (!__DEV__ || !NSProcessInfo.processInfo.environment.objectForKey('SIMULATOR_UDID')) return () => {}
  const directory = knownFolders.temp().path
  const input = `${directory}/vena-pointer.json`
  const viewport = File.fromPath(`${directory}/vena-viewport.json`)
  let previousViewport = '', previousInput = '', wasActive = false, backgrounded = false
  const suspend = () => { backgrounded = true; if (wasActive) callback(0, 0, false); wasActive = false }
  const resume = () => { backgrounded = false }
  Application.on(Application.suspendEvent, suspend)
  Application.on(Application.resumeEvent, resume)
  const timer = setInterval(() => {
    if (backgrounded || !view.isLoaded) return
    const native = view.nativeViewProtected as UIView
    const anchor = view.page?.getViewById<View>('scene-anchor')?.nativeViewProtected as UIView | undefined
    if (!native.window || !anchor) return
    const rect = (v: UIView) => {
      const frame = v.convertRectToView(v.bounds, native.window)
      return { x: frame.origin.x, y: frame.origin.y, width: frame.size.width, height: frame.size.height }
    }
    const layout = JSON.stringify({ scene: rect(native), anchor: rect(anchor) })
    if (layout !== previousViewport) { viewport.writeTextSync(layout); previousViewport = layout }
    if (!File.exists(input)) {
      if (wasActive) callback(0, 0, false)
      wasActive = false; previousInput = ''
      return
    }
    const text = NSString.stringWithContentsOfFileEncodingError(input, NSUTF8StringEncoding) as unknown as string | null
    if (!text) return
    try {
      const [x, y, active, timestamp] = JSON.parse(String(text))
      const fresh = Number.isFinite(timestamp) && Date.now() - timestamp < 250
      const valid = Number.isFinite(x) && Number.isFinite(y)
      if (!fresh || !valid) { if (wasActive) callback(0, 0, false); wasActive = false; previousInput = ''; return }
      const position = JSON.stringify([x, y, Boolean(active)])
      if (position !== previousInput) { callback(x, y, Boolean(active)); previousInput = position; wasActive = Boolean(active) }
    } catch { /* Ignore incomplete input from a stopped helper. */ }
  }, 1000 / 30)
  return () => {
    clearInterval(timer)
    Application.off(Application.suspendEvent, suspend)
    Application.off(Application.resumeEvent, resume)
  }
}
