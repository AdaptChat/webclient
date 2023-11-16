import {useParams} from "@solidjs/router";
import {createMemo} from "solid-js";
import {getApi} from "../../api/Api";
import NotFound from "../NotFound";
import Layout from "../Layout";
import Chat from "../../components/messaging/Chat";
import {Sidebar} from "../Home";
import {type DmChannel as DmChannelType, GroupDmChannel} from "../../types/channel";
import {displayName} from "../../utils";

export default function DmChannel() {
  const api = getApi()!
  const channel = createMemo(() => {
    const params = useParams()
    const cache = api.cache!
    return cache.channels.get(parseInt(params.channelId))! as DmChannelType
  })

  if (!channel()) {
    return <NotFound sidebar={Sidebar} />
  }

  const user = createMemo(() =>
    channel().type == 'dm'
      ? api.cache!.users.get(channel().recipient_ids.find(id => id != api.cache!.clientUser!.id)!)
      : undefined
  )
  const group = channel().type == 'group'
  const name = () => group ? (channel() as GroupDmChannel).name : displayName(user()!)

  // TODO: right sidebar
  return (
    <Layout sidebar={Sidebar} title={name()}>
      <Chat
        channelId={channel()!.id}
        title={name()!}
        startMessage={
          <>This is the start of the conversation {group ? 'in' : 'with'} <b>{name()}</b>.</>
        }
      />
    </Layout>
  )
}
