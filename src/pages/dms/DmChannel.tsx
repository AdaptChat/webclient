import {useParams} from "@solidjs/router";
import {createMemo} from "solid-js";
import {getApi} from "../../api/Api";
import NotFound from "../NotFound";
import Chat from "../../components/messaging/Chat";
import {type DmChannel as DmChannelType, GroupDmChannel} from "../../types/channel";
import {displayName} from "../../utils";
import Header from "../../components/ui/Header";

export function getDmChannelName(channel: DmChannelType) {
  const cache = getApi()!.cache!
  const user = channel.type == 'dm'
    ? cache.users.get(channel.recipient_ids.find(id => id != cache.clientId)!)
    : undefined
  return channel.type == 'group' ? (channel as GroupDmChannel).name : user ? displayName(user!) : 'Unknown User'
}

export default function DmChannel() {
  const api = getApi()!
  const channel = createMemo(() => {
    const params = useParams()
    const cache = api.cache!
    return cache.channels.get(parseInt(params.channelId))! as DmChannelType
  })

  if (!channel()) return <NotFound />
  const name = createMemo(() => getDmChannelName(channel()!))

  // TODO: right sidebar
  return (
    <>
      <Header>{name()}</Header>
      <Chat
        channelId={channel()!.id}
        title={name()}
        startMessage={
          <>This is the start of the conversation {channel()!.type == 'group' ? 'in' : 'with'} <b>{name()}</b>.</>
        }
      />
    </>
  )
}
