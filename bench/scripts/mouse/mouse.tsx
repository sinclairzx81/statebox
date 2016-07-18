/// <reference path="typings/react/react.d.ts" />
/// <reference path="typings/react/react-dom.d.ts" />
/// <reference path="typings/statebox/statebox.d.ts" />

import {Box} from "statebox"

export function start(box: Box<any>) {
    document.addEventListener("mousemove", (e) => {
        box.set({
            x: e.clientX,
            y: e.clientY
        })
    })
}