import Header from "../../components/ui/Header";
import {A, useLocation, useParams} from "@solidjs/router";
import Icon from "../../components/icons/Icon";
import ChevronLeft from "../../components/icons/svg/ChevronLeft";
import {getApi} from "../../api/Api";
import {createEffect, createSignal, onMount, ParentProps, Show} from "solid-js";
import {type Bot as BotType} from "../../types/user";
import EditableAvatar from "../../components/settings/EditableAvatar";
import {defaultAvatar} from "../../api/ApiCache";
import {useSaveTask} from "./SettingsLayout";
import tooltip from "../../directives/tooltip";
import {toast} from "solid-toast";
import Key from "../../components/icons/svg/Key";
import Clipboard from "../../components/icons/svg/Clipboard";
void tooltip

function BriefInfo(props: ParentProps<{ label: string, copyText?: string }>) {
  return (
    <button
      class="text-left mt-4"
      onClick={() => props.copyText && toast.promise(window.navigator.clipboard.writeText(props.copyText), {
        loading: 'Copying...',
        success: 'Copied!',
        error: 'Failed to Copy',
      })}
      use:tooltip={{ content: "Click to Copy", placement: 'left' }}
    >
      <h2 class="text-sm font-bold uppercase text-fg/60">{props.label}</h2>
      <p class="text-fg/60 font-light">{props.children}</p>
    </button>
  )
}

export default function Bot() {
  const api = getApi()!
  const params = useParams()
  const location = useLocation<{ token: string }>()

  const [bot, setBot] = createSignal<BotType | null>(null)
  const [token, setToken] = createSignal<string | undefined>(location.state?.token ?? 'Āwerfhweuiorhweruidweghuriogweuiodfwegruiowegriuofwegfweuiodfgcweuiotfgweuiofwgeiorufgsdwuifwgeiug')

  const [imageData, setImageData] = createSignal<string | null | undefined>(undefined)

  onMount(async () => {
    const response = await api.request('GET', `/bots/${params.botId}`)
    if (response.ok)
      setBot(response.jsonOrThrow())
  })

  const [displayName, setDisplayName] = createSignal<string>("")
  const [error, setError] = createSignal<string>("")

  const refreshState = () => {
    setDisplayName(bot()?.user.display_name ?? "")
    setImageData(undefined)
  }
  createEffect(refreshState)

  const [setChanged] = useSaveTask(
    async () => {
      const json = {} as Record<string, any>
      const original = bot()!.user

      if (displayName() !== original.display_name) json.display_name = displayName()
      if (imageData() !== undefined) json.avatar = imageData()

      const response = await api.request('PATCH', `/bots/${params.botId}`, { json })
      if (!response.ok)
        return void setError(response.errorJsonOrThrow().message)
    },
    refreshState,
  )
  createEffect(() => setChanged(
    displayName() !== bot()!.user.display_name
    || imageData() !== undefined
  ))

  const copyToken = () => toast.promise(
    window.navigator.clipboard.writeText(token()!),
    { loading: 'Copying...', success: 'Copied!', error: 'Failed to Copy' },
  )

  return (
    <div class="p-4">
      <Header>Bots</Header>
      <A href="/settings/bots" class="btn btn-sm mr-2">
        <Icon icon={ChevronLeft} class="w-4 h-4 fill-fg" />
        Back
      </A>
      <Show when={bot()} fallback="Loading...">
        <div class="flex mt-2 mobile:flex-col gap-4">
          <div class="flex flex-col flex-shrink-0 items-center">
            <EditableAvatar setImageData={setImageData}>
              <img
                src={
                  (imageData() === undefined ? bot()!.user.avatar  : imageData()) ?? defaultAvatar(BigInt(params.botId))
                }
                alt="Avatar"
                class="rounded-full w-24 h-24"
              />
            </EditableAvatar>
            <Show when={imageData() != null || imageData() === undefined && bot()!.user.avatar != null}>
              <button
                class="text-fg/60 hover:text-fg/100 transition text-sm mt-1"
                onClick={() => setImageData(null)}
              >
                Remove
              </button>
            </Show>
          </div>
          <div class="flex-grow">
            <label for="name" class="text-sm font-bold uppercase text-fg/60">Name</label>
            <input
              type="text"
              name="name"
              class="input w-full mt-1"
              placeholder="Bot Name"
              value={displayName()}
              onInput={(e) => setDisplayName(e.currentTarget.value)}
            />
            <div class="w-full grid gap-2 grid-cols-2 mobile:grid-cols-1">
              <BriefInfo label="Handle" copyText={bot()!.user.username}>
                @{bot()!.user.username}
              </BriefInfo>
              <BriefInfo label="User ID" copyText={bot()!.user.id.toString()}>
                {bot()!.user.id.toString()}
              </BriefInfo>
            </div>
          </div>
        </div>
        <h2 class="text-sm font-bold uppercase text-fg/60 mt-6">Token</h2>
        <p class="font-light text-sm my-2 text-fg/60">
          Tokens are used to authenticate your bot with Adapt. Do not share tokens with anyone.
        </p>
        <Show when={token()}>
          <p class="font-light text-sm my-2 text-fg/60">
            Copy this token now as it will not be shown again. If you lose it, you will need to regenerate a new one.
          </p>
        </Show>
        <div class="flex flex-col gap-2 items-start w-full">
          <Show when={token()}>
            <button
              class="group p-4 rounded-lg bg-0 hover:bg-fg/10 text-fg/60 hover:text-fg/100 transition w-full text-left truncate"
              onClick={copyToken}
            >
              <span class="group-hover:hidden">{token()!.slice(0, 12)}{'*'.repeat(token()!.length - 12)}</span>
              <span class="hidden group-hover:block">{token()}</span>
            </button>
          </Show>
          <div class="flex gap-2 mobile:flex-col w-full">
            <Show when={token()}>
              <button class="btn" onClick={copyToken}>
                <Icon icon={Clipboard} class="w-4 h-4 fill-fg mr-2" />
                Copy Token
              </button>
            </Show>
            <button class="btn btn-primary" onClick={async () => {
              const response = await api.request('POST', `/bots/${params.botId}/tokens`)
              if (response.ok) {
                setToken(response.jsonOrThrow().token)
                toast.success('Token Regenerated!')
              } else
                setError(response.errorJsonOrThrow().message)
            }}>
              <Icon icon={Key} class="w-4 h-4 fill-fg mr-2" />
              Regenerate Token
            </button>
          </div>
        </div>
        <Show when={error()}>
          <p class="text-danger mt-2">{error()}</p>
        </Show>
      </Show>
    </div>
  )
}