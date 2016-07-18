/// <reference path="typings/react/react.d.ts" />
/// <reference path="typings/react/react-dom.d.ts" />
/// <reference path="typings/statebox/statebox.d.ts" />

import {Box} from "statebox"

export class Inspector extends React.Component<{box: Box<any>}, {}> {
    componentDidMount() {
        this.props.box.observe().data(() => this.forceUpdate())
    }
    public render() {
        //------------------------------------------
        // recursively map boxes to ul/li elements.
        //------------------------------------------
        let mapbox = (box: Box<any>) => {
            let value = (box.type() !== "array"  && 
                         box.type() !== "object" &&
                         box.get()  !== undefined) 
                         ? box.get().toString() : ""
            return <li key={box.id()}>
                <span>[{box.name() || "root"}: {box.type() || "undefined"}] {value}</span>
                <ul>{box.inner().map(box => mapbox(box))}</ul>
            </li>
        }
        return <div className="inspect">
           <div className="header">
             <h2>box inspector</h2>
           </div>
           <div className="content">
            <ul>{mapbox(this.props.box)}</ul>    
           </div>
        </div>
    }
}

export const start = (element: HTMLElement, box: Box<any>) =>
    ReactDOM.render(<Inspector box={box} />, element)