import {ModalTemplate} from "../ui/Modal";
import {createEffect, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import {getApi} from "../../api/Api";
import {User} from "../../types/user";
import {RelationshipCreateEvent} from "../../types/ws";
import Icon from "../icons/Icon";
import Check from "../icons/svg/Check";
import Plus from "../icons/svg/Plus";
import {displayName} from "../../utils";
import At from "../icons/svg/At";
import {toast} from "solid-toast";

export default function AddFriendModal() {
  let inputRef: HTMLInputElement | null = null
  let submitRef: HTMLButtonElement | null = null

  const api = getApi()!
  const [added, setAdded] = createSignal(false)
  const [newRequests, setNewRequests] = createSignal<User[]>([])
  const [unsubscribe, setUnsubscribe] = createSignal<() => void>()
  const [error, setError] = createSignal<string>()
  const [copyingUsername, setCopyingUsername] = createSignal(false)

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
      <p class="mt-2 text-fg/50 text-center text-sm">
        Ask your friend to give you their unique username, and enter it below.
      </p>
      <p class="flex items-center mt-1 text-sm w-full justify-center text-fg/70">
        <span>Your username is</span>
        <button
          class="font-medium font-mono bg-0 rounded-lg py-0.5 px-1 ml-1 text-fg/80 hover:bg-3"
          onClick={() => {
            setCopyingUsername(true)
            navigator.clipboard.writeText(api.cache?.clientUser?.username!).then(() => {
              setTimeout(() => setCopyingUsername(false), 1000)
            })
          }}
        >
          <Show when={!copyingUsername()} fallback={(
            <span class="text-success flex items-center gap-x-1">
              <Icon icon={Check} class="w-4 h-4 mr-1 fill-success" />
              Copied!
            </span>
          )}>
            @{api.cache?.clientUser?.username}
          </Show>
        </button>
        .
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
        <span class="bg-0 flex items-center pl-3">
          <Icon icon={At} class="w-4 h-4 fill-fg/80" />
        </span>
        <input
          ref={inputRef!}
          type="text"
          name="tag"
          autocomplete="off"
          class="flex-1 px-1.5 py-2 bg-0 focus:outline-none"
          placeholder="Username"
          onInput={() => setError()}
          required
        />
        <button
          ref={submitRef!}
          type="submit"
          classList={{
            "flex items-center justify-center transition-all duration-200 p-2 w-10 h-10": true,
            "bg-3 hover:bg-accent": !added(),
            "bg-success": added(),
          }}
        >
          <Icon
            icon={added() ? Check : Plus}
            title="Copy to clipboard"
            class="w-4 h-4 fill-fg"
          />
        </button>
      </form>
      <Show when={error()} keyed={false}>
        <p class="mt-1 ml-1 text-sm text-danger">{error()}</p>
      </Show>
      <Show when={newRequests().length > 0} keyed={false}>
        <div class="flex flex-col gap-y-2 mt-4">
          <For each={newRequests()}>
            {(user: User) => (
              <span class="inline-flex items-center flex-wrap text-fg/70">
                <Icon icon={Check} class="w-4 h-4 mr-2 fill-fg opacity-70 select-none" />
                Requested to add
                <span class="flex bg-0 rounded-lg p-1 mx-1">
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
