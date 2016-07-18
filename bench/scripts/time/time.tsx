/// <reference path="typings/react/react.d.ts" />
/// <reference path="typings/react/react-dom.d.ts" />
/// <reference path="typings/statebox/statebox.d.ts" />

import {Box} from "statebox"

export function start(box: Box<any>) {
    setInterval(() => box.set(new Date()))
}