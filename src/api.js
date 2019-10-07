// kinopio api interface

// https://www.notion.so/kinopio/API-docs
// TODO meta page url

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

export default {
  async hello () {
    try {
      const response = await fetch(`${host}/`)
      const data = await response.json()
      console.log('🌸', response, data)
      return data
    } catch (error) {
      console.error(error)
    }
  },
  options (body, apiKey) {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    if (apiKey) {
      headers.append('Authorization', apiKey)
    }
    return {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    }
  },
  async signUp (email, password, currentUser) {
    const body = currentUser
    body.email = email
    body.password = password
    const options = this.options(body)
    try {
      const response = await fetch(`${host}/user`, options)
      const data = await response.json()
      return data
    } catch (error) {
      console.error(error)
    }
  }

  // queue:
  // see npm queue and kinopio space
  // process/draim queue, handles reconnecting (see are.na/airtable/trello api client?)

}
