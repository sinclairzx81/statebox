# statebox
It's a box with some state inside.

```javascript
// create a box
let box = new Box({
    header: {
        title: "title"
    }
    content: {
        todos: [
            "drink coffee",
            "write code"
        ]
    }
})

// intoess its properties with a path.
box.into("header/title").set("my todo list")

// isolate some scope.
let todos = box.into("content/todos")

// observe state changes on scope.
todos.observe(items => update_ui(items))

// and update some data.
let items = todos.get()
items.push("write more code")
todos.set(items)
```

## overview

statebox is a minimal state container that maps javascript objects into an 
immutable state graph. It provides a concise URI like address scheme for 
reading and writing data within the graph and allows callers to observe state 
changes to any portion of the graph.

statebox was primarily written as a means to help organize and synchronize 
shared state between isolated web UI components (such as those found
in frameworks like react), allowing multiple components to share state through 
a box. Components may subscribe to a box, modify its state, and let the box
take care of notifying other observers of changes.

## build
from the project root.
```
npm install typescript -g
tsc 
```

## creating a box
To create a box, call its constructor with an optional initial value. If no value is
passed, this box is initialized as undefined.

```javascript
let box = new Box("hello world")

console.assert(box.get() === "hello world")
```

## get and set
You can read and write to a box's state with get() and set().
Both get() and set() functions copy data in and out of the box in an
immutable fashion. (see section on immutability). Once can think
of checking data out, and checking it in with these functions.

```javascript
let box = new Box()

box.set(1)

console.assert(box.get() === 1)
```
## observing state changes
Callers can subscribe to state changes with a box's observe() function. The
callback given to observe() will execute immediately, providing the caller
with an immediate view of the boxes state, the callback is then added to a subscription
list, in which any modifications to the box or its child boxes will invoke the 
callback again with the updated state.

A important characteristic of observe() is that it will fire for any child state 
changes. This may lead to a lot of noise for subscribers at higher levels within
the graph. As a design consideration, subscribers should only observe branches of
the state they are interested in.

The observe() function returns to the caller an observer. Callers
may unsubscribe from updates by calling its dispose() function.

```javascript

let box = new Box([0, 1, 2])

// observe the box, this will immediately
// invoke the callback with the current
// value of the box(the array), then wait
// for additional state changes.
let observer = box.observe(array => {
    console.log(array)
})

// calling set on the box will cause any
// observer callbacks to fire with the 
// new state.
box.set([0, 1, 2, 3])

// it may be desirable to unsubscribe from
// state change events, this can be done 
// by calling dispose()
observer.dispose()
```

## object properties and addressing
statebox encodes all objects, arrays and values within a hierarchical 
tree of boxes. The library provides two functions for 
addressing into this tree, the into() and keys() functions.

The into() function returns an inner box at the given path. The into() function
is only valid for object and array box types. Calling into() on a box that
contains a direct value is an error.

```javascript
let box = new Box({
    header: {
        title: "the title"
    },
    content: {
        author: "dave",
        tags: ["tag0", "tag1", "tag2"],
        paragraphs: [
            { content: "paragraph 1"},
            { content: "paragraph 2"}
        ]
    }
})

// reading various state in the graph.
console.assert(box.into("header/title").get() === "the title")
console.assert(box.into("header").into("title").get() === "the title")
console.assert(box.into("content/author").get() === "dave")
console.assert(box.into("content/tags/1").get() === "tag1")
console.assert(box.into("content/paragraphs/1/content").get() === "paragraph 2")
```
In instances where the contents of a box may not be known, you can use the keys()
function to return keys under the current box. This can be useful for iterating 
over the graph.

- keys() can also be used to enumerate arrays, where array indices are returned for box array types.
- keys() are only valid for objects and arrays box types. value types return an empty key array.

```javascript
let box = new Box({
    object: {key1: 100, key2: 200, key3: 300},
    array : [100, 200, 300]
})

// discover the inner elements.
let properties = box.into("object").keys().map(key => box.into("object/" + key))
let elements   = box.into("array").keys().map (key => box.into("array/" + key))

// print their values.
properties.forEach(box => console.log(box.get()))
elements.forEach(box   => console.log(box.get()))
```

## dynamically creating boxes
boxes are dynamic and allow for addressing into objects that don't exist. Internally, statebox
will initialize boxes along the into() path given by the caller, with the last box in the chain set 
to undefined. A caller will likely want to set() a value in these cases. 

Because boxes are dynamic, it makes them useful containers for caching results from REST endpoints. 
```javascript
let box = new Box()
// 1 - 1 corrospondance
get("https://domain.com/api/data/customers").then(customers => {
    box.into("api/data/customers").set(customers)
})
```
Or callers may wish to iteratively initialize a graph where all data may not
be known up front. For example.
```javascript
let box = new Box()
box.into("header/title").set("my page title")
box.into("header/nav/0").set({url: "/",        label: "home"})
box.into("header/nav/1").set({url: "/about",   label: "about"})
box.into("header/nav/2").set({url: "/contact", label: "contact"})
box.into("content/article/title").set("the article title")
box.into("content/article/content").set("the article content")
box.into("content/article/tags").set(["tag1", "tag2", "tag3"])
```
which results in the following object.
```
{
    "header": {
        "title": "my title",
        "nav": [
            {
                "url": "/",
                "label": "home"
            },
            {
                "url": "/about",
                "label": "about"
            },
            {
                "url": "/contact",
                "label": "contact"
            }
        ]
    },
    "content": {
        "article": {
            "title": "the article title",
            "content": "the article content",
            "tags": [
                "tag1",
                "tag2",
                "tag3"
            ]
        }
    }
}
```

## boxes and immutability

boxes are immutable containers of state. Any changes to a box's state (via the set() function)
will cause the state replaced by a copy of the given value.

``` javascript
// create an array of 3 values
let array = [0, 1, 2]
// create a box
let box  = new Box()
// copy array into box
box.set(array)
// mutate the array.
array.push(4)
// assert we still have 3 values
console.assert(box.get().length === 3)
```
In a similar fashion, any values return from get() are 
also copies.

```javascript
// initialize a box with an array of 3 values.
let box = new Box([0, 1, 2])
// obtain a copy of the array.
let array = box.get()
// mutate the array.
array.push(4)
// assert we still have 3 values
console.assert(box.get().length === 3)
```
This concept is also extended to observers who also receive copies.
In a typical application, you may have several observers of a single 
box. statebox provides protection against any one observer 
modifying the boxes state.

```javascript
// initialize a box with an array of 3 values.
let box = new Box([0, 1, 2])
// observe state changes
box.observe(array => {
    // attempt to mutate state.
    array.push(5)
})
// replace contents with another 3 values.
// this will cause invoke a observer event.
box.set([3, 2, 1])

// assert we still have 3 values.
console.assert(box.get().length === 3)
```

## dropping boxes
boxes can be dropped from their parent with the drop() function. The drop() 
function returns the box to the caller, allowing the box to be inserted 
elsewhere in the graph or discarded.

```javascript

// construct the box
let box = new Box({
    header: {
        title    : "the header",
        subtitle : "subtitle"
    },
    list: [0, 1, 2]
})

// drop header and 2nd element in the list.
let header  = box.into("header").drop()
let element = box.into("list/1").drop() // discard

// { 
//    list: [0, 2]
// }

// reattach the header as header2
box.into("header2").set(header)

// {
//    header2: {
//      title   : "the header", 
//      subtitle: "the subtitle"
//    }, 
//    list: [0, 2]
// }
```