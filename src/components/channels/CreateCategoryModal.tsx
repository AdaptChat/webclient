import {createSignal, Setter, Show} from "solid-js";
import {ModalTemplate} from "../ui/Modal";
import Icon from "../icons/Icon";
import ChevronLeft from "../icons/svg/ChevronLeft";
import Plus from "../icons/svg/Plus";
import {getApi} from "../../api/Api";
import {useNavigate} from "@solidjs/router";
import {snowflakes} from "../../utils";
import ListTree from "../icons/svg/ListTree";

type Props = { setter: Setter<boolean>, guildId: bigint }

export default function CreateCategoryModal(props: Props) {
  let channelNameRef: HTMLInputElement | null = null
  let api = getApi()!
  let navigate = useNavigate()

  const [focused, setFocused] = createSignal(false)
  const [error, setError] = createSignal<string>()
  const [isSubmitting, setIsSubmitting] = createSignal<boolean>(false)

  return (
    <ModalTemplate title="Create Category">
      <form
        class="flex flex-col justify-end"
        onSubmit={async (event) => {
          event.preventDefault()
          const name = channelNameRef!.value

          setIsSubmitting(true)
          const removeListener = api.ws!.on('channel_create', (data, remove) => {
            if (data.nonce === nonce) {
              remove()
              navigate(`/guilds/${props.guildId}/${data.channel.id}`)
            }
          })

          const nonce = snowflakes.fromTimestamp(Date.now()).toString()
          const response = await api.request('POST', `/guilds/${props.guildId}/channels`, {
            json: { type: 'category', name, nonce }
          })

          setIsSubmitting(false)
          if (!response.ok) {
            removeListener()
            return setError(response.errorJsonOrThrow().message)
          }

          props.setter(false)
        }}
      >
        <label class="mt-5 mb-2 text-fg/50 text-xs ml-0.5 w-96 mobile:w-full" for="name">
          What do you want to name this category?
        </label>
        <div classList={{
          "flex rounded-lg overflow-hidden ring-2 transition": true,
          "ring-accent": focused(),
          "ring-transparent": !focused(),
        }}>
          <span class="bg-0 flex items-center pl-2">
            <Icon icon={ListTree} class="fill-fg w-4 h-4 ml-1 mr-2" />
          </span>
          <input
            ref={channelNameRef!}
            type="text"
            name="name"
            autocomplete="off"
            class="font-medium py-2 pr-2 bg-0 focus:outline-none flex-grow"
            placeholder="My Category"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required
          />
        </div>
        <Show when={error()}>
          <p class="font-medium text-sm text-danger my-1 ml-0.5">
            {error()}
          </p>
        </Show>
        <div class="flex gap-3 mt-3">
          <div class="flex gap-x-2 btn btn-neutral" onClick={() => props.setter(false)}>
            <Icon icon={ChevronLeft} class="fill-neutral-content/60 select-none w-4 h-4" />
            Back
          </div>
          <button
            type="submit"
            class="btn btn-primary flex-grow disabled:bg-accent/50 disabled:text-opacity-50"
            disabled={isSubmitting()}
          >
            <Icon icon={Plus} class="fill-primary-content/80 w-4 h-4 mr-2" />
            <span>Create Category</span>
          </button>
        </div>
      </form>
    </ModalTemplate>
  )
}
