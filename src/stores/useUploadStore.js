import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'

import { nanoid } from 'nanoid'

export const useUploadStore = defineStore('upload', {
  state: () => ({
    pendingUploads: []
  }),
  actions: {
    hasPendingUploadForCardId (id) {
      return this.pendingUploads.some(item => item.cardId === id)
    },
    s3Policy (value) {
      utils.typeCheck({ value, type: 'object', origin: 's3Policy' })
      this.s3Policy = value
    },
    addPendingUpload (upload) { // key, fileName, spaceId
      upload.percentComplete = 0
      this.pendingUploads = this.pendingUploads.filter(item => (item.cardId !== upload.cardId || item.spaceId === upload.spaceId))
      this.pendingUploads.push(upload)
    },
    updatePendingUpload ({ cardId, spaceId, percentComplete, imageDataUrl }) {
      this.pendingUploads = this.pendingUploads.map(item => {
        if (percentComplete && item.cardId === cardId) {
          item.percentComplete = percentComplete
        }
        if (imageDataUrl && item.cardId === cardId) {
          item.imageDataUrl = imageDataUrl
        }
        return item
      })
      this.pendingUploads = this.pendingUploads.filter(item => item.percentComplete !== 100)
    },
    removePendingUpload ({ cardId, spaceId, boxId }) {
      this.pendingUploads = this.pendingUploads.filter(item => (item.cardId !== cardId || item.spaceId === spaceId || item.boxId !== boxId))
    },

    checkIfFileTooBig (file) {
      const userStore = useUserStore()
      const userIsUpgraded = userStore.isUpgraded
      const isFileTooBig = utils.isFileTooBig({ file, userIsUpgraded })
      if (isFileTooBig) {
        throw {
          type: 'sizeLimit',
          message: 'To upload files over 5mb, upgrade for unlimited size uploads'
        }
      }
    },
    addImageDataUrl ({ file, cardId, spaceId }) {
      const isImage = file.type.includes('image')
      if (!isImage) { return null }
      this.updatePendingUpload({
        cardId,
        spaceId,
        imageDataUrl: URL.createObjectURL(file)
      })
    },
    async uploadFile ({ file, cardId, spaceId, boxId }) {
      const broadcastStore = useBroadcastStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const uploadId = nanoid()
      const fileName = utils.normalizeFileUrl(file.name)
      const id = cardId || spaceId || boxId
      const key = `${id}/${fileName}`
      this.checkIfFileTooBig(file)
      // add presignedPostData to upload
      let presignedPostData
      if (file.presignedPostData) {
        presignedPostData = file.presignedPostData
      } else {
        presignedPostData = await apiStore.createPresignedPost({ key, type: file.type })
      }
      const formData = new FormData()
      Object.keys(presignedPostData.fields).forEach(key => {
        formData.append(key, presignedPostData.fields[key])
      })
      formData.append('file', file)
      // upload
      return new Promise(resolve => {
        const request = new XMLHttpRequest()
        // progress
        request.upload.onprogress = (event) => {
          const percentComplete = event.loaded / event.total * 100
          const percentCompleteDisplay = Math.floor(percentComplete)
          console.info(`🛫 Uploading ${fileName} for ${id}, percent: ${percentCompleteDisplay}`)
          const updates = {
            cardId,
            spaceId,
            boxId,
            percentComplete: percentCompleteDisplay,
            userId: userStore.id,
            id: uploadId
          }
          this.updatePendingUpload(updates)
          broadcastStore.updateStore({ updates, type: 'updateRemotePendingUploads' }, { root: true })
          // end
          if (percentComplete >= 100) {
            const complete = {
              cardId,
              spaceId,
              boxId,
              url: `${consts.cdnHost}/${key}`
            }
            console.info('🛬 Upload completed or failed', event, complete)
            store.commit('triggerUploadComplete', complete, { root: true })
            this.removePendingUpload({ cardId, spaceId, boxId })
            resolve(request.response)
            nextTick(() => {
              nextTick(() => {
                const card = { id: cardId }
                store.dispatch('currentCards/updateNameRemovePlaceholders', cardId, { root: true })
              })
            })
          }
        }
        // start
        request.open('POST', presignedPostData.url)
        request.send(formData)
        this.addPendingUpload({ key, fileName, cardId, spaceId, boxId })
        this.addImageDataUrl({ file, cardId, spaceId, boxId })
      })
    },
    async addCardsAndUploadFiles ({ files, event, position }) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      position = position || utils.cursorPositionInSpace(event)
      store.dispatch('currentUser/notifyReadOnly', position, { root: true })
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) {
        store.commit('addNotification', { message: 'You can only upload files on spaces you can edit', type: 'info' }, { root: true })
        return
      }
      const cardIds = []
      if (!userStore.getUserIsSignedIn) {
        store.commit('addNotificationWithPosition', { message: 'Sign Up or In', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
        store.commit('addNotification', { message: 'To upload files, you need to Sign Up or In', type: 'info' }, { root: true })
        return
      }
      // check if outside space
      const isOutsideSpace = utils.isPositionOutsideOfSpace(position)
      if (isOutsideSpace) {
        position = utils.cursorPositionInPage(event)
        store.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' }, { root: true })
        return
      }
      // check sizeLimit
      const userIsUpgraded = userStore.isUpgraded
      const filesTooBig = files.find(file => {
        return utils.isFileTooBig({ file, userIsUpgraded })
      })
      if (filesTooBig) {
        store.commit('addNotificationWithPosition', { message: 'Too Big', position, type: 'danger', layer: 'space', icon: 'cancel' }, { root: true })
        store.commit('addNotification', { message: 'To upload files over 5mb, upgrade for unlimited size uploads', type: 'danger' }, { root: true })
        return
      }
      // add cards
      const filesPostData = []
      for (const [index, file] of files.entries()) {
        const positionOffset = 20
        const cardId = nanoid()
        cardIds.push(cardId)
        const newCard = {
          position: {
            x: position.x + (index * positionOffset),
            y: position.y + (index * positionOffset)
          },
          name: consts.uploadPlaceholder,
          id: cardId
        }
        store.dispatch('currentCards/add', { card: newCard }, { root: true })
        const fileName = utils.normalizeFileUrl(file.name)
        const key = `${cardIds[index]}/${fileName}`
        filesPostData.push({
          key,
          type: file.type
        })
        console.info('🍡 addCardsAndUploadFiles', file.type, file)
      }
      // add presignedPostData to files
      const multiplePresignedPostData = await apiStore.createMultiplePresignedPosts({ files: filesPostData })
      files.map((file, index) => {
        file.presignedPostData = multiplePresignedPostData[index]
      })
      // upload files
      await Promise.all(files.map(async (file, index) => {
        const cardId = cardIds[index]
        try {
          await this.uploadFile({ file, cardId })
        } catch (error) {
          console.error('🚒', error)
          store.commit('addNotificationWithPosition', { message: error.message, position, type: 'danger', layer: 'space', icon: 'cancel' }, { root: true })
          store.commit('addNotification', { message: error.message, type: 'danger' }, { root: true })
        }
      }))
      // remove placeholders from card names
      files.forEach((file, index) => {
        const cardId = cardIds[index]
        store.dispatch('currentCards/updateNameRemovePlaceholders', cardId, { root: true })
      })
    }

  }
})
