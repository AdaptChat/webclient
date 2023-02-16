import {useParams} from "@solidjs/router";
import {createMemo, For} from "solid-js";
import {getApi} from "../../api/Api";
import {SidebarButton} from "../../pages/Home";
import {GuildChannel} from "../../types/channel";

export default function GuildSidebar() {
  const { guildId } = useParams()
  const channelId = createMemo(() => {
    const { channelId } = useParams()
    return parseInt(channelId)
  })

  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(guildId))
  if (!guild) return

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="w-[calc(100%-2rem)] mt-4 card flex border border-2 border-base-content/10">
        {guild.banner && (
          <figure class="h-20 overflow-hidden flex items-center justify-center">
            <img src={guild.banner} alt="" class="w-full" width="100%" />
          </figure>
        )}
        <div classList={{
          "flex justify-between px-4 pt-2": true,
          "pb-2": !guild.description,
        }}>
          <span class="font-title card-title text-base">{guild.name}</span>

        </div>
        {guild.description && (
          <div class="card-body px-4 pt-1 pb-2">
            <p class="text-xs text-base-content/50">{guild.description}</p>
          </div>
        )}
      </div>
      <div class="flex flex-col w-full p-2">
        <SidebarButton href={`/guilds/${guildId}`} svg="/icons/home.svg" active={!channelId()}>Home</SidebarButton>
        <For each={guild.channels}>
          {(channel: GuildChannel) => (
            <SidebarButton
              href={`/guilds/${guildId}/${channel.id}`}
              svg="/icons/hashtag.svg"
              active={channelId() === channel.id}
            >
              {channel.name}
            </SidebarButton>
          )}
        </For>
      </div>
    </div>
  )
}
