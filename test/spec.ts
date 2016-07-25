//--------------------------------------------
// statebox - tests / spec
//--------------------------------------------

import {test, run} from "./runner"
import {Box} from "../src/statebox"

test("create as default", context => {
    let box = Box()
    context.assert(box.get() === undefined)
    context.assert(box.type() === "undefined")
    context.ok()
})

test("create from object", context => {
    let box = Box({
        firstname: "dave",
        lastname : "smith"
    })
    context.assert(box.type() === "object")
    context.assert(box.get<any>().firstname === "dave")
    context.assert(box.get<any>().lastname  === "smith")
    context.ok()
})

test("create from array", context => {
    let box = Box([0, 1, 2])
    context.assert(box.type() === "array")
    context.assert(box.get<number[]>()[0] === 0)
    context.assert(box.get<number[]>()[1] === 1)
    context.assert(box.get<number[]>()[2] === 2)
    context.ok()
})

test("create from boolean", context => {
    let box = Box(true)
    context.assert(box.type() === "boolean")
    context.assert(box.get<boolean>() === true)
    context.ok()
})

test("create from date", context => {
    let box = Box(new Date())
    context.assert(box.type() === "date")
    context.assert(box.get<Date>().getDate !== undefined)
    context.ok()
})

test("create from number", context => {
    let box = Box(1)
    context.assert(box.type() === "number")
    context.assert((box.get<number>() + 2) === 3)
    context.ok()
})

test("create from undefined", context => {
    let box = Box(undefined)
    context.assert(box.type() === "undefined")
    context.assert(box.get() === undefined)
    context.ok()
})

test("create from null", context => {
    let box = Box(null)
    context.assert(box.type() === "null")
    context.assert(box.get() === null)
    context.ok()
})


test("set from object", context => {
    let box = Box()
    box.set({
        firstname: "dave",
        lastname : "smith"
    })
    context.assert(box.type() === "object")
    context.assert(box.get<any>().firstname === "dave")
    context.assert(box.get<any>().lastname  === "smith")
    context.ok()
})

test("set from array", context => {
    let box = Box()
    box.set([0, 1, 2])
    context.assert(box.type() === "array")
    context.assert(box.get<number[]>()[0] === 0)
    context.assert(box.get<number[]>()[1] === 1)
    context.assert(box.get<number[]>()[2] === 2)
    context.ok()
})

test("set from boolean", context => {
    let box = Box()
    box.set(true)
    context.assert(box.type() === "boolean")
    context.assert(box.get<boolean>() === true)
    context.ok()
})

test("set from date", context => {
    let box = Box()
    box.set(new Date())
    context.assert(box.type() === "date")
    context.assert(box.get<Date>().getDate !== undefined)
    context.ok()
})

test("set from number", context => {
    let box = Box()
    box.set(1)
    context.assert(box.type() === "number")
    context.assert((box.get<number>() + 2) === 3)
    context.ok()
})

test("set from undefined", context => {
    let box = Box()
    box.set(undefined)
    context.assert(box.type() === "undefined")
    context.assert(box.get() === undefined)
    context.ok()
})

test("set from null", context => {
    let box = Box()
    box.set(null)
    context.assert(box.type() === "null")
    context.assert(box.get() === null)
    context.ok()
})
test("ini from undefined", context => {
    let box = Box()
    box.into("data").ini("hello")
    context.assert(box.into("data").get() === "hello")
    box.into("data").ini("there")
    context.assert(box.into("data").get() === "hello")
    context.ok()
})
test("ini from null", context => {
    let box = Box({data: null})
    box.into("data").ini("hello")
    context.assert(box.into("data").get() === null)
    context.ok()
})
test("dynamic array length", context => {
    let box = Box()
    box.into(10).set(1)
    context.assert(box.get<any[]>().length === 11)
    context.ok()
})
test("box properties and index names", context => {
    let box = Box({ items: [0, 1, 2] })
    context.assert(box.into("items").name() === "items")
    context.assert(box.into("items/1").name() === "1")    
    context.ok()
})

test("transmute object to number", context => {
    let box = Box({})
    box.set(1)
    context.assert(box.type() === "number")
    context.assert(box.get() === 1)
    context.ok()
})

test("transmute number to object", context => {
    let box = Box(1)
    box.set({value: 1})
    context.assert(box.type() === "object")
    context.assert(box.get<any>().value === 1)
    context.ok()
})

test("transmute array to number", context => {
    let box = Box([])
    box.set(1)
    context.assert(box.type() === "number")
    context.assert(box.get() === 1)
    context.ok()
})

test("transmute number to array", context => {
    let box = Box(1)
    box.set([1])
    context.assert(box.type() === "array")
    context.assert(box.get()[0] === 1)
    context.ok()
})
test("transmute object to array", context => {
    let box = Box({})
    box.set([1])
    context.assert(box.type() === "array")
    context.assert(box.get()[0] === 1)
    context.ok()
})
test("transmute array to object", context => {
    let box = Box([])
    box.set({value: 1})
    context.assert(box.type() === "object")
    context.assert(box.get<any>().value === 1)
    context.ok()
})

