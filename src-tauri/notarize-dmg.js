// Notarizes and staples the newest .dmg, because the tauri build only notarizes the .app inside it.
// Runs automatically after `npm run desktop:build`

import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const dmgPaths = [
  path.join(directory, 'target/release/bundle/dmg'),
  path.join(directory, 'target/universal-apple-darwin/release/bundle/dmg')
]

const newestDmg = () => {
  let newest
  dmgPaths.forEach(dmgPath => {
    if (!fs.existsSync(dmgPath)) { return }
    const names = fs.readdirSync(dmgPath).filter(name => name.endsWith('.dmg'))
    names.forEach(name => {
      const file = path.join(dmgPath, name)
      const time = fs.statSync(file).mtimeMs
      if (!newest || time > newest.time) {
        newest = { file, time }
      }
    })
  })
  return newest?.file
}

const isStapled = (file) => {
  try {
    execFileSync('xcrun', ['stapler', 'validate', file], { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

const dmg = newestDmg()
if (!dmg) {
  console.log('🌱 no .dmg to notarize')
  process.exit(0)
}
if (isStapled(dmg)) {
  console.log(`🌱 already notarized ${dmg}`)
  process.exit(0)
}
const { APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID } = process.env
if (!APPLE_ID || !APPLE_PASSWORD || !APPLE_TEAM_ID) {
  console.log('🚒 .dmg not notarized, APPLE_ID, APPLE_PASSWORD, and APPLE_TEAM_ID are needed in .env.local')
  process.exit(0)
}

console.log(`🌱 notarizing ${dmg}`)
const submitArgs = ['notarytool', 'submit', dmg, '--apple-id', APPLE_ID, '--password', APPLE_PASSWORD, '--team-id', APPLE_TEAM_ID, '--wait']
try {
  execFileSync('xcrun', submitArgs, { stdio: 'inherit' })
  execFileSync('xcrun', ['stapler', 'staple', dmg], { stdio: 'inherit' })
} catch (error) {
  console.error('🚒 could not notarize .dmg')
  process.exit(1)
}
console.log(`🌱 notarized ${dmg}`)
