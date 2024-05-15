import tippy, {Instance, Props} from "tippy.js";
import {createEffect, createSignal, onCleanup} from "solid-js";

export default function tooltip(element: HTMLElement, accessor: () => string | Partial<Props>) {
  const [inst, setInst] = createSignal<Instance>()

  createEffect(() => {
    const value = accessor()
    if (!value) return

    const props = typeof value === 'string' ? { content: value } : value
    setInst(prev => {
      prev?.destroy()
      return tippy(element,  {
        arrow: true,
        animation: 'shift-away',
        theme: 'default',
        ...props
      })
    })
  })

  onCleanup(() => {
    inst()?.destroy()
    setInst()
  })
}
