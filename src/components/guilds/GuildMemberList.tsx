import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import {createMemo, For} from "solid-js";
import StatusIndicator from "../users/StatusIndicator";
import SidebarSection from "../ui/SidebarSection";

export function GuildMemberGroup({ members, offline }: { members: number[], offline?: boolean }) {
  const api = getApi()!

  return (
    <For each={members}>
      {(user_id) => (
        <div class="group flex items-center px-2 py-1.5 rounded-lg hover:bg-gray-700 transition duration-200 cursor-pointer">
          <div class="indicator flex-shrink-0">
            <StatusIndicator status={api.cache!.presences.get(user_id)?.status} tailwind="m-[0.1rem]" indicator />
            <img
              src={api.cache!.avatarOf(user_id)}
              alt=""
              classList={{
                "w-7 h-7 rounded-full": true,
                "filter grayscale group-hover:grayscale-0 transition duration-1000": offline,
              }}
            />
          </div>
          <span class="ml-2 w-full overflow-ellipsis overflow-hidden text-sm">
            <span classList={{ "text-base-content": true, "text-opacity-50": offline, "!text-opacity-80": !offline }}>
              {api.cache!.users.get(user_id)?.username}
            </span>
            {/* TODO: discriminator part is temporary and can be removed in place of profiles */}
            <span class="text-base-content/30 text-xs">
              #{api.cache!.users.get(user_id)?.discriminator.toString().padStart(4, '0')}
            </span>
          </span>
        </div>
      )}
    </For>
  )
}

export default function GuildMemberList() {
  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(useParams().guildId))
  if (!guild) return

  const groupedMembers = createMemo(() => {
    const online = [], offline = []
    const members = api.cache!.memberReactor.get(guild.id)

    if (members != null)
      for (const member of members)
        if (api.cache!.presences.get(member)?.status === 'offline')
          offline.push(member)
        else
          online.push(member)

    return { online, offline }
  })

  return (
    <div class="flex flex-col w-full p-2 overflow-y-auto">
      <SidebarSection badge={groupedMembers().online.length}>
        Online
      </SidebarSection>
      <GuildMemberGroup members={groupedMembers().online} />
      <SidebarSection badge={groupedMembers().offline.length}>
        Offline
      </SidebarSection>
      <GuildMemberGroup members={groupedMembers().offline} offline />
    </div>
  )
}
