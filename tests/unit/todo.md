# tests to do

## queue.js > squash

    // queue []
      // {name: 'Updatecard', {body: id: 1, name: "add"}
      // {name: 'Updatecard', {body: id: 1, frameid: 9}
      // {name: 'yolo', {body: id: 2, prop2: "xyz"}
      // {name: 'Updatecard', {body: id: 1, prop1: "123", x: 23, y: 12}
      // {name: 'Updatecard', {body: id: 1, name: "added"}
      // {name: 'Updatecard', {body: id: 1, name: "added pop"}
    // assert queue []
      // {name: 'Updatecard', {body: id: 1, prop1: "123", x: 23, y: 12, frameid: 9, name: "added pop"}
      // {name: 'yolo', {body: id: 2, prop2: "xyz"}
