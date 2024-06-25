import {ModalTemplate} from "../ui/Modal";
import Icon from "../icons/Icon";
import RocketLaunch from "../icons/svg/RocketLaunch";
import {createEffect, createSignal, Setter} from "solid-js";
import {getApi} from "../../api/Api";
import {Bot} from "../../types/user";
import {useNavigate} from "@solidjs/router";

export default function CreateBotModal(props: {
  setBots: Setter<Bot[] | null>,
  setShow: Setter<boolean>,
}) {
  const api = getApi()!
  const navigate = useNavigate()

  const [handle, setHandle] = createSignal<string>("")
  const [name, setName] = createSignal<string>("")

  createEffect(() => {
    setHandle(name().toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
  })

  const [error, setError] = createSignal<string>("")
  const [focused, setFocused] = createSignal(false)
  const [submitting, setSubmitting] = createSignal(false)

  const createBot = async (e: SubmitEvent) => {
    e.preventDefault()

    setSubmitting(true)
    const json = { username: handle(), display_name: name() }
    const response = await api.request('POST', '/bots', { json })
    setSubmitting(false)

    if (!response.ok)
      return setError(response.errorJsonOrThrow().message)

    const data = response.jsonOrThrow() as Bot & { token: string }
    props.setBots(bots => bots ? [...bots, data] : [data])
    props.setShow(false)
    navigate(`/settings/bots/${data.user.id}`, { state: { token: data.token } })
  }

  return (
    <ModalTemplate title="Create Bot">
      <p class="text-sm text-center mt-2 mb-4 text-danger">{error()}</p>

      <form onSubmit={createBot}>
        <label class="text-sm font-bold uppercase text-fg/50 mx-1 mb-1" for="name">Name</label>
        <input
          name="name"
          type="text"
          class="w-full bg-0 rounded-lg text-sm font-medium p-3 outline-none focus:ring-2 mb-4 ring-accent"
          placeholder="My Fancy Bot"
          minLength={1}
          maxLength={32}
          value={name()}
          onInput={(event) => setName(event.currentTarget.value)}
          required
        />

        <label class="text-sm font-bold uppercase text-fg/50 mx-1 mb-1" for="handle">Handle</label>
        <div classList={{
          "flex rounded-lg w-full overflow-hidden ring-2 transition": true,
          "ring-accent": focused(),
          "ring-transparent": !focused(),
        }}>
          <span class="flex-shrink-0 bg-0 flex items-center pl-2">
            <img src={api.cache!.clientAvatar} alt="" class="w-8 h-8 rounded-full" />
            <span class="pl-2 text-lg">/</span>
          </span>
          <input
            name="handle"
            type="text"
            class="w-full bg-0 text-sm font-medium pl-1 pr-3 py-3 outline-none"
            placeholder="my-fancy-bot"
            minLength={2}
            maxLength={32}
            value={handle()}
            onInput={(event) => setHandle(event.currentTarget.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required
          />
        </div>
        <div class="text-xs text-light pt-1 px-1 text-fg/60">
          Bot handles are used to uniquely identify your bot in Adapt.
        </div>

        <button
          type="submit"
          class="btn btn-primary w-full mt-4"
          disabled={submitting()}
        >
          <Icon icon={RocketLaunch} class="w-4 h-4 fill-fg mr-2" />
          Create Bot
        </button>
      </form>

    </ModalTemplate>
  )
}