import utils from '@/utils.js'
import consts from '@/consts.js'

const fetchSpacePublicMeta = async (spaceId) => {
  const url = `${consts.apiHost()}/space/${spaceId}/public-meta`
  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      throw { response, status: response.status }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('🚑 fetchSpacePublicMeta', error)
  }
}

export default {
  async space (spaceId, isInvite) {
    const urlParams = new URLSearchParams(window.location.search)
    const logo = 'https://updates.kinopio.club/logo-social-media-avatar.png'
    let path = window.document.location.pathname
    if (!spaceId) {
      const ids = utils.spaceAndCardIdFromPath(path)
      spaceId = ids?.spaceId
    }
    console.log('♥️♥️♥️♥️♥️3', spaceId, path)
    if (!spaceId) { return }
    const meta = await fetchSpacePublicMeta(spaceId)
    if (!meta) { return }
    let name = `${meta.name} – Kinopio`
    if (isInvite) {
      name = `[Invite] ${name}`
    }
    document.title = name
    document.querySelector('meta[property="og:title"]').content = name
    document.querySelector('meta[property="og:image"]').content = meta.previewImage || logo
    const description = 'A space to whiteboard, moodboard, brainstorm, and take notes'
    document.querySelector('meta[property="og:description"]').content = description
    document.querySelector('meta[name="description"]').content = description
    console.log('♥️♥️♥️♥️♥️♥️♥️2', meta)
  }
}
