import {ModalTemplate} from "../ui/Modal";
import {createEffect, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import {getApi} from "../../api/Api";
import {User} from "../../types/user";
import {RelationshipCreateEvent} from "../../types/ws";

export default function AddFriendModal() {
  let inputRef: HTMLInputElement | null = null
  let submitRef: HTMLButtonElement | null = null

  const api = getApi()!
  const [added, setAdded] = createSignal(false)
  const [newRequests, setNewRequests] = createSignal<User[]>([])
  const [unsubscribe, setUnsubscribe] = createSignal<() => void>()
  const [error, setError] = createSignal<string>()

  createEffect(() => {
    if (added()) {
      setTimeout(() => setAdded(false), 1000)
      setError()
    }
  })

  onMount(() => {
    setUnsubscribe(() => api.ws?.on('relationship_create', ({ relationship }: RelationshipCreateEvent) => {
      setNewRequests((old) => [...old, relationship.user])
    }))
  })

  onCleanup(() => unsubscribe()?.())

  return (
    <ModalTemplate title="Add Friend">
      <p class="mt-2 text-base-content/50">
        Ask your friend to give you their unique user tag, which contains their username and discriminator.
        This can be found at the bottom of the sidebar on the left.
      </p>
      <form
        class="mt-4 flex rounded-lg overflow-hidden"
        onSubmit={async (e) => {
          e.preventDefault()
          const tag = inputRef!.value

          if (!/[^#\n\t\r]{2,}#\d{4}/.test(tag)) {
            setError("Invalid tag, make sure it is in the format of Username#0000")
            return
          }

          submitRef!.disabled = true
          const username = tag.slice(0, -5)
          const discriminator = parseInt(tag.slice(-4))

          const response = await api.request('POST', '/relationships/friends', {
            json: { username, discriminator },
          })
          if (!response.ok) {
            setError(response.errorJsonOrThrow().message)
            submitRef!.disabled = false
            return
          }
          setAdded(true)
          inputRef!.value = ""
          submitRef!.disabled = false
        }}
      >
        <input
          ref={inputRef!}
          type="text"
          name="tag"
          autocomplete="off"
          class="flex-1 p-2 bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Username#0000"
          onInput={() => setError()}
          required
        />
        <button
          ref={submitRef!}
          type="submit"
          classList={{
            "flex items-center justify-center transition-all duration-200 p-2 w-10 h-10": true,
            "bg-gray-700 hover:bg-accent": !added(),
            "bg-success": added(),
          }}
        >
          <img
            src={added() ? "/icons/check.svg" : "/icons/plus.svg"}
            alt="Copy to clipboard"
            class="w-4 h-4 invert"
            width={20}
          />
        </button>
      </form>
      <Show when={error()} keyed={false}>
        <p class="mt-2 text-error">{error()}</p>
      </Show>
      <Show when={newRequests().length > 0} keyed={false}>
        <div class="flex flex-col gap-y-2 mt-4">
          <For each={newRequests()}>
            {(user: User) => (
              <span class="flex items-center text-base-content/70">
              <img src="/icons/check.svg" alt="" class="w-4 h-4 mr-2 invert opacity-70 select-none"/>
              Requested to add
              <span class="flex bg-gray-900 rounded-lg p-1 mx-1">
                <img
                  src={api.cache?.avatarOf(user.id)}
                  alt=""
                  class="w-6 h-6 rounded-full mr-1 select-none"
                />
                {user.username}
                <span class="text-base-content/50">#{user.discriminator}</span>
              </span>
              as a friend.
            </span>
            )}
          </For>
        </div>
      </Show>
    </ModalTemplate>
  )
}
