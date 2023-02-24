import tippy, {Props} from "tippy.js";
import {createEffect} from "solid-js";

export default function tooltip(element: HTMLElement, accessor: () => string | Partial<Props>) {
  createEffect(() => {
    const value = accessor()
    if (!value) return

    const props = typeof value === 'string' ? { content: value } : value
    tippy(element,  {
      arrow: true,
      animation: 'shift-away',
      ...props
    })
  })
}
