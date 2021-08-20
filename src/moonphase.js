import dayjs from 'dayjs'

// adapted from https://github.com/t1mwillis/simple-moonphase-js/blob/master/index.js

export default (date) => {
  if (!date) {
    date = dayjs(new Date())
  }
  const Moon = {
    phases: [
      { name: 'new-moon', emoji: '🌑' },
      { name: 'waxing-crescent', emoji: '🌒' },
      { name: 'waxing-quarter', emoji: '🌓' },
      { name: 'waxing-gibbous', emoji: '🌔' },
      { name: 'full-moon', emoji: '🌕' },
      { name: 'waning-gibbous', emoji: '🌖' },
      { name: 'waning-quarter', emoji: '🌗' },
      { name: 'waning-crescent', emoji: '🌘' }
    ],
    phase: function (year, month, day) {
      let c = 0
      let e = 0
      let jd = 0
      let phase = 0

      if (month < 3) {
        year--
        month += 12
      }
      ++month
      c = 365.25 * year
      e = 30.6 * month
      jd = c + e + day - 694039.09 // jd is total days elapsed
      jd /= 29.5305882 // divide by the moon cycle
      phase = parseInt(jd) // int(jd) -> phase, take integer part of jd
      jd -= phase // subtract integer part to leave fractional part of original jd
      phase = Math.round(jd * 8) // scale fraction from 0-8 and round
      if (phase >= 8) phase = 0 // 0 and 8 are the same so turn 8 into 0
      return {
        phase,
        name: Moon.phases[phase].name,
        emoji: Moon.phases[phase].emoji
      }
    }
  }

  let dd = date.get('date')
  let mm = date.get('month') + 1 // January is 0!
  let yyyy = dayjs().get('year')

  let phase = Moon.phase(yyyy, mm, dd)
  return phase
}
