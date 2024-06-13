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

  const [channelName, setChannelName] = createSignal<string>()
  createEffect(() => setChannelName(channel().name))

  const [setChanged] = useSaveTask(
    async () => {
      const json = {
        name: channelName(),
      }
      await api.request('PATCH', `/channels/${params.channelId}`, { json })
    },
    () => {
      setChannelName(channel().name)
    },
  )
  createEffect(() => setChanged(
    channelName() != channel().name
  ))

  const [focused, setFocused] = createSignal(false)

  return (
    <div class="px-4 py-4">
      <Header>Overview</Header>
      <h2 class="font-bold uppercase text-fg/60 text-sm my-2">Channel Name</h2>

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
    </div>
  )
}