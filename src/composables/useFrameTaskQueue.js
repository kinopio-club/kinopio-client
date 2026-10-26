// spreads work over animation frames, so many items reacting to the same change (like crossing a zoom level) don't block a single frame

const tasksPerFrame = 6
const tasks = []
let frame

const processTasks = () => {
  frame = null
  const batch = tasks.splice(0, tasksPerFrame)
  batch.forEach(task => task())
  if (tasks.length) {
    frame = window.requestAnimationFrame(processTasks)
  }
}

export const queueFrameTask = (task) => {
  tasks.push(task)
  if (frame) { return }
  frame = window.requestAnimationFrame(processTasks)
}
