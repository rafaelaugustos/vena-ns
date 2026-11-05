import { mkdirSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, 'resources/vena-icon.png')
const info = { author: 'xcode', version: 1 }
const raster = (destination, size) => execFileSync('magick', [source, '-resize', `${size}x${size}`, '-alpha', 'off', `PNG24:${destination}`])
const catalog = resolve(root, 'App_Resources/iOS/Assets.xcassets')
const icons = resolve(catalog, 'AppIcon.appiconset')
mkdirSync(icons, { recursive: true })
writeFileSync(resolve(catalog, 'Contents.json'), JSON.stringify({ info }, null, 2))
const images = []
for (const [idiom, points, scales] of [
  ['iphone', 20, [2, 3]], ['iphone', 29, [2, 3]], ['iphone', 40, [2, 3]], ['iphone', 60, [2, 3]],
  ['ipad', 20, [1, 2]], ['ipad', 29, [1, 2]], ['ipad', 40, [1, 2]], ['ipad', 76, [1, 2]], ['ipad', 83.5, [2]], ['ios-marketing', 1024, [1]],
]) {
  for (const scale of scales) {
    const filename = `icon-${points * scale}.png`
    raster(resolve(icons, filename), points * scale)
    images.push({ idiom, size: `${points}x${points}`, scale: `${scale}x`, filename })
  }
}
writeFileSync(resolve(icons, 'Contents.json'), JSON.stringify({ images, info }, null, 2))
const launch = resolve(catalog, 'LaunchMark.imageset')
mkdirSync(launch, { recursive: true })
raster(resolve(launch, 'mark.png'), 720)
writeFileSync(resolve(launch, 'Contents.json'), JSON.stringify({ images: [{ idiom: 'universal', scale: '3x', filename: 'mark.png' }], info }, null, 2))
const res = resolve(root, 'App_Resources/Android/src/main/res')
for (const [density, size] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  const folder = resolve(res, `mipmap-${density}`)
  mkdirSync(folder, { recursive: true })
  raster(resolve(folder, 'ic_launcher.png'), size)
  raster(resolve(folder, 'ic_foreground.png'), size * 108 / 48)
}
mkdirSync(resolve(res, 'mipmap-anydpi-v26'), { recursive: true })
writeFileSync(resolve(res, 'mipmap-anydpi-v26/ic_launcher.xml'), '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/icon_background"/><foreground android:drawable="@mipmap/ic_foreground"/></adaptive-icon>\n')
writeFileSync(resolve(res, 'values/icon-colors.xml'), '<resources><color name="icon_background">#000000</color></resources>\n')
console.log('Exported Vena icons and native launch artwork.')
