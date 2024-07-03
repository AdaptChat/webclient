import {createContext, JSX} from "solid-js";

export interface Popover {
  element: JSX.Element
  relativeTo: HTMLElement
}

export const PopoverContext = createContext<Popover | null>(null)

export function PopoverProvider(props: { children: JSX.Element }) {
  return (
    <PopoverContext.Provider value={null}>{props.children}</PopoverContext.Provider>
  )
}