test("inner array (object)", context => {
    let box = Box({
        firstname: "dave",
        lastname: "smith"
    })
    let inner = box.inner()
    context.assert(inner[0].get() === "dave")
    context.assert(inner[1].get() === "smith")
    context.ok()
})

test("inner array (array)", context => {
    let box = Box([0, 1, 2])
    let inner = box.inner()
    context.assert(inner[0].get() === 0)
    context.assert(inner[1].get() === 1)
    context.assert(inner[2].get() === 2)
    context.ok()
})
test("into object property (step)", context => {
    let box = Box({
        customer: {
            firstname: "dave",
            lastname : "smith"
        }
    })
    let customer = box.into("customer")
    let firstname = customer.into("firstname")
    let lastname  = customer.into("lastname")
    context.assert(firstname.get() === "dave")
    context.assert(lastname.get()  === "smith")
    context.ok()
})

test("into object property (path)", context => {
    let box = Box({
        customer: {
            firstname: "dave",
            lastname : "smith"
        }
    })
    let customer  = box.into("customer")
    let firstname = customer.into("firstname")
    let lastname  = customer.into("lastname")
    context.assert(firstname.get() === "dave")
    context.assert(lastname.get()  === "smith")
    context.ok()
})

test("into array index (step)", context => {
    let box = Box({
        items: [0, 1, 2, 3]
    })
    let items = box.into("items")
    context.assert(items.into(0).get() === 0)
    context.assert(items.into(1).get() === 1)
    context.assert(items.into(2).get() === 2)
    context.assert(items.into(3).get() === 3)
    context.ok()
})

test("into array index (path)", context => {
    let box = Box({
        items: [0, 1, 2, 3]
    })
    context.assert(box.into("items/0").get() === 0)
    context.assert(box.into("items/1").get() === 1)
    context.assert(box.into("items/2").get() === 2)
    context.assert(box.into("items/3").get() === 3)
    context.ok()
})

test("into array object property (step)", context => {
    let box = Box({
        items: [{ value: 0}, {value: 1}, {value: 2}, {value: 3}]
    })
    let items = box.into("items")
    context.assert(items.into(0).into("value").get() === 0)
    context.assert(items.into(1).into("value").get() === 1)
    context.assert(items.into(2).into("value").get() === 2)
    context.assert(items.into(3).into("value").get() === 3)
    context.ok()
})

test("into array object property (path)", context => {
    let box = Box({
        items: [{ value: 0}, {value: 1}, {value: 2}, {value: 3}]
    })
    context.assert(box.into("items/0/value").get() === 0)
    context.assert(box.into("items/1/value").get() === 1)
    context.assert(box.into("items/2/value").get() === 2)
    context.assert(box.into("items/3/value").get() === 3)
    context.ok()
})

test("into array dynamic (numeric key)", context => {
    let box = Box()
    box.into("items").into("0").set(1)
    context.assert(box.into("items").type() === "array")
    context.assert(box.into("items").into("0").get() === 1)
    context.ok()
})

test("into array dynamic (step)", context => {
    let box = Box()
    box.into("items").into(0).set(0)
    box.into("items").into(1).set(1)
    context.assert(box.into("items").type() === "array")
    context.assert(box.into("items").get<any>().length === 2)
    context.assert(box.into("items").into(0).get() === 0)
    context.assert(box.into("items").into(1).get() === 1)
    context.ok()
})

test("into array dynamic (path)", context => {
    let box = Box()
    box.into("items/0").set(0)
    box.into("items/1").set(1)
    context.assert(box.into("items").type() === "array")
    context.assert(box.into("items").get<any>().length === 2)
    context.assert(box.into("items/0").get() === 0)
    context.assert(box.into("items/1").get() === 1)
    context.ok()
})

test("into array dynamic (non linear) (step)", context => {
    let box = Box()
    box.into("items").into(100).set(100)
    box.into("items").into(10).set(10)
    context.assert(box.into("items").type() === "array")
    context.assert(box.into("items").get<any>().length === 101)
    context.assert(box.into("items").into(50).get() === undefined)
    context.assert(box.into("items").into(100).get() === 100)
    context.assert(box.into("items").into(10).get() === 10)
    context.ok()
})

test("into array dynamic (non linear) (path)", context => {
    let box = Box()
    box.into("items/100").set(100)
    box.into("items/10").set(10)
    context.assert(box.into("items").type() === "array")
    context.assert(box.into("items").get<any>().length === 101)
    context.assert(box.into("items/50").get() === undefined)
    context.assert(box.into("items/100").get() === 100)
    context.assert(box.into("items/10").get() === 10)
    context.ok()
})

test("into object from numeric key (no transmute)", context => {
    let box = Box({items: {}})
    box.into("items").into("0").set(1)
    context.assert(box.into("items").type() === "object")
    context.assert(box.into("items").into("0").get() === 1)
    context.ok()
})

