// Compiles icon-composer.icon into icons/Assets.car, which holds the light, dark, clear, and tinted
// app icons that macOS 26 and newer switch between. Runs automatically before `npm run desktop:build`,
// and only compiles if the icon has changed since Assets.car was made. Needs Xcode 26 or newer.
//
// Tauri can compile .icon files itself when they're listed in tauri.conf.json, but that fails here with
// `actool did not generate Assets.car file`, so the compiled file is committed and bundled as a resource instead.

import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const directory = path.dirname(fileURLToPath(import.meta.url))
// the icon's name inside Assets.car comes from the file name, and has to match CFBundleIconName in Info.plist
const iconName = 'Icon'
const sourcePath = path.join(directory, 'icon-composer.icon')
const assetsPath = path.join(directory, 'icons/Assets.car')

// compiling never makes the same file twice, so skipping it when nothing changed keeps Assets.car out of git diffs
const newestModifiedTime = (folderPath) => {
  let newest = fs.statSync(folderPath).mtimeMs
  fs.readdirSync(folderPath, { withFileTypes: true }).forEach(entry => {
    const entryPath = path.join(folderPath, entry.name)
    let time = fs.statSync(entryPath).mtimeMs
    if (entry.isDirectory()) {
      time = newestModifiedTime(entryPath)
    }
    newest = Math.max(newest, time)
  })
  return newest
}
if (fs.existsSync(assetsPath)) {
  const isUpToDate = fs.statSync(assetsPath).mtimeMs >= newestModifiedTime(sourcePath)
  if (isUpToDate) {
    console.log('🌱 icons/Assets.car is up to date')
    process.exit(0)
  }
}

const temporaryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'kinopio-icon-'))
const iconPath = path.join(temporaryPath, `${iconName}.icon`)
const outputPath = path.join(temporaryPath, 'out')
fs.cpSync(sourcePath, iconPath, { recursive: true })
fs.mkdirSync(outputPath)

const args = [
  'actool', iconPath,
  '--compile', outputPath,
  '--output-format', 'human-readable-text',
  '--notices', '--warnings', '--errors',
  '--output-partial-info-plist', path.join(outputPath, 'info.plist'),
  '--app-icon', iconName,
  '--include-all-app-icons',
  '--enable-on-demand-resources', 'NO',
  '--development-region', 'en',
  '--target-device', 'mac',
  '--minimum-deployment-target', '26.0',
  '--platform', 'macosx'
]
let output = ''
try {
  output = execFileSync('xcrun', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
} catch (error) {
  output = String(error.stdout)
}
const compiledPath = path.join(outputPath, 'Assets.car')
if (!fs.existsSync(compiledPath)) {
  console.error(output)
  console.error('🚒 could not compile icon-composer.icon. If the error is "Bad file descriptor", run `pkill -x ibtoold` and try again')
  process.exit(1)
}
fs.copyFileSync(compiledPath, assetsPath)
fs.rmSync(temporaryPath, { recursive: true, force: true })
console.log('🌱 compiled icon-composer.icon to src-tauri/icons/Assets.car')
