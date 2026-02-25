import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import NotFound from "../NotFound";
import Chat from "../../components/messaging/Chat";
import {createMemo, Match, onMount, Show, Switch} from "solid-js";
import {type GuildChannel as GuildChannelType} from "../../types/channel";
import Header from "../../components/ui/Header";
import Icon from "../../components/icons/Icon";
import {getIcon} from "../../components/channels/CreateChannelModal";
import {t, tJsx} from "../../i18n";

export default function GuildChannel() {
  const params = useParams()
  const api = getApi()!, cache = api.cache!

  const guildId = createMemo(() => BigInt(params.guildId as any))
  const channel = createMemo(() => {
    return cache.channels.get(BigInt(params.channelId as any)) as GuildChannelType
  })
  const isGuildLoading = createMemo(() => cache.isGuildLoading(guildId()))
  const isGuildLoaded = createMemo(() => cache.isGuildLoaded(guildId()))

  // Trigger on-demand guild loading if the channel isn't loaded yet
  onMount(() => {
    if (!isGuildLoaded()) api.ws?.ensureGuildLoaded(guildId())
  })

  const topic = () => (channel() as GuildChannelType & { type: 'text' }).topic

  return (
    <Switch fallback={<NotFound />}>
      <Match when={channel()}>
        <>
          <Header>
            <span class="flex items-center">
              <Icon icon={getIcon(channel().type)} class="fill-fg w-4 h-4 mr-1" />
              {channel().name}
              <Show when={topic()}>
                <div class="mobile:hidden rounded-full w-0.5 h-full bg-3 mx-3">&nbsp;</div>
                <span class="mobile:hidden text-sm font-light font-sans text-fg/60">{topic()}</span>
              </Show>
            </span>
          </Header>
          <Chat
            channelId={channel().id}
            guildId={channel().guild_id}
            title={`#${channel().name}`}
            startMessage={tJsx('channel.text.start_of_conversation', {
              channel: <b>#{channel().name}</b>
            })}
          />
        </>
      </Match>
      <Match when={isGuildLoading() || !isGuildLoaded()}>
        <div class="flex flex-col flex-grow">
          <Header>
            <span class="flex items-center gap-x-2 animate-pulse">
              <span class="w-4 h-4 rounded-full bg-fg/10" />
              <span class="w-32 h-4 rounded-full bg-fg/10" />
            </span>
          </Header>
          <div class="flex-grow flex items-center justify-center">
            <span class="text-fg/40 text-sm">
              {t('channel.loading')}
            </span>
          </div>
        </div>
      </Match>
    </Switch>
  )
}
