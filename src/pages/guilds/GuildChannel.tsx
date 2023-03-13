import Layout from "../Layout";
import {getApi} from "../../api/Api";
import {useParams} from "@solidjs/router";
import NotFound from "../NotFound";
import GuildSidebar from "../../components/guilds/GuildSidebar"
import Chat from "../../components/messaging/Chat";
import {createMemo} from "solid-js";
import GuildMemberList from "../../components/guilds/GuildMemberList";
import {type GuildChannel as GuildChannelType} from "../../types/channel";

export default function GuildChannel() {
  const channel = createMemo(() => {
    const params = useParams()
    const api = getApi()!, cache = api.cache!
    return cache.channels.get(parseInt(params.channelId))
  })

  if (!channel()) {
    return <NotFound sidebar={GuildSidebar} />
  }

  return (
    <Layout sidebar={GuildSidebar} rightSidebar={GuildMemberList} title={'#' + (channel()! as GuildChannelType).name}>
      <Chat channelId={channel()!.id} />
    </Layout>
  )
}
