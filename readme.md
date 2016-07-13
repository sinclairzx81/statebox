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

// address its properties with a path.
box.addr("header/title").set("my todo list")

// isolate some scope.
let todos = box.addr("content/todos")

// observe state changes on scope.
todos.observe(items => update_ui(items))

// and update some data.
let items = todos.get()
items.push("write more code")
todos.set(items)
```

## overview

statebox is a minimal state container that maps javascript objects into a URI like address scheme and makes it all observable.

statebox was primarily written as a means to help organize and synchronize shared state between isolated web UI components (such as those found
in frameworks like react), allowing multiple components to share state through a box, subscribe to it, modify its contents, and have
the box notify all subscribing components of the change.

## build
from the project root.
```
npm install typescript -g
tsc 
```

## creating a box
To create a box, just call its constructor with an optional initial value. If no value is
passed, this box is initialized as undefined.

```javascript
let box = new Box("hello world")

console.assert(box.get() === "hello world")
```

## get and set
You can read and write to a box's state with get() and set().

```javascript
let box = new Box()

box.set(1)

console.assert(box.get() === 1)
```
## observing state changes
You can subscribe to state changes with a box's observe() function. This function
will execute for every state change to this box, notifying any observers of the
current state of the box.

```javascript
let box = new Box({
    firstname: "dave",
    lastname : "smith"
})
// observe the box
box.observe(value => console.log("box  -> ", value))

// or observe its properties.
box.addr("firstname").observe(value => console.log("firstname -> ", value))
box.addr("lastname").observe (value => console.log("lastname  -> ", value))

// modify some state
box.addr("firstname").set("henry")
box.addr("lastname").set("jones")

```
## object properties and addressing
The box constructor() and set() functions will automatically wrap anything you pass as graph of boxes
within boxes. You can navigate the inner boxes with the addr() functions.

```javascript
let box = new Box({
    firstname: "dave",
    lastname : "smith",
    address: {
        street: "123 smoko lane",
        city  : "auckland"
    },
    items: [
        {type: "scotch"},
        {type: "beer"}
    ]
})

// addressing with addr()
console.assert(box.addr("firstname").get()      === "dave")
console.assert(box.addr("lastname").get()       === "smith")
console.assert(box.addr("address/street").get() === "123 smoko lane")
console.assert(box.addr("address/city").get()   === "auckland")
console.assert(box.addr("items/0/type").get()   === "scotch")
console.assert(box.addr("items/1/type").get()   === "beer")
```
## dynamic boxes
boxes are dynamic and allow for addressing into objects that don't exist. Internally, statebox
will initialize boxes along the addr() path given by the caller, with the last box in the chain set 
to uninitalized. A caller will likely want to set() a value in these cases.

The following dynamically sets up some page.

```javascript
let box = new Box()
box.addr("header/title").set("my page title")
box.addr("header/nav/0").set({url: "/",        label: "home"})
box.addr("header/nav/1").set({url: "/about",   label: "about"})
box.addr("header/nav/2").set({url: "/contact", label: "contact"})
box.addr("content/article/title").set("the article title")
box.addr("content/article/content").set("the article content")
box.addr("content/article/tags").set(["tag1", "tag2", "tag3"])

console.log(JSON.stringify(box.get(), null, 4))
```
this results in the following output.
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

### keys

It is possible to enumerate a box's inner box's with the keys() function. 

```javascript
let box = new Box({
    value0: 1,
    value1: 2,
    value2: 3
})

let keys = box.keys()
console.assert(key[0] === "value1")
console.assert(key[1] === "value2")
console.assert(key[2] === "value2")
```
