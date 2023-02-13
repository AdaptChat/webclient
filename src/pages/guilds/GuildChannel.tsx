import Layout from "../Layout";
import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import NotFound from "../NotFound";
import {GuildSidebar} from "./GuildHome";
import Chat from "../../components/messaging/Chat";

export default function GuildChannel() {
  const { guildId: guildIdString, channelId } = useParams()

  const api = getApi()!, cache = api.cache!
  const channel = cache.channels.get(parseInt(channelId))
  const guildId = parseInt(guildIdString)
  let guild

  if (!channel || channel.guild_id != guildId || !(guild = cache.guilds!.get(guildId))) {
    return <NotFound sidebar={GuildSidebar} />
  }

  return (
    <Layout sidebar={GuildSidebar} title={'#' + channel.name}>
      <Chat channelId={channel.id} />
    </Layout>
  )
}
