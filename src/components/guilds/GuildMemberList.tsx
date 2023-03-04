import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import {For} from "solid-js";
import StatusIndicator from "../StatusIndicator";

export default function GuildMemberList() {
  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(useParams().guildId))
  if (!guild) return

  return (
    <div class="flex flex-col w-full p-2">
      <For each={api.cache!.memberReactor.get(guild.id)}>
        {(user_id) => (
          <div class="flex items-center p-2 rounded-lg hover:bg-gray-700 transition duration-200 cursor-pointer">
            <div class="indicator">
              <StatusIndicator status={api.cache!.presences.get(user_id)?.status} tailwind="m-[0.1rem]" indicator />
              <img src={api.cache!.avatarOf(user_id)} alt="" class="w-8 h-8 rounded-full"/>
            </div>
            <span class="ml-2">{api.cache!.users.get(user_id)?.username}</span>
          </div>
        )}
      </For>
    </div>
  )
}
