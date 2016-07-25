# statebox

observable javascript state container.

```javascript
let box = Box({ 
    state: {
        value: 1
    }
})

let value = box.into("state/value")

value.sub(value => console.log(value))

value.set(1).pub()
value.set(2).pub()
value.set(3).pub()
```

## overview

statebox is a observable state container that encodes javascript objects into an immutable state 
graph for the purposes of enabling state synchronization between multiple consumers of that state.

statebox was primarily written as a means to help organize and synchronize shared state between 
isolated web UI components (such as those found in frameworks like react), allowing multiple
components to share state through a box. Components may subscribe to a box, modify its state, 
and let the box take care of notifying other observers of changes.

## build

```
npm install typescript -g
tsc src/statebox.ts
```

## get()

returns a value contained within a box.

```javascript
let box = Box(1)

console.assert(box.get() === 1)
```

## set()
overwrites the value contained within a box.
```javascript
let box = Box()

box.set(1)

console.assert(box.get() === 1)

box.set("hello")

console.assert(box.get() === "hello")

box.set({value: 10})

console.assert(box.get().value === 10)

```

## id()

returns the box's internal unique identifier.

```javascript
let box = Box()

box.id()
```

## type()

returns the simple type name of the value contained within a box.

```javascript
let box = Box()

console.assert(box.type() === "undefined")

// number
box.set(1)
console.assert(box.type() === "number")

// string
box.set("hello")
console.assert(box.type() === "string")

// array
box.set([0, 1, 2])
console.assert(box.type() === "array")

// object
box.set({
    title: "my article",
    tags: ["tag1", "tag2", "tag3"]
})
console.assert(box.type() === "object")
console.assert(box.into("title").type()   === "string")
console.assert(box.into("tags").type()    === "array")
console.assert(box.into("tags/0").type()  === "string")
```

## name()

returns the property key or element index of a box if known. otherwise undefined. 

```javascript
let box = Box({ items: [0, 1, 2] })
console.assert(box.into("items").name() === "items")
console.assert(box.into("items/1").name() === "1")
```

## pub()
publishes the current state of this box to subscribers.
```javascript
let box = Box("hello")

box.sub(value => { 
    console.assert(value === "hello")
})

box.pub()
```

## sub()

subscribes to a box and returns a subscription object to the caller.


### subscribe

the subscription callback is fired when the pub() function is called on the box.

```javascript
let box = Box()

box.into("events").sub(event => {
    console.assert(event.type === "click")
    console.assert(event.value === 1)   
})

box.into("events").set({type: "click", value: 1}).pub()
box.into("events").set({type: "click", value: 2}).pub()
box.into("events").set({type: "click", value: 3}).pub()
```
### unsubscribe
The sub() function returns a subscription object

```javascript
let box = Box()

let sub = box.into("events").sub(event => {
    console.assert(event.type === "click")
    console.assert(event.value === 1)   
})

// ...

sub.unsub() // unsubscribe.
```

## ini()

initializes the value of a box if undefined. otherwise no action.

```javascript
let box = Box()

box.into("data").ini("hello")
console.assert(box.into("data").get() === "hello")

box.into("data").ini("there")
console.assert(box.into("data").get() === "hello")
```

## inner() 
returns an array of boxes under the current box.

### arrays
```javascript
let box = Box([0, 1, 2])

let inner = box.inner()
console.assert(inner[0].get() === 0)
console.assert(inner[1].get() === 1)
console.assert(inner[2].get() === 2)
```
### objects
```javascript
let box = Box({
    firstname: "dave",
    lastname: "smith"
})
let inner = box.inner()
console.assert(inner[0].get() === "dave")
console.assert(inner[1].get() === "smith")
```

## into()
moves into a array, property or value.

```javascript
let box = Box({
    page: {
        title: "titie",
        tags : ["tag0", "tag1", "tag2"]
    }
})
console.assert(box.into("page").into("title").get() === "title")
console.assert(box.into("page/title").get() === "title")
console.assert(box.into("page/tags/1").get() === "tags1")
console.assert(box.into("page/tags").into(1).get() === "tags1")

```
## drop()
drops / removes a box.

note: dropping boxes does not drop subscribers of that box. If dropping
a box, be careful there are not existing subscribers to that box.
### drop object properties
The following will drop the firstname property.
``` javascript
let box = Box({
    firstname: "dave",
    lastname: "smith"
})
box.drop("firstname")

let customer = box.get()
console.assert(customer.firstname === undefined)
console.assert(customer.lastname === "smith")
```
### drop array elements
The following will drop the 2nd array element. 

note: dropping array elements does not resize the array, rather
it sets the array element to undefined. To resize an array, use 
set() to replace the array in its entirety.
```javascript
let box = Box([0, 1, 2])
box.drop(1)

let array = box.get()
console.assert(array.length === 3)
console.assert(array[0] === 0)
console.assert(array[1] === undefined)
console.assert(array[2] === 2)
```




