import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";

export default function GuildMemberList() {
  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(useParams().guildId))

  return (
    <div>
      hi
    </div>
  )
}
