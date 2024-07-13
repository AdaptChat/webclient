import {createSignal, Show, Signal} from "solid-js";
import {ModalTemplate, useModal} from "../ui/Modal";
import Icon, {IconElement} from "../icons/Icon";
import Hashtag from "../icons/svg/Hashtag";
import ChevronLeft from "../icons/svg/ChevronLeft";
import Plus from "../icons/svg/Plus";
import Volume from "../icons/svg/Volume";
import {getApi} from "../../api/Api";
import {useNavigate} from "@solidjs/router";
import {snowflakes} from "../../utils";

type Props = { guildId: bigint, parentId?: bigint | null }

function ChannelTypeButton(props: {
  type: string, name: string, description: string, signal: Signal<string>
}) {
  const [channelType, setChannelType] = props.signal

  return (
    <div
      classList={{
        "flex items-center rounded-lg border-2 px-4 py-2 transition cursor-pointer": true,
        "border-accent": channelType() === props.type,
        "border-fg/10 hover:border-fg/50": channelType() !== props.type,
      }}
      onClick={() => setChannelType(props.type)}
    >
      <span>
        <Icon icon={getIcon(props.type)} class="fill-fg/70 w-5 h-5" />
      </span>
      <div class="flex flex-col ml-4">
        <p class="font-bold font-title">{props.name}</p>
        <p class="text-fg/70 text-sm">{props.description}</p>
      </div>
    </div>
  )
}

export function getIcon(type: string): IconElement {
  switch (type) {
    case 'text': return Hashtag
    case 'voice': return Volume
    default: return Hashtag
  }
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getPlaceholderCandidates(type: string): string[] {
  switch (type) {
    case 'text': return ['off-topic', 'media', 'gaming', 'memes', 'support']
    case 'voice': return ['General', 'Music', 'Gaming']
    default: return ['general']
  }
}

export default function CreateChannelModal(props: Props) {
  let channelNameRef: HTMLInputElement | null = null, signal: Signal<string>
  let api = getApi()!
  let navigate = useNavigate()
  let {hideModal} = useModal()

  const [focused, setFocused] = createSignal(false)
  const [channelType, _] = signal = createSignal<string>('text')
  const [error, setError] = createSignal<string>()
  const [isSubmitting, setIsSubmitting] = createSignal<boolean>(false)

  return (
    <ModalTemplate title="Create Channel">
      <form
        class="flex flex-col justify-end"
        onSubmit={async (event) => {
          event.preventDefault()
          const name = channelNameRef!.value
          const type = channelType()

          if (type === 'voice') {
            return setError('Voice channels are not supported yet.')
          }

          setIsSubmitting(true)
          const removeListener = api.ws!.on('channel_create', (data, remove) => {
            if (data.nonce === nonce) {
              remove()
              navigate(`/guilds/${props.guildId}/${data.channel.id}`)
            }
          })

          const nonce = snowflakes.fromTimestamp(Date.now()).toString()
          const response = await api.request('POST', `/guilds/${props.guildId}/channels`, {
            json: { type, name, parent_id: props.parentId, nonce }
          })

          setIsSubmitting(false)
          if (!response.ok) {
            removeListener()
            return setError(response.errorJsonOrThrow().message)
          }

          hideModal()
        }}
      >
        <p class="text-fg/70 text-center text-sm mt-4">
          Channels are where your members communicate.
        </p>
        <label class="mt-5 mb-2 text-fg/50 text-xs ml-0.5" for="type">
          What type of channel do you want to create?
        </label>
        <div class="flex flex-col gap-2">
          <ChannelTypeButton
            type="text"
            name="Text"
            description="Send messages and communicate in a classic text-based channel."
            signal={signal}
          />
          <ChannelTypeButton
            type="voice"
            name="Voice"
            description="Talk and stream with voice and video in a voice channel."
            signal={signal}
          />
        </div>
        <label class="mt-5 mb-2 text-fg/50 text-xs ml-0.5" for="name">
          What do you want to name this channel?
        </label>
        <div classList={{
          "flex rounded-lg overflow-hidden ring-2 transition": true,
          "ring-accent": focused(),
          "ring-transparent": !focused(),
        }}>
          <span class="bg-0 flex items-center pl-2">
            <Icon icon={getIcon(channelType())} class="fill-fg w-4 h-4 ml-1 mr-2" />
          </span>
          <input
            ref={channelNameRef!}
            type="text"
            name="name"
            autocomplete="off"
            class="font-medium py-2 pr-2 bg-0 focus:outline-none flex-grow"
            placeholder={randomChoice(getPlaceholderCandidates(channelType()))}
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
          <div class="flex gap-x-2 btn btn-neutral" onClick={hideModal}>
            <Icon icon={ChevronLeft} class="fill-neutral-content/60 select-none w-4 h-4" />
            Back
          </div>
          <button
            type="submit"
            class="btn btn-primary flex-grow disabled:bg-accent/50 disabled:text-opacity-50"
            disabled={isSubmitting()}
          >
            <Icon icon={Plus} class="fill-primary-content/80 w-4 h-4 mr-2" />
            <span>Create Channel</span>
          </button>
        </div>
      </form>
    </ModalTemplate>
  )
}
