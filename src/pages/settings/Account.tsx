import {getApi} from "../../api/Api";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import {createSignal, createUniqueId, Show} from "solid-js";
import Icon from "../../components/icons/Icon";
import PenToSquare from "../../components/icons/svg/PenToSquare";
import Check from "../../components/icons/svg/Check";
import Xmark from "../../components/icons/svg/Xmark";
import Header from "../../components/ui/Header";
noop(tooltip)

export default function Account() {
  const api = getApi()!
  const clientUser = () => api.cache!.clientUser!
  const formId = createUniqueId()

  let usernameInputRef: HTMLInputElement | null = null
  let displayNameInputRef: HTMLInputElement | null = null
  const [editing, setEditing] = createSignal(false)
  const [error, setError] = createSignal<string>()
  const [changed, setChanged] = createSignal(false)
  const updateChanged = () => setChanged(
    usernameInputRef?.value !== clientUser().username
    || displayNameInputRef?.value !== clientUser().username
  )

  return (
    <div class="flex flex-col items-center w-full px-2 py-4">
      <Header>Account</Header>
      <div class="relative flex items-center p-2 bg-bg-1/80 rounded-xl w-full">
        <button
          class="group relative m-4 rounded-[50%] hover:rounded-lg overflow-hidden transition-all duration-200"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/png, image/jpeg, image/gif'
            input.onchange = async () => {
              const file = input.files![0]
              if (!file) return

              const reader = new FileReader()
              reader.onload = async () => {
                const data = reader.result as string
                await api.request('PATCH', '/users/me', {
                  json: { avatar: data },
                })
              }
              reader.readAsDataURL(file)
            }
            input.click()
          }}
        >
          <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur rounded-lg
              opacity-0 group-hover:opacity-100 transition duration-200"
          >
            <Icon icon={PenToSquare} class="w-6 h-6 fill-fg" title="Edit Avatar" />
            <span class="uppercase font-bold text-xs mt-1">Edit</span>
          </div>
          <img src={api.cache!.clientAvatar} alt="" class="w-20 h-20" />
        </button>
        <form
          id={formId}
          class="flex flex-col justify-center"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!editing() || !changed()) return

            const username = usernameInputRef!.value
            if (!username) return

            const response = await api.request('PATCH', '/users/me', {
              json: { username },
            })
            if (!response.ok) {
              return setError(response.errorJsonOrThrow().message)
            }

            setEditing(false)
          }}
        >
          <div>
            <span class="font-medium text-2xl">{clientUser().username}</span>
          </div>
          <span class="font-medium text-sm text-fg/50">{clientUser().email}</span>
        </form>
        <div class="flex absolute right-4 top-4 gap-x-2">
          <Show when={editing() && changed()} keyed={false}>
            <button type="submit" form={formId} class="select-none opacity-60 hover:opacity-100 transition duration-200">
              <Icon
                icon={Check}
                class="w-6 h-6 fill-fg"
                title="Save"
                tooltip={{ content: "Save", placement: 'left' }}
              />
            </button>
          </Show>
          <button
            class="select-none opacity-60 hover:opacity-100 transition duration-200"
            onClick={() => setEditing(prev => !prev)}
          >
            <Icon
              icon={editing() ? Xmark : PenToSquare}
              class="w-6 h-6 fill-fg"
              title={editing() ? "Cancel" : "Edit"}
              tooltip={{ content: editing() ? "Cancel" : "Edit", placement: 'left' }}
            />
          </button>
        </div>
      </div>
      <Show when={error()} keyed={false}>
        <p class="px-1 py-2 text-danger w-full">{error()}</p>
      </Show>
    </div>
  )
}
