import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import {createEffect, For, Show} from "solid-js";
import StatusIndicator from "../users/StatusIndicator";
import SidebarSection from "../ui/SidebarSection";
import {ReactiveSet} from "@solid-primitives/set";
import {displayName, setDifference} from "../../utils";

export function GuildMemberGroup({ members, offline }: { members: ReactiveSet<number>, offline?: boolean }) {
  const api = getApi()!

  return (
    <For each={[...members]}>
      {(user_id) => {
        const user = api.cache!.users.get(user_id)
        return (
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
              {displayName(user!)}
            </span>
          </span>
          </div>
        )
      }}
    </For>
  )
}

export default function GuildMemberList() {
  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(useParams().guildId))
  if (!guild) return

  const online = new ReactiveSet<number>()
  const offline = new ReactiveSet<number>()

  createEffect<Set<number> | undefined>((tracked) => {
    const members = api.cache!.memberReactor.get(guild.id)
    if (members == null) return

    for (const member of members) {
      if (tracked?.has(member)) continue

      createEffect((prev) => {
        const status = api.cache!.presences.get(member)?.status
        if (prev != null && (prev === 'offline') === (status === 'offline'))
          return status

        if (status === 'offline' || !status) {
          online.delete(member);
          offline.add(member)
        } else {
          offline.delete(member);
          online.add(member)
        }
        return status
      })
    }
    const updated = new Set(members)
    if (tracked) for (const removed of setDifference(tracked, updated)) {
      online.delete(removed)
      offline.delete(removed)
    }
    return updated
  }, new Set<number>())

  return (
    <div class="flex flex-col w-full p-2 overflow-y-auto">
      <Show when={online.size} keyed={false}>
        <SidebarSection badge={() => online.size}>
          Online
        </SidebarSection>
        <GuildMemberGroup members={online} />
      </Show>
      <Show when={offline.size} keyed={false}>
        <SidebarSection badge={() => offline.size}>
          Offline
        </SidebarSection>
        <GuildMemberGroup members={offline} offline />
      </Show>
    </div>
  )
}
