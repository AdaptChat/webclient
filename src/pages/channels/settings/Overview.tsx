import Header from "../../../components/ui/Header";
import {createEffect, createMemo, createSignal} from "solid-js";
import {getApi} from "../../../api/Api";
import {useParams} from "@solidjs/router";
import {GuildChannel} from "../../../types/channel";
import {useSaveTask} from "../../settings/SettingsLayout";
import Icon from "../../../components/icons/Icon";
import {getIcon} from "../../../components/channels/CreateChannelModal";

export default function Overview() {
  const api = getApi()!
  const cache = api.cache!

  const params = useParams()
  const channelId = createMemo(() => BigInt(params.channelId))
  const channel = createMemo(() => cache.channels.get(channelId())! as GuildChannel)

  const [channelName, setChannelName] = createSignal<string | null>()
  const [channelTopic, setChannelTopic] = createSignal<string | null>()

  createEffect(() => {
    if (channelTopic() === '') setChannelTopic(null)
  })

  const reset = () => {
    let c = channel()
    setChannelName(c.name)
    setChannelTopic('topic' in c && c.topic ? c.topic : undefined)
  }
  createEffect(reset)

  const [setChanged] = useSaveTask(
    async () => {
      const json = {
        name: channelName(),
        topic: channelTopic(),
      }
      await api.request('PATCH', `/channels/${params.channelId}`, { json })
    },
    reset,
  )
  createEffect(() => setChanged(
    channelName() != channel().name
    || channelTopic() !== undefined && channelTopic() !== (channel() as any).topic
  ))

  const [focused, setFocused] = createSignal(false)

  return (
    <div class="px-4 py-4 flex flex-col">
      <Header>Overview</Header>
      <label for="name" class="font-bold uppercase text-fg/60 text-sm m-1">Channel Name</label>
      <div classList={{
        "flex rounded-lg overflow-hidden ring-2 transition": true,
        "ring-accent": focused(),
        "ring-transparent": !focused(),
      }}>
        <span class="bg-0 flex items-center pl-2">
          <Icon icon={getIcon(channel().type)} class="fill-fg w-4 h-4 ml-1 mr-2"/>
        </span>
        <input
          type="text"
          name="name"
          autocomplete="off"
          class="font-medium py-2 pr-2 bg-0 focus:outline-none flex-grow"
          placeholder="General"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onInput={(e) => setChannelName(e.currentTarget.value)}
          value={channelName() ?? ''}
          required
        />
      </div>

      <label for="topic" class="mt-4 font-bold uppercase text-fg/60 text-sm m-1">Channel Topic</label>
      <input
        type="text"
        name="topic"
        autocomplete="off"
        class="input font-medium bg-0 w-full"
        placeholder="What is this channel about?"
        onInput={(e) => setChannelTopic(e.currentTarget.value)}
        value={channelTopic() ?? ''}
      />
    </div>
  )
}