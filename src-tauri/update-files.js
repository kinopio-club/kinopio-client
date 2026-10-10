// Collects the files for an app update into src-tauri/target/update, ready to upload to the updates bucket.
// Runs automatically after `npm run desktop:build`

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const updatesUrl = 'https://updates.kinopio.club/desktop'
const directory = path.dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(fs.readFileSync(path.join(directory, 'tauri.conf.json'), 'utf8'))
const version = config.version
const archiveName = 'Kinopio.app.tar.gz'
const universalPath = path.join(directory, 'target/universal-apple-darwin/release/bundle/macos')
const singleArchitecturePath = path.join(directory, 'target/release/bundle/macos')

// uses whichever build is newest
const builds = [
  { path: universalPath, platforms: ['darwin-aarch64', 'darwin-x86_64'] },
  { path: singleArchitecturePath, platforms: [`darwin-${process.arch.replace('arm64', 'aarch64').replace('x64', 'x86_64')}`] }
]
let build
builds.forEach(item => {
  const archivePath = path.join(item.path, archiveName)
  if (!fs.existsSync(archivePath)) { return }
  item.time = fs.statSync(archivePath).mtimeMs
  if (!build || item.time > build.time) {
    build = item
  }
})
if (!build) {
  console.error(`🚒 ${archiveName} not found, build the app first with TAURI_SIGNING_PRIVATE_KEY set`)
  process.exit(1)
}
const signaturePath = path.join(build.path, `${archiveName}.sig`)
if (!fs.existsSync(signaturePath)) {
  console.error(`🚒 ${archiveName}.sig not found, build the app with TAURI_SIGNING_PRIVATE_KEY set`)
  process.exit(1)
}

// a build without the key still makes a new archive, but leaves the signature from the previous build
const signatureIsStale = fs.statSync(signaturePath).mtimeMs < build.time
if (signatureIsStale) {
  console.error(`🚒 ${archiveName}.sig is older than ${archiveName}, rebuild the app with TAURI_SIGNING_PRIVATE_KEY set`)
  process.exit(1)
}

const outputPath = path.join(directory, 'target/update')
const versionedArchiveName = `Kinopio-${version}.app.tar.gz`
const signature = fs.readFileSync(signaturePath, 'utf8')
const latest = {
  version,
  pub_date: new Date().toISOString(),
  platforms: {}
}
build.platforms.forEach(platform => {
  latest.platforms[platform] = {
    signature,
    url: `${updatesUrl}/${versionedArchiveName}`
  }
})
fs.rmSync(outputPath, { recursive: true, force: true })
fs.mkdirSync(outputPath, { recursive: true })
fs.copyFileSync(path.join(build.path, archiveName), path.join(outputPath, versionedArchiveName))
fs.writeFileSync(path.join(outputPath, 'latest.json'), JSON.stringify(latest, null, 2))

console.log(`🌱 update files for ${version} (${build.platforms.join(', ')}) are in ${outputPath}`)
console.log(`upload ${versionedArchiveName} first, then latest.json, to ${updatesUrl}/`)
