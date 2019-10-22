# tests to do

## queue.js > squash

    // queue []
      // {name: 'UpdateCard', {body: id: 1, name: "add"}
      // {name: 'UpdateCard', {body: id: 1, frameid: 9}
      // {name: 'yolo', {body: id: 2, prop2: "xyz"}
      // {name: 'UpdateCard', {body: id: 1, prop1: "123", x: 23, y: 12}
      // {name: 'UpdateCard', {body: id: 1, name: "added"}
      // {name: 'UpdateCard', {body: id: 1, name: "added pop"}
    // assert queue []
      // {name: 'UpdateCard', {body: id: 1, prop1: "123", x: 23, y: 12, frameid: 9, name: "added pop"}
      // {name: 'yolo', {body: id: 2, prop2: "xyz"}


    // multiqueue
      // {name: 'UpdateCard', {body: id: 2, name: "add"}
      // {name: 'UpdateCard', {body: id: 1, frameid: 9}
      // {name: 'UpdateCard', {body: id: 1, name: 'yolo'}
    // asert multi queue []
      // {name: 'UpdateCard', updates: [
        {body: {id: 2, name: "add"}},
        {body: {id: 1, name: 'yolo', frameid: 9}}
      ] // if updates.length then run a [request.name + multiple]
