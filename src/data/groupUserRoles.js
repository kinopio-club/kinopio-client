export default {
  states () {
    return [
      {
        name: 'member',
        description: 'Can create and edit group spaces and invite members'
      },
      {
        name: 'admin',
        description: 'Can edit group info, remove members, and assign admins'
      }
    ]
  }
}
