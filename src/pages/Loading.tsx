import {createSignal, onMount} from "solid-js";

export default function Loading() {
  const [timeoutFulfilled, setTimeoutFulfilled] = createSignal(false)

  onMount(() => {
    setTimeout(() => {
      setTimeoutFulfilled(true)
    }, 10_000)
  })

  return (
    <>
      <div class="w-full h-full flex flex-col items-center justify-center">
        <img src="/adapt.png" alt="Loading..." class="w-[96px] h-[96px] animate-bounce" width="1024" />
        <p class="font-title text-2xl mt-6 text-white text-opacity-60 animate-pulse">Launching...</p>
      </div>
      <p
        class="fixed bottom-16 w-full mx-4 text-center text-gray-400 mt-6 transition-all duration-1000 select-none"
        style={{ opacity: timeoutFulfilled() ? 1 : 0 }}
      >
        Is Adapt not launching? The servers at Adapt might be down. Come back a later time!
        <br />
        You can also try checking out our <a href="https://status.adapt.chat" class="text-link">status page</a>.
      </p>
    </>
  )
}
