// small word set for randomly generated space names, allows ~49k permutations

import _ from 'lodash'

import cache from '@/cache.js'

export default {
  adjectives () {
    return ['pink', 'carnelian', 'green', 'viridian', 'aquamarine', 'cyan', 'cerulean', 'azure', 'violet', 'purple', 'lavender', 'magenta', 'rainbow', 'iridescent', 'spectrum', 'prism', 'bold', 'vivid', 'pale', 'clear', 'glass', 'translucent', 'misty', 'dark', 'light', 'marble', 'alabaster', 'agate', 'pebble', 'crystal', 'ruby', 'beryl', 'scarlet', 'citrine', 'topaz', 'amber', 'emerald', 'jade', 'lapis', 'sapphire', 'peridot', 'coral', 'tree', 'cherry', 'maple', 'cedar', 'bramble', 'pine', 'grove', 'forest', 'jungle', 'palm', 'mulberry', 'juniper', 'vine', 'ivy', 'rose', 'lily', 'tulip', 'daffodil', 'fuschia', 'hazel', 'lemon', 'blossom', 'bloom', 'iris', 'fern', 'leaf', 'seed', 'flower', 'petal', 'pollen', 'orchid', 'daisy', 'alpine', 'valley', 'glacier', 'thorn', 'stump', 'desert', 'canyon', 'dune', 'oasis', 'mirage', 'well', 'spring', 'meadow', 'field', 'prairie', 'grass', 'tundra', 'island', 'shore', 'sand', 'shell', 'surf', 'wave', 'foam', 'tide', 'lake', 'river', 'brook', 'stream', 'pool', 'pond', 'sun', 'shade', 'rain', 'cloud', 'storm', 'snow', 'wind', 'dawn', 'sunrise', 'morning', 'noon', 'twilight', 'evening', 'sunset', 'midnight', 'night', 'sky', 'star', 'stellar', 'comet', 'nebula', 'solar', 'lunar', 'meteor', 'sprout', 'pear', 'plum', 'kiwi', 'berry', 'apricot', 'peach', 'mango', 'olive', 'ginger', 'root', 'spangle', 'ring', 'band', 'tabby', 'patch', 'glitter', 'glimmer', 'shimmer', 'chocolate', 'vanilla', 'sugar', 'spice', 'cake', 'pie', 'cookie', 'candy', 'caramel', 'round', 'jelly', 'peppermint', 'mint', 'butter', 'fringe', 'quilt', 'truth', 'holy', 'noble', 'brave', 'shy', 'leather', 'fantasy', 'luminous', 'feather', 'sticky', 'cotton', 'rattle', 'silk', 'satin', 'wool', 'linen', 'flax', 'valiant', 'gentle', 'splash', 'summer', 'winter', 'autumn', 'season', 'motley', 'freckle', 'free', 'sheer', 'candle', 'ribbon', 'lace', 'notch', 'shine', 'bubble', 'harvest', 'fluff', 'venom', 'boom', 'slash', 'rune', 'quill', 'love', 'garnet', 'helix', 'cosmic', 'quark', 'quiver', 'holly', 'clover', 'polar', 'regal', 'ripple', 'phantom', 'dew', 'treasure', 'maze', 'curly', 'fortune', 'fate', 'destiny', 'cute', 'slime', 'plume', 'time', 'water', 'rapid', 'road', 'nimble', 'zest', 'fan', 'frill', 'pickle', 'puddle', 'cat', 'dog', 'bird', 'soft', 'neon', 'dandy', 'weed', 'marsh', 'moor', 'puzzle', 'warp', 'luck', 'coffee', 'legend', 'charm', 'bead', 'frost', 'fog', 'veil', 'mirror', 'salt', 'pepper', 'honey', 'glow']
  },
  nouns () {
    return ['crest', 'frill', 'voice', 'eye', 'sight', 'seer', 'singer', 'song', 'fin', 'wing', 'racer', 'runner', 'flier', 'swoop', 'dive', 'diver', 'chest', 'ridge', 'leg', 'legs', 'tail', 'weaver', 'crafter', 'scribe', 'muse', 'tracker', 'healer', 'saver', 'friend', 'cloud', 'forger', 'scale', 'hair', 'braid', 'belly', 'dancer', 'painter', 'drifter', 'knight', 'lady', 'queen', 'prince', 'princess', 'dutchess', 'sage', 'wizard', 'witch', 'panther', 'tiger', 'cougar', 'puma', 'jaguar', 'ocelot', 'lion', 'leopard', 'ferret', 'bear', 'raccoon', 'wolf', 'kitten', 'puppy', 'cub', 'fox', 'coyote', 'zebra', 'antelope', 'gazelle', 'deer', 'elk', 'whale', 'dolphin', 'fish', 'minnow', 'salmon', 'ray', 'otter', 'goose', 'crow', 'raven', 'eagle', 'heron', 'owl', 'stork', 'crane', 'sparrow', 'robin', 'parrot', 'carp', 'iguana', 'oriole', 'toucan', 'bee', 'hornet', 'rabbit', 'bunny', 'hare', 'soarer', 'moth', 'hero', 'chill', 'gem', 'myth', 'elf', 'fairy', 'pixie', 'butterfly', 'wanderer', 'glass', 'crystal', 'lantern', 'cloak', 'bell', 'keeper', 'whimsy', 'quester', 'mouse', 'serpent', 'wyrm', 'thorn', 'rider', 'spirit', 'bat', 'beetle', 'seeker', 'koala', 'kangaroo', 'yak', 'sloth', 'seed', 'goat', 'shift', 'mole', 'llama', 'cap', 'boot', 'drop', 'carpet', 'curtain', 'waterfall', 'river', 'breeze', 'moon', 'rain', 'wind', 'sea', 'morning', 'snow', 'lake', 'sunset', 'pine', 'shadow', 'leaf', 'dawn', 'glitter', 'forest', 'hill', 'meadow', 'glade', 'brook', 'dew', 'dust', 'flower', 'firefly', 'feather', 'grass', 'haze', 'mountain', 'night', 'pond', 'snowflake', 'silence', 'sound', 'sky', 'surf', 'violet', 'water', 'wildflower', 'wave', 'resonance', 'dream', 'frog', 'smoke', 'star']
  },
  nameIsUnique (name) {
    const spaces = cache.getAllSpaces()
    const matchingName = spaces.find(space => {
      return name === space.name
    })
    if (matchingName) {
      return false
    } else {
      return true
    }
  },
  randomUniqueName () {
    let name
    while (true) {
      name = `${_.sample(this.adjectives())}-${_.sample(this.nouns())}`
      if (name && this.nameIsUnique(name)) {
        break
      }
    }
    return name
  },
  remixName (remix) {
    let remixName = `${remix.name}-remix`
    if (this.nameIsUnique(remixName)) {
      return remixName
    } else {
      return `${remixName}-${remix.id}`
    }
  }
}
