import {createSignal, onCleanup, onMount} from "solid-js";
import {getApi} from "../api/Api";

export default function Loading() {
  const [timeoutFulfilled, setTimeoutFulfilled] = createSignal(false)
  const [previousKeyPress, setPreviousKeyPress] = createSignal<number | null>(null)

  const api = getApi()!
  const listener = (event: KeyboardEvent) => {
    if (event.key === 'f') {
      if (previousKeyPress() && (Date.now() - previousKeyPress()!) < 500) {
        api.ws?.forceReady()
      }
      setPreviousKeyPress(Date.now())
    }
  }
  onMount(() => {
    window.addEventListener('keypress', listener)
    setTimeout(() => {
      setTimeoutFulfilled(true)
    }, 10_000)
  })
  onCleanup(() => window.removeEventListener('keypress', listener))

  return (
    <>
      <div class="w-full h-full flex flex-col items-center justify-center">
        <img src="/adapt.png" alt="Loading..." class="w-[96px] h-[96px] animate-bounce" width="1024" />
        <p class="font-title text-2xl mt-6 text-fg/60 animate-pulse">Launching...</p>
      </div>
      <p
        class="fixed bottom-16 w-full px-4 text-center text-fg/60 mt-6 transition-all duration-1000 select-none"
        style={{ opacity: timeoutFulfilled() ? 1 : 0 }}
      >
        Is Adapt not launching? The servers at Adapt might be down. Come back a later time!
        <br />
        You can also try checking out our <a href="https://status.adapt.chat" class="text-link">status page</a>.
      </p>
    </>
  )
}
