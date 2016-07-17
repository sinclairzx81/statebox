# statebox
It's a box with some state inside.

```javascript
// create a box
let box = new Box({
    header: {
        title: "title"
    },
    content: {
        todos: [
            "drink coffee",
            "write code"
        ]
    }
})

// access state with a qualified path.
box.with("header/title").set("my todo list")

// isolate todo scope.
let todos = box.with("content/todos")

// observe changes to the todo scope.
todos.observe().data(array => console.log(array))

// makes some changes to the todo scope.
let items = todos.get()
items.push("write more code")
todos.set(items)
```

## overview

statebox is a minimal state container that maps javascript objects into an 
immutable state graph for the purposes of enabling state synchronization 
between multiple consumers of that state.

statebox was primarily written as a means to help organize and synchronize 
shared state between isolated web UI components (such as those found
in frameworks like react), allowing multiple components to share state through 
a box. Components may subscribe to a box, modify its state, and let the box
take care of notifying other observers of changes.

statebox also supports cross network synchronization, allowing 
changes on one box running in one browser to be synchronized
with boxes running in other browsers over a network.

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
Both get() and set() functions deep copy the data passed in 
and out to help enforce immutability. 

```javascript
let box = new Box()
box.set(1)
console.assert(box.get() === 1)
```
In addition to simple values, entire objects and arrays can be passed to a box. Internally, 
statebox will pack arrays and objects in boxes, with each property / element being a nested
box. A box provides some useful methods for reading data in and out of these nested values, as
demonstrated below.

```javascript
let box = new Box({
    firstname: "dave",
    lastname: "smith",
    items: [
        "smokes",
        "scotch",
        "code"
    ]
})
box.with("firstname").get() // dave
box.with("lastname").get()  // smith
box.with("items").get()     // ["smokes", "scotch", "code"]
box.with("items/1").get()   // "scotch"
box.with("items").iter().forEach(key => { // 0, 1, 2
    box.with("items").into(key).get() 
})
```
## observing state changes
statebox imagines state changes as a stream of events. callers can subscribe to
these events by calling observe() on the box they are interested in. In the 
example below, we observe on the box itself.

```javascript
let box = new Box("hello world")
box.observe().data(data => console.log(data))
box.set("change 1")
box.set("change 2")
```

### event propagation

An important characteristic of statebox's event mechanism is that changes to a 
inner box's state will result in all parent boxes receiving a data event. In 
the diagram below, a change to "B"'s data results in the parent "box" receiving
a data event.
```
box.with("a").set("hello")
box.with("b").set("world")
            |
{a: "hello", b: "world"}
            |
         +-----+ 
         | box |     ---> 3. [data event]  
         +-----+
          /   \ 
       +---+  +---+  ---> 2. [data event]  
       | a |  | b |                      
       +---+  +---+  <--- 1. box.with("b").set("foobar")     
```

### event streams
statebox imagines state changes as a stream of events, and just like streams, they have the 
potential to end.

In statebox, a stream will end if the box gets overwritten in the graph. An observer can interpret
this in two ways, the first being that the can no longer expect to receive data events, and also
that the box they were observing no longer exists.


```
box.with("a").set("hello")      box.set({c:"foobar"})
box.with("b").set("world")            |
          |                           |
          |                           |
{a: "hello", b: "world"}         {c: "foobar"}
          |                           |
       +-----+                      +-----+
       | box |                      | box |
       +-----+                      +-----+
        /   \                          |   
    +---+   +---+                    +---+
    | a |   | b | --> [end event]    | c |
    +---+   +---+                    +---+  

```
The following code snippet further illustates this behavior.
```javascript
// create a box.
let box = new Box()

// create an observer that watches data.
let observer = box.with("data").observe()

// attach some events (like a stream)
observer.data(value => console.log(value))
        .end(()     => console.log("end"))

// override the data 10 times.
for(let i = 0; i < 10; i++) {
    box.with("data").set(i)
}

// override the contents of the box.
box.set({})
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
console.assert(box.with("header/title").get() === "the title")
console.assert(box.with("header").with("title").get() === "the title")
console.assert(box.with("content/author").get() === "dave")
console.assert(box.with("content/tags/1").get() === "tag1")
console.assert(box.with("content/paragraphs/1/content").get() === "paragraph 2")
```

## dynamically creating boxes
boxes are dynamic and allow for addressing into objects that don't exist. Internally, statebox
will initialize boxes along the with() path given by the caller, with the last box in the chain set 
to undefined. A caller will likely want to set() a value in these cases.

```javascript
let box = new Box()
// 1 - 1 correspondence
http_get("https://domain.com/api/data/customers").then(customers => {
    box.with("api/data/customers").set(customers)
})
```
Or callers may wish to iteratively initialize a graph where all data may not
be known up front. For example.
```javascript
let box = new Box()
box.with("header/title").set("my page title")
box.with("header/nav/0").set({url: "/",        label: "home"})
box.with("header/nav/1").set({url: "/about",   label: "about"})
box.with("header/nav/2").set({url: "/contact", label: "contact"})
box.with("content/article/title").set("the article title")
box.with("content/article/content").set("the article content")
box.with("content/article/tags").set(["tag1", "tag2", "tag3"])
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

## network synchronization

statebox provides a simple network synchronization mechanism.

```javascript
let a = new Box()
let b = new Box()

// a and b observe each other.
a.observe().sync(data => b.sync(data))
b.observe().sync(data => a.sync(data))

// set the value of a
a.set({ value: "hello world" })

// assert b has the value.
console.assert(b.with("value").get() === "hello world")
```

network synchronization is built around observation. The observer .sync() method
emits a synchronization object which can be passed over the network and received
on a box's sync() method.

The code below demonstrates a in page "hub" that acts as a network bridge between
to boxes. It demonstrates the how a network server should pass synchronization
objects from box to box. 

```javascript
let createHub = () => {
  let boxes = []
  return {
    add: (box) => { 
      boxes.push(box)
      // wait for sync object. When
      // received, dispatch object to
      // all other boxes except the box
      // that sent it.
      box.observe().sync(data => {
        boxes.filter(other  => other !== box) // all but sender
             .forEach(other => other.sync(data))
      })
    }
  }
}

let hub = createHub()
let a = new Box()
let b = new Box()
hub.add(a)
hub.add(b)
```


