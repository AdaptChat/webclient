import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import NotFound from "../NotFound";
import Chat from "../../components/messaging/Chat";
import {createMemo, Show} from "solid-js";
import {type GuildChannel as GuildChannelType} from "../../types/channel";
import Header from "../../components/ui/Header";
import Icon from "../../components/icons/Icon";
import {getIcon} from "../../components/channels/CreateChannelModal";

export default function GuildChannel() {
  const params = useParams()
  const api = getApi()!, cache = api.cache!

  const channel = createMemo(() => {
    return cache.channels.get(BigInt(params.channelId)) as GuildChannelType
  })
  if (!channel()) {
    return <NotFound />
  }
  const topic = () => (channel() as GuildChannelType & { type: 'text' }).topic

  return (
    <>
      <Header>
        <span class="flex items-center">
          <Icon icon={getIcon(channel().type)} class="fill-fg w-4 h-4 mr-1" />
          {channel().name}
          <Show when={topic()}>
            <div class="rounded-full w-0.5 h-full bg-3 mx-3">&nbsp;</div>
            <span class="text-sm font-light font-sans text-fg/60">{topic()}</span>
          </Show>
        </span>
      </Header>
      <Chat
        channelId={channel().id}
        guildId={channel().guild_id}
        title={`#${channel().name}`}
        startMessage={
          <>This is the start of the conversation in <b>#{channel().name}</b>.</>
        }
      />
    </>
  )
}
