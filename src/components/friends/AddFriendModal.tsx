import {ModalTemplate} from "../ui/Modal";
import {createEffect, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import {getApi} from "../../api/Api";
import {User} from "../../types/user";
import {RelationshipCreateEvent} from "../../types/ws";
import Icon from "../icons/Icon";
import Check from "../icons/svg/Check";
import Plus from "../icons/svg/Plus";
import {displayName} from "../../utils";

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
      if (relationship.type === 'outgoing_request')
        setNewRequests((old) => [...old, relationship.user].slice(-5))
    }))
  })

  onCleanup(() => unsubscribe()?.())

  return (
    <ModalTemplate title="Add Friend">
      <p class="mt-2 text-base-content/50 text-center text-sm">
        Ask your friend to give you their unique username.
        It can be found at the bottom of the left sidebar, and you can copy it by clicking on it.
      </p>
      <form
        class="mt-4 flex rounded-lg overflow-hidden"
        onSubmit={async (e) => {
          e.preventDefault()
          const username = inputRef!.value

          if (!/^[a-zA-Z0-9][a-zA-Z0-9.\-_]{0,30}[a-zA-Z0-9]$/.test(username)) {
            setError("Invalid username format. Make sure this is the username (not display name).")
            return
          }

          submitRef!.disabled = true

          const response = await api.request('POST', '/relationships/friends', {
            json: { username },
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
        <span class="bg-gray-900 text-base-content/80 font-title flex items-center pl-2 font-bold text-xl">@</span>
        <input
          ref={inputRef!}
          type="text"
          name="tag"
          autocomplete="off"
          class="flex-1 p-2 bg-gray-900 focus:outline-none"
          placeholder="Username"
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
          <Icon
            icon={added() ? Check : Plus}
            title="Copy to clipboard"
            class="w-4 h-4 fill-base-content"
          />
        </button>
      </form>
      <Show when={error()} keyed={false}>
        <p class="mt-1 ml-1 text-sm text-error">{error()}</p>
      </Show>
      <Show when={newRequests().length > 0} keyed={false}>
        <div class="flex flex-col gap-y-2 mt-4">
          <For each={newRequests()}>
            {(user: User) => (
              <span class="inline-flex items-center flex-wrap text-base-content/70">
                <Icon icon={Check} class="w-4 h-4 mr-2 fill-base-content opacity-70 select-none" />
                Requested to add
                <span class="flex bg-gray-900 rounded-lg p-1 mx-1">
                  <img
                    src={api.cache?.avatarOf(user.id)}
                    alt=""
                    class="w-6 h-6 rounded-full mr-1 select-none"
                  />
                  {displayName(user)}
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
