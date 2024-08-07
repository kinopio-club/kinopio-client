import utils from '@/utils.js'
import consts from '@/consts.js'

const logo = 'https://updates.kinopio.club/logo-social-media-avatar.png'

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
const fetchTeamPublicMeta = async (teamId) => {
  const url = `${consts.apiHost()}/team/${teamId}/public-meta`
  try {
    const response = await fetch(url)
    if (response.status !== 200) {
      throw { response, status: response.status }
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.warn('🚑 fetchTeamPublicMeta', error)
  }
}

export default {
  async space ({ spaceId, isSpaceInvite }) {
    let path = window.document.location.pathname
    if (!spaceId) {
      const ids = utils.spaceAndCardIdFromPath(path)
      spaceId = ids?.spaceId
    }
    if (!spaceId) { return }
    const meta = await fetchSpacePublicMeta(spaceId)
    if (!meta) { return }
    let name = `${meta.name} – Kinopio`
    if (isSpaceInvite) {
      name = `[Invite] ${name}`
    }
    let description = 'A space to whiteboard, moodboard, brainstorm, and take notes'
    if (meta.privacy === 'private') {
      description = `[Private] ${description}`
    }
    document.title = name
    document.querySelector('meta[property="og:title"]').content = name
    document.querySelector('meta[property="og:image"]').content = meta.previewImage || logo
    document.querySelector('meta[property="og:description"]').content = description
    document.querySelector('meta[name="description"]').content = description
  },
  async team ({ teamId, isTeamInvite }) {
    const meta = await fetchTeamPublicMeta(teamId)
    let name = `${meta.name} – Kinopio Team`
    if (isTeamInvite) {
      name = `[Invite] ${name}`
    }
    let description = 'Join.. team , collaborate on spaces A space to whiteboard, moodboard, brainstorm, and take notes'
    document.title = name
    document.querySelector('meta[property="og:title"]').content = name
    document.querySelector('meta[property="og:image"]').content = logo
    document.querySelector('meta[property="og:description"]').content = description
    document.querySelector('meta[name="description"]').content = description
  }
}
