import {Accessor, ParentProps, Setter, Signal} from "solid-js";

export default function Modal({ get, set, children }: ParentProps<{ get: Accessor<boolean>, set: Setter<boolean> }>) {
  return (
    <div
      classList={{
        [
          "absolute flex items-center justify-center bg-black/50 backdrop-blur w-full h-full inset-0"
          + " transition-all duration-200"
        ]: true,
        "opacity-0 z-[-90]": !get(),
        "opacity-100 z-[9999]": get(),
      }}
      onClick={(event) => event.currentTarget == event.target && set(false)}
    >
      <div classList={{
        "relative bg-gray-800 p-6 rounded-lg transition-all duration-200": true,
        "scale-50": !get(),
        "scale-100": get(),
      }}>
        <button>
          <img
            src="/icons/xmark.svg"
            alt="Close Modal"
            class="w-5 h-5 invert absolute right-4 top-4 select-none opacity-50 hover:opacity-100 transition-all duration-200"
            width={20}
            onClick={() => set(false)}
          />
        </button>
        {children}
      </div>
    </div>
  )
}
