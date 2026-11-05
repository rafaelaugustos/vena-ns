import type { View } from '@nativescript/core';
import { observeSimulatorPointer } from './simulator-pointer.ios';

@NativeClass()
class HoverTarget extends NSObject {
  static ObjCExposedMethods = { moved: { returns: interop.types.void, params: [UIHoverGestureRecognizer] } }
  owner?: WeakRef<View>
  callback?: (x: number, y: number, active: boolean) => void

  moved(recognizer: UIHoverGestureRecognizer) {
    const view = this.owner?.deref()?.nativeViewProtected as UIView | undefined
    if (!view) return
    const point = recognizer.locationInView(view)
    const active = recognizer.state === UIGestureRecognizerState.Began || recognizer.state === UIGestureRecognizerState.Changed
    this.callback?.(point.x, point.y, active)
  }
}

/** Native pointer motion; deliberately independent of touch and button presses. */
export function observePointer(view: View, callback: (x: number, y: number, active: boolean) => void) {
  const target = HoverTarget.new() as HoverTarget
  target.owner = new WeakRef(view)
  target.callback = callback
  const recognizer = UIHoverGestureRecognizer.alloc().initWithTargetAction(target, 'moved')
  const native = view.nativeViewProtected as UIView
  native.addGestureRecognizer(recognizer)
  const stopPreview = observeSimulatorPointer(view, callback)
  return () => {
    stopPreview()
    native.removeGestureRecognizer(recognizer)
    target.callback = undefined
    target.owner = undefined
  }
}
