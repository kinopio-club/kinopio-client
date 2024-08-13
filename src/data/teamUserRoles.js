export default {
  states () {
    return [
      {
        name: 'member',
        description: 'Can create and edit team spaces and invite members',
        color: 'info',
        icon: 'star'
      },
      {
        name: 'admin',
        description: 'Can edit team info, remove members, and assign admins',
        color: 'danger',
        icon: 'key'
      }
    ]
  }
}