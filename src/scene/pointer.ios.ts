import type { View } from '@nativescript/core';
import { observeSimulatorPointer } from './simulator-pointer.ios';

@NativeClass()
class HoverTarget extends NSObject {
  static ObjCExposedMethods = {
    moved: { returns: interop.types.void, params: [UIHoverGestureRecognizer] },
    tapped: { returns: interop.types.void, params: [UITapGestureRecognizer] },
  }
  owner?: WeakRef<View>
  callback?: (x: number, y: number, active: boolean) => void
  onTap?: (x: number, y: number) => void

  moved(recognizer: UIHoverGestureRecognizer) {
    const view = this.owner?.deref()?.nativeViewProtected as UIView | undefined
    if (!view) return
    const point = recognizer.locationInView(view)
    const active = recognizer.state === UIGestureRecognizerState.Began || recognizer.state === UIGestureRecognizerState.Changed
    this.callback?.(point.x, point.y, active)
  }

  tapped(recognizer: UITapGestureRecognizer) {
    const view = this.owner?.deref()?.nativeViewProtected as UIView | undefined
    if (!view || recognizer.state !== UIGestureRecognizerState.Ended) return
    const point = recognizer.locationInView(view)
    this.onTap?.(point.x, point.y)
  }
}

/** Hover moves the surface; a separate tap sends a wave through the body. */
export function observePointer(view: View, callback: (x: number, y: number, active: boolean) => void, onTap: (x: number, y: number) => void) {
  const target = HoverTarget.new() as HoverTarget
  target.owner = new WeakRef(view)
  target.callback = callback
  target.onTap = onTap
  const recognizer = UIHoverGestureRecognizer.alloc().initWithTargetAction(target, 'moved')
  const tap = UITapGestureRecognizer.alloc().initWithTargetAction(target, 'tapped')
  const native = view.nativeViewProtected as UIView
  native.addGestureRecognizer(recognizer)
  native.addGestureRecognizer(tap)
  const stopPreview = observeSimulatorPointer(view, callback)
  return () => {
    stopPreview()
    native.removeGestureRecognizer(recognizer)
    native.removeGestureRecognizer(tap)
    target.callback = undefined
    target.onTap = undefined
    target.owner = undefined
  }
}
