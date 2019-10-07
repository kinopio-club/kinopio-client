// for queued and unqueued kinopio api requests

// https://www.notion.so/kinopio/API-docs

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
  async signUp (email, password, currentUser) {
    // try catch
    console.log('send sign up to server, fetch POST to user/sign-up')
    console.log('🌹', email, password, currentUser)
    const body = currentUser
    body.email = email
    body.password = password
    try {
      const response = await fetch(`${host}/user/sign-up`, {
        method: 'POST',
        body: body
      })
      const data = await response.json()
      console.log('🌸', response, data)
      return data
    } catch (error) {
      console.error(error)
    }

    // format response into a thing i can return for signUpOrIn
    // return response // (might be a error one)

    // eg response = {
    //   success: false, if true the api should do all the new account set up stuff like uploading spaces
    //   error: true,
    //   message: ''
    // }
  }

  // queue:
  // see npm queue and kinopio space
  // process/draim queue, handles reconnecting (see are.na/airtable/trello api client?)

}
