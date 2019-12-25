export default {

  categories () {
    return [
      {
        id: 0,
        name: 'All'
      },
      {
        id: 1,
        name: 'Learning'
      },
      {
        id: 2,
        name: 'Life'
      },
      {
        id: 3,
        name: 'Planning'
      }
    ]
  },

  spaces () {
    return [
      {
        id: '123',
        categoryId: 1,
        name: 'Note Taking'
      },
      {
        id: '323',
        categoryId: 2,
        name: 'ToDo Today'
      }

    ]
  }

}
