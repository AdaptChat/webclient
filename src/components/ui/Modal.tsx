import {Accessor, createEffect, createSignal, ParentProps, Setter} from "solid-js";
import Icon from "../icons/Icon";
import Xmark from "../icons/svg/Xmark";
import {Portal} from "solid-js/web";

export default function Modal({ get, set, children }: ParentProps<{ get: Accessor<boolean>, set: Setter<boolean> }>) {
  const [invisible, setInvisible] = createSignal(true)
  createEffect(() => {
    if (get()) setInvisible(false)
    else setTimeout(() => setInvisible(true), 200)
  })

  return (
    <Portal>
      <div
        classList={{
          [
            "flex absolute items-center justify-center bg-black/50 backdrop-blur w-full h-full inset-0"
            + " transition-all duration-200 font-sans text-fg"
          ]: true,
          "opacity-0 z-[-90]": !get(),
          "opacity-100 z-[9999]": get(),
          "invisible": invisible(),
          "visible": !invisible(),
        }}
        onClick={(event) => event.currentTarget == event.target && set(false)}
      >
        <div classList={{
          "relative bg-2 p-6 rounded-lg max-w-xl transition-all duration-200 mx-2": true,
          "scale-50": !get(),
          "scale-100": get(),
        }}>
          <button>
            <Icon
              icon={Xmark}
              title="Close Modal"
              class="w-5 h-5 fill-fg absolute right-4 top-4 select-none opacity-50 hover:opacity-100 transition-all duration-200"
              onClick={() => set(false)}
            />
          </button>
          {children}
        </div>
      </div>
    </Portal>
  )
}

export function ModalTemplate({ title, children }: ParentProps<{ title: string }>) {
  return (
    <>
      <h1 class="text-2xl font-title font-bold text-center">{title}</h1>
      {children}
    </>
  )
}

export function createPaginatedModalSignal<Page>(
  setPage: Setter<Page>,
  defaultPage: Exclude<Page, Function> | ((prev: Page) => Page),
) {
  const [showNewServerModal, _setShowNewServerModal] = createSignal(false)

  function setShowNewServerModal<U extends boolean>(value: U | ((previous: boolean) => U)) {
    return _setShowNewServerModal(prev => {
      value = typeof value === 'function' ? value(prev) : value
      if (value) setPage(defaultPage)
      return value
    })
  }

  return [showNewServerModal, setShowNewServerModal] as const
}
