import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import {createMemo, For} from "solid-js";
import StatusIndicator from "../StatusIndicator";
import {Section} from "../settings/SettingsSidebar";

export function GuildMemberGroup({ members, offline }: { members: number[], offline?: boolean }) {
  const api = getApi()!

  return (
    <For each={members}>
      {(user_id) => (
        <div class="flex items-center p-2 rounded-lg hover:bg-gray-700 transition duration-200 cursor-pointer">
          <div class="indicator">
            <StatusIndicator status={api.cache!.presences.get(user_id)?.status} tailwind="m-[0.1rem]" indicator />
            <img src={api.cache!.avatarOf(user_id)} alt="" class="w-8 h-8 rounded-full"/>
          </div>
          <span classList={{ "ml-2 text-base-content": true, "text-opacity-50": offline }}>
            {api.cache!.users.get(user_id)?.username}
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
      <Section>Online ({groupedMembers().online.length})</Section>
      <GuildMemberGroup members={groupedMembers().online} />
      <Section>Offline ({groupedMembers().offline.length})</Section>
      <GuildMemberGroup members={groupedMembers().offline} offline />
    </div>
  )
}