test("into object dynamic (step)", context => {
    let box = Box()
    box.into("customer").into("firstname").set("dave")
    box.into("customer").into("lastname").set("smith")
    box.into("customer").into("items").into("0").set(0)
    box.into("customer").into("items").into("1").set(1)
    box.into("customer").into("items").into("2").set(2)
    context.assert(box.into("customer").type() === "object")
    context.assert(box.into("customer").into("firstname").type() === "string")
    context.assert(box.into("customer").into("lastname").type() === "string")
    context.assert(box.into("customer").into("firstname").get() === "dave")
    context.assert(box.into("customer").into("lastname").get() === "smith")
    context.assert(box.into("customer").into("items").type() === "array")
    context.assert(box.into("customer").into("items").into("0").get() === 0)
    context.assert(box.into("customer").into("items").into("1").get() === 1)
    context.assert(box.into("customer").into("items").into("2").get() === 2)    
    context.ok()
})

test("into object dynamic (path)", context => {
    let box = Box()
    box.into("customer/firstname").set("dave")
    box.into("customer/lastname").set("smith")
    box.into("customer/items/0").set(0)
    box.into("customer/items/1").set(1)
    box.into("customer/items/2").set(2)
    context.assert(box.into("customer").type() === "object")
    context.assert(box.into("customer/firstname").type() === "string")
    context.assert(box.into("customer/lastname").type() === "string")
    context.assert(box.into("customer/firstname").get() === "dave")
    context.assert(box.into("customer/lastname").get() === "smith")
    context.assert(box.into("customer/items").type() === "array")
    context.assert(box.into("customer/items/0").get() === 0)
    context.assert(box.into("customer/items/1").get() === 1)
    context.assert(box.into("customer/items/2").get() === 2)    
    context.ok()
})

test("into array with alpha key (should error)", context => {
    try {
        let box = Box({items:[0, 1, 2]})
        box.into("items").into("abc").set("1")
        context.assert("expected error", false)
    } catch(e) {
        context.ok()
    }
})

test("into value type (should error)", context => {
    try {
        let box = Box(1)
        box.into("test").set("1")
        context.assert("expected error", false)
    } catch(e) {
        context.ok()
    }
})

test("drop array element", context => {
    let box = Box([0, 1, 2])
    box.drop(1)
    let array = box.get<number[]>()
    context.assert(array.length === 3)
    context.assert(array[0] === 0)
    context.assert(array[1] === undefined)
    context.assert(array[2] === 2)
    context.ok()
})

test("drop array property", context => {
    let box = Box({
        firstname: "dave",
        lastname: "smith"
    })
    box.drop("firstname")
    let obj = box.get<any>()
    context.assert(obj.firstname === undefined)
    context.assert(obj.lastname === "smith")
    context.ok()
})
test("drop object (iterative)", context => {
    let box = Box({
        customer: {
            firstname: "dave",
            lastname: "smith"
        },
        items: [0, 1, 2]
    })
    box.drop("customer/firstname")
    let obj = box.get<any>()
    context.assert(obj.customer.firstname === undefined)
    context.assert(obj.customer.lastname  === "smith")
    context.assert(obj.items.length === 3)
    box.drop("customer")
    obj = box.get<any>()
    context.assert(obj.customer === undefined)
    context.assert(obj.items.length === 3)    
    box.drop("items/2")
    obj = box.get<any>()
    context.assert(obj.customer === undefined)
    context.assert(obj.items.length === 2)        
    box.drop("items")
    obj = box.get<any>()
    context.assert(obj.customer === undefined)
    context.assert(obj.items === undefined)     
    context.ok()
})
test("subscribe and publish", context => {
    let box = Box()
    box.sub(value => {
        context.assert(value === 123)
        context.ok()
    })
    box.set(123).pub()
})

test("subscribe and publish (array)", context => {
    let box = Box({
        items: [0, 1, 2, 3]
    })
    box.into("items").sub(items => {
        context.assert(items[0] === 0)
        context.assert(items[1] === 55)
        context.assert(items[2] === 2)
        context.ok()
    })
    box.into("items/1").set(55).pub()
})

test("subscribe and publish (object)", context => {
    let box = Box({
        customer: {
            firstname: "dave",
            lastname: "smith"
        }
    })
    box.into("customer").sub(customer => {
        context.assert(customer.firstname === "alice")
        context.assert(customer.lastname === "smith")
        context.ok()
    })
    box.into("customer/firstname").set("alice").pub()
})

test("subscribe and unsubscribe (single)", context => {
    let box = Box({value: 0})
    let sub = box.sub(value => context.assert("should not execute", false))
    sub.unsub()
    box.set({value: 1}).pub()
    context.ok()
})

test("subscribe and unsubscribe (multiple - unsub 1)", context => {
    let box  = Box({value: 0})
    let flag = false
    let sub0 = box.sub(value => context.assert("should not execute", false))
    let sub1 = box.sub(value => flag = true)
    sub0.unsub()
    box.set({value: 1}).pub()
    context.assert(flag)
    context.ok()
})

run()
