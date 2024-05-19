import {getApi} from "../../api/Api";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import {createEffect, createSignal, createUniqueId, on, Show} from "solid-js";
import Icon, {IconElement} from "../../components/icons/Icon";
import PenToSquare from "../../components/icons/svg/PenToSquare";
import Check from "../../components/icons/svg/Check";
import Xmark from "../../components/icons/svg/Xmark";
import Header from "../../components/ui/Header";
import EditableAvatar from "../../components/settings/EditableAvatar";
import Code from "../../components/icons/svg/Code";
import StatusIndicator from "../../components/users/StatusIndicator";
import At from "../../components/icons/svg/At";
import IdCardClip from "../../components/icons/svg/IdCardClip";
import Spinner from "../../components/icons/svg/Spinner";
import Envelope from "../../components/icons/svg/Envelope";
import Eye from "../../components/icons/svg/Eye";
import EyeSlash from "../../components/icons/svg/EyeSlash";
noop(tooltip)

enum EditingState {
  NotEditing,
  Editing,
  Saving,
}

export default function Account() {
  const api = getApi()!
  const clientUser = () => api.cache!.clientUser!
  const formId = createUniqueId()

  let usernameInputRef: HTMLInputElement | null = null
  let displayNameInputRef: HTMLInputElement | null = null
  const [editing, setEditing] = createSignal(EditingState.NotEditing)
  const [error, setError] = createSignal<string>()

  let initial = {
    username: false,
    displayName: false,
    avatar: false,
  }
  const [changed, setChanged] = createSignal(initial)
  const updateChanged = () => setChanged({
    username: usernameInputRef?.value !== clientUser().username,
    displayName: displayNameInputRef?.value !== clientUser().display_name,
    avatar: avatarData() !== null,
  })
  const anyChanged = () => Object.values(changed()).some(Boolean)

  const [avatarData, setAvatarData] = createSignal<string | null>(null)
  createEffect(on(avatarData, () => {
    if (!avatarData()) return
    setEditing(EditingState.Editing)
    updateChanged()
  }))

  const [showEmail, setShowEmail] = createSignal(false)

  const submitEdit = async (e: Event) => {
    e.preventDefault()
    if (editing() != EditingState.Editing || !anyChanged()) return
    const diff = changed()
    const json: any = {}

    if (diff.username) {
      json.username = usernameInputRef!.value
      if (!json.username) return setError("Username cannot be empty")
    }
    if (diff.displayName) {
      json.display_name = displayNameInputRef!.value
      if (!json.display_name) return setError("Display name cannot be empty")
    }
    if (diff.avatar)
      json.avatar = avatarData()

    setEditing(EditingState.Saving)
    const response = await api.request('PATCH', '/users/me', { json })
    if (!response.ok) {
      return setError(response.errorJsonOrThrow().message)
    }

    setEditing(EditingState.NotEditing)
  }

  return (
    <div class="flex flex-col w-full px-2 py-4">
      <Header>Account</Header>
      <div class="relative flex flex-col items-center overflow-hidden rounded-xl w-full">
        <div class="flex items-center bg-bg-0/90 w-full">
          <div class="indicator m-4">
            <StatusIndicator status={api.cache?.presences.get(api.cache!.clientId!)?.status} indicator tailwind="w-4 h-4 m-2" />
            <EditableAvatar setImageData={setAvatarData}>
              <img src={avatarData() ?? api.cache!.clientAvatar} alt="" class="w-16 h-16" />
            </EditableAvatar>
          </div>
          <div class="flex flex-col justify-center">
            <span class="font-medium text-xl font-title mb-0.5">{clientUser().username}</span>
            <span
              class="font-medium text-sm text-fg/50 font-mono flex items-center gap-x-1 cursor-pointer"
              use:tooltip="Copy User ID"
              onClick={() => navigator.clipboard.writeText(clientUser().id.toString())}
            >
              <Icon icon={Code} class="w-4 h-4 fill-fg/50" />
              {clientUser().id.toString()}
            </span>
          </div>
          <div class="flex absolute right-4 top-4 gap-x-2">
            <Show when={editing() != EditingState.NotEditing && anyChanged()}>
              <button
                type="submit"
                form={formId}
                class="select-none transition duration-200 animate-pulse disabled:animate-spin hover:animate-none"
                disabled={editing() == EditingState.Saving}
              >
                <Icon
                  icon={editing() == EditingState.Saving ? Spinner : Check}
                  class="w-6 h-6 fill-fg"
                  title="Save"
                  tooltip={{ content: "Save", placement: 'left' }}
                />
              </button>
            </Show>
            <button
              class="select-none opacity-60 hover:opacity-100 transition duration-200"
              onClick={() => {
                setEditing(prev =>
                  prev == EditingState.NotEditing ? EditingState.Editing : EditingState.NotEditing
                )
                if (!editing()) {
                  setChanged({...initial})
                  setError("")
                  usernameInputRef!.value = clientUser().username
                  displayNameInputRef!.value = clientUser().display_name ?? ""
                  setAvatarData(null)
                }
              }}
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
        <form class="flex flex-col gap-y-4 items-center p-4 bg-bg-1/60 w-full" id={formId} onSubmit={submitEdit}>
          <AccountField
            ref={usernameInputRef}
            name="username"
            label="Username"
            icon={At}
            autocomplete="username"
            value={clientUser().username}
            placeholder="Username"
            editing={editing()}
            onInput={updateChanged}
          />
          <AccountField
            ref={displayNameInputRef}
            name="display_name"
            label="Display Name"
            icon={IdCardClip}
            autocomplete="username"
            value={clientUser().display_name || clientUser().username}
            placeholder={editing() ? "Display Name" : clientUser().display_name || clientUser().username}
            editing={editing()}
            onInput={updateChanged}
          />
        </form>
        <Show when={error()} keyed={false}>
          <p class="p-3 text-sm bg-danger/20 text-danger w-full">{error()}</p>
        </Show>
      </div>
      <h2 class="pt-6 pb-3 px-2 font-title font-bold text-xl">Credentials</h2>
      <div class="flex items-center">
        <div class="p-4 rounded-full bg-bg-0/80">
          <Icon icon={Envelope} class="w-6 h-6 fill-fg/80" />
        </div>
        <div class="flex flex-col flex-grow">
          <h3 class="px-2 font-bold text-sm uppercase text-fg/60">Email</h3>
          <p class="px-2 text-fg/80 flex gap-x-2 items-center">
            {showEmail() ? clientUser().email : '********' + clientUser().email?.slice(clientUser().email?.lastIndexOf('@'))}
            <Icon
              icon={showEmail() ? Eye : EyeSlash}
              tooltip={showEmail() ? 'Hide Email' : 'Show Email'}
              class="w-5 h-5 fill-fg/50 cursor-pointer"
              onClick={() => setShowEmail(p => !p)}
            />
          </p>
        </div>
      </div>
    </div>
  )
}

interface FieldProps {
  ref: HTMLInputElement | null
  name: string
  label: string
  icon: IconElement
  autocomplete: 'username'
  value: string
  placeholder: string
  editing: EditingState
  onInput: () => void
}

function AccountField(props: FieldProps) {
  return (
    <div class="flex items-center gap-x-2.5 w-full">
      <div class="p-3 rounded-full bg-3">
        <Icon icon={props.icon} class="w-6 h-6 fill-fg/50" />
      </div>
      <div class="flex flex-col flex-grow">
        <label for={props.name} class="font-bold text-xs uppercase text-fg/60">{props.label}</label>
        <input
          ref={props.ref!}
          type="text"
          name={props.name}
          autocomplete={props.autocomplete}
          minLength={2}
          maxLength={32}
          placeholder={props.placeholder}
          required
          value={props.value}
          classList={{
            "text-xl text-fg bg-transparent transition outline-none border-b-2 focus:border-accent": true,
            [props.editing != EditingState.NotEditing ? "border-fg/10 text-opacity-100" : "border-transparent text-opacity-80"]: true,
          }}
          onInput={props.onInput}
          disabled={props.editing == EditingState.NotEditing}
        />
      </div>
    </div>
  )
}
