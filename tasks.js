//--------------------------------------
// statebox build scripts and tasks.
//--------------------------------------

"use strict"

const task = require("./tasksmith")

//--------------------------------------
// installs dev dependencies.
//--------------------------------------
const install = () => task.series([
    task.shell("npm install typescript -g")
])

//--------------------------------------
// cleans out the bin directory.
//--------------------------------------
const clean = () => task.series([
    task.trycatch(() => task.drop("./bin"), () => task.ok())
])

//--------------------------------------
// builds as standalone script.
//--------------------------------------
const build_standalone = () => task.series([
    task.shell("tsc ./src/statebox.ts --module amd --target ES5 --removeComments --outFile ./bin/standalone/statebox.js"),
    task.concat("./bin/standalone/statebox.js", ["./license", "./src/standalone/prefix.txt", "./bin/standalone/statebox.js", "./src/standalone/postfix.txt"]),
    task.copy("./src/standalone/statebox.d.ts", "./bin/standalone/")    
])

//--------------------------------------
// builds as amd module.
//--------------------------------------
const build_amd = () => task.series([
    task.shell("tsc ./src/statebox.ts --module amd --target ES5 --removeComments --outDir ./bin/amd"),
    task.concat("./bin/amd/statebox.js", ["./license", "./bin/amd/statebox.js"]),
    task.copy("./src/statebox.d.ts", "./bin/amd/")
])

//--------------------------------------
// builds as commonjs module.
//--------------------------------------
const build_commonjs = () => task.series([
    task.shell("tsc ./src/statebox.ts --module commonjs --target ES6 --removeComments --outDir ./bin/commonjs"),
    task.concat("./bin/commonjs/statebox.js", ["./license", "./bin/commonjs/statebox.js"]),
    task.copy("./src/statebox.d.ts", "./bin/commonjs/")
])

//--------------------------------------
// starts the bench on port 5000
//--------------------------------------
const bench = () => task.parallel([
    task.shell("tsc -w ./src/statebox.ts                   --module amd --target ES5             --removeComments --outFile  ./bench/scripts/statebox/statebox.js"),
    task.shell("tsc -w ./bench/scripts/todo/todo.tsx       --module amd --target ES5 --jsx react --removeComments --outFile ./bench/scripts/todo/todo.js"),
    task.shell("tsc -w ./bench/scripts/inspect/inspect.tsx --module amd --target ES5 --jsx react --removeComments --outFile ./bench/scripts/inspect/inspect.js"),
    task.shell("tsc -w ./bench/scripts/time/time.tsx       --module amd --target ES5 --jsx react --removeComments --outFile ./bench/scripts/time/time.js"),
    task.shell("tsc -w ./bench/scripts/mouse/mouse.tsx     --module amd --target ES5 --jsx react --removeComments --outFile ./bench/scripts/mouse/mouse.js"),
    task.serve("./bench", 5000, true, 1000)
])

//--------------------------------------
// builds all
//--------------------------------------
const build = () => task.series([
    build_standalone(),
    build_commonjs(),
    build_amd(),
])


task.debug(task.cli(process.argv, {
    "install"         : install(),
    "clean"           : clean(),
    "build-standalone": build_standalone(),
    "build-commonjs"  : build_commonjs(),
    "build-amd"       : build_amd(),
    "build"           : build(),
    "bench"           : bench()
}))