import {createMemo, Show} from "solid-js";
import {A, useParams} from "@solidjs/router";
import {getApi} from "../../api/Api";
import NotFound from "../NotFound";
import Header from "../../components/ui/Header";
import GuildIcon from "../../components/guilds/GuildIcon";
import Icon from "../../components/icons/Icon";
import Users from "../../components/icons/svg/Users";
import Gear from "../../components/icons/svg/Gear";
import tooltip from "../../directives/tooltip";
import {type Message} from "../../types/message";
import {type GuildChannel} from "../../types/channel";
void tooltip

export default function GuildHome() {
  const api = getApi()!
  const guild = createMemo(() => api.cache!.guilds.get(BigInt(useParams().guildId))!)

  if (!guild())
    return <NotFound />

  const permissions = createMemo(() => api.cache!.getClientPermissions(guild().id))

  const onlineCount = createMemo(() => api.cache!.memberReactor
    .get(guild().id)!
    .reduce((acc, next) => api.cache!.presences.get(next)?.status === 'offline' ? acc : acc + 1, 0)
  )

  const recentActivity = createMemo(() => guild().channels!
    .map((channel) => [channel, api.cache!.lastMessages.get(channel.id)] as const)
    .filter(([, lastMessage]) => lastMessage && 'author_id' in lastMessage)
    .sort(([, a], [, b]) => Number(b!.id - a!.id))
    .slice(0, 3) as [GuildChannel, Message][]
  )

  return (
    <div class="flex flex-col p-2">
      <Header>Server Home</Header>
      <div class="w-full relative h-48 p-4 flex flex-row-reverse">
        <figure
          class="absolute rounded-xl inset-0"
          style={{
            ...(
              guild().banner
                ? { 'background-image': `url(${guild().banner})` }
                : { 'background-color': 'rgb(var(--c-bg-0))' }
            ),
            "background-size": "cover",
            "background-position": "center",
            "mask-image": "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
          }}
        />
        <div class="absolute flex items-start top-[calc(100%-2rem)] left-4 gap-x-3">
          <div class="bg-bg-0/70 rounded-3xl flex items-center">
            <GuildIcon
              guild={guild()}
              sizeClass="!rounded-3xl overflow-hidden w-20 h-20"
              unread={false}
              pings={0}
            />
          </div>
          <div class="flex flex-col">
            <h1 class="flex-end font-title font-bold text-fg/80 text-xl">
              {guild().name}
            </h1>
            <span class="text-sm text-fg/60 mt-0.5">{guild().description || 'No description provided'}</span>
            <span class="text-sm text-fg/60 mt-0.5">
              <div class="w-2 h-2 bg-[#43b581] rounded-full inline-block align-middle" />
              <span class="align-middle ml-1.5">{onlineCount()} Online</span>

              <Icon icon={Users} class="select-none fill-fg/60 w-4 h-4 inline-block align-middle ml-3" />
              <span class="align-middle ml-1.5">
                {guild().members?.length} Member{guild().members?.length === 1 ? '' : 's'}</span>
            </span>
          </div>
        </div>
        <div class="gap-x-2 z-[1]">
          <Show when={permissions().has('MANAGE_GUILD')}>
            <div use:tooltip="Settings">
              <A
                href={`/guilds/${guild().id}/settings`}
                class="flex aspect-square items-center justify-center p-3 bg-bg-3/70 rounded-full"
              >
                <Icon icon={Gear} class="fill-fg w-5 h-5" />
              </A>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
