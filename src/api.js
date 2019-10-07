// kinopio api interface

// https://www.notion.so/kinopio/API-docs
// TODO meta page url
// import cache from '@/cache.js' use for getting apikey to use in options

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

export default {
  options (body) {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    // if (apiKey in session(can i access currentuser store here) or localstorage cached user) {
    //   headers.append('Authorization', apiKey)
    // }
    return {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    }
  },

  async normalizedResponse (response) {
    const success = [200, 201, 202, 204]
    if (success.includes(response.status)) {
      const data = await response.json()
      return data
    } else {
      const data = await response.json()
      let error = {
        status: response.status,
        statusText: response.statusText,
        error: true
      }
      if (data.errors) {
        error.message = data.errors[0].message
        error.type = data.errors[0].type
      }
      return error
    }
  },

  async signUp (email, password, currentUser) {
    const body = currentUser
    body.email = email
    body.password = password
    const options = this.options(body)
    try {
      const response = await fetch(`${host}/user`, options)
      const normalizedResponse = await this.normalizedResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },

  async signIn (email, password) {
    const body = {
      email: email,
      password: password
    }
    const options = this.options(body)
    try {
      const response = await fetch(`${host}/user/sign-in`, options)
      const normalizedResponse = await this.normalizedResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  }

  // queue:
  // see npm queue and kinopio space
  // process/draim queue, handles reconnecting (see are.na/airtable/trello api client?)

}
