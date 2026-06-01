// app api key scopes

const scopes = [
  {
    name: 'user',
    friendlyName: 'User',
    description: 'Can only read your user profile.'
  },
  {
    name: 'read',
    friendlyName: 'Read',
    description: 'Can read all your content (user, spaces, cards, etc).'
  },
  {
    name: 'edit',
    friendlyName: 'Edit',
    description: 'Can read and edit your content.'
  },
  {
    name: 'delete',
    friendlyName: 'Delete',
    description: 'Can fully read, edit, and delete your content.'
  }
]

export default scopes
