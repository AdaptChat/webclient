import {useParams} from "@solidjs/router";
import {createMemo} from "solid-js";
import {getApi} from "../../api/Api";
import NotFound from "../NotFound";
import Chat from "../../components/messaging/Chat";
import {type DmChannel as DmChannelType, GroupDmChannel} from "../../types/channel";
import {displayName} from "../../utils";
import Header from "../../components/ui/Header";
import {tJsx}  from "../../i18n";

export function getDmChannelName(channel: DmChannelType) {
  const cache = getApi()!.cache!
  const user = channel.type == 'dm'
    ? cache.users.get(channel.recipient_ids.find(id => id != cache.clientId)!)
    : undefined
  return channel.type == 'group' ? (channel as GroupDmChannel).name : user ? displayName(user!) : 'Unknown User'
}

export default function DmChannel() {
  const api = getApi()!
  const params = useParams()

  const channel = createMemo(() => {
    const cache = api.cache!
    return cache.channels.get(BigInt(params.channelId as any))! as DmChannelType
  })

  if (!channel()) return <NotFound />
  const name = createMemo(() => getDmChannelName(channel()!))

  return (
    <>
      <Header>{name()}</Header>
      <Chat
        channelId={channel()!.id}
        title={name()}
        startMessage={
          channel()!.type == 'group'
            ? tJsx('channel.text.start_of_conversation', { channel: <b>{name()}</b> })
            : tJsx('channel.dm.start_of_conversation', { user: <b>{name()}</b> })
        }
      />
    </>
  )
}
