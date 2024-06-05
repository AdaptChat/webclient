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

  return (
    <div class="px-4 py-4">
      <Header>Overview</Header>
      <h2 class="font-bold uppercase text-fg/60 text-sm my-2">Channel Name</h2>

      <div class="flex">
        <div class="h-full bg-bg-1/80 p-3 rounded-l-lg">
          <Icon icon={getIcon(channel().type)} class="w-5 h-5 fill-fg/50" />
        </div>
        <input
          class="input w-full disabled:opacity-50 !rounded-l-none"
          placeholder="Fun Times"
          onInput={(e) => setChannelName(e.currentTarget.value)}
          value={channelName() ?? ''}
          minLength={1}
          maxLength={32}
        />
      </div>
    </div>
  )
}