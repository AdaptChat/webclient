import {
  createContext,
  createEffect,
  createSignal,
  JSX,
  onCleanup,
  onMount,
  ParentProps,
  Signal,
  useContext
} from "solid-js";

export const HeaderContext = createContext<Signal<JSX.Element[]>>()

export function HeaderContextProvider(props: ParentProps) {
  const signal = createSignal([] as JSX.Element[])
  return (
    <HeaderContext.Provider value={signal}>
      {props.children}
    </HeaderContext.Provider>
  )
}

export default function Header(props: ParentProps) {
  const [_header, setHeader] = useContext(HeaderContext)!
  const [index, setIndex] = createSignal(-1)

  onMount(() => setHeader(prev => {
    setIndex(prev.length)
    return [...prev, props.children]
  }))
  createEffect(() => setHeader(prev => {
    prev[index()] = props.children
    return [...prev]
  }))
  onCleanup(() => setHeader(prev => {
    prev.splice(index(), 1)
    return [...prev]
  }))

  return null
}
