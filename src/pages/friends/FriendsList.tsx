import Api, {getApi} from "../../api/Api";
import {For, Show} from "solid-js";
import {FriendEntry, RelationshipDeleteButton, relationshipFilterFactory} from "./Requests";
import {useNavigate, type Navigator} from "@solidjs/router";
import tooltip from "../../directives/tooltip";
import {findIterator, noop} from "../../utils";
import {ChannelCreateEvent} from "../../types/ws";
import {Channel} from "../../types/channel";
import MessageIcon from "../../components/icons/svg/Message";
import Icon from "../../components/icons/Icon";
noop(tooltip)

export async function openDms(api: Api, navigate: Navigator, userId: number) {
  const predicate = (channel: Channel) => channel.type === 'dm' && channel.recipient_ids.includes(userId)
  const found = findIterator(api.cache?.channels.values(), predicate)
  if (found)
    return navigate(`/dms/${found.id}`)

  api.ws?.on('channel_create', ({ channel }: ChannelCreateEvent, remove) => {
    if (predicate(channel)) {
      navigate(`/dms/${channel.id}`)
      remove()
    }
  })
  await api.request('POST', `/users/me/channels`, {
    json: { type: 'dm', recipient_id: userId }
  })
}

export default function FriendsList() {
  const api = getApi()!
  const friends = relationshipFilterFactory(api, 'friend')
  const navigate = useNavigate()

  return (
    <div class="p-2 h-full flex flex-col overflow-auto">
      <Show when={friends().length} fallback={(
        <div class="text-center font-medium text-fg/60 p-4">
          You currently have no friends (just like Cryptex).
          <button
            class="ml-2 btn btn-sm btn-primary"
            onClick={() => document.getElementById('add-friend')?.click()}
          >
            Add some?
          </button>
        </div>
      )}>
        <div class="divider font-title font-medium text-fg/60 mx-2 my-2">All Friends ({friends().length})</div>
        <For each={friends()}>
          {([id, _], index) => (
            <FriendEntry api={api} id={id} index={index}>
              <button
                class="p-2.5 rounded-full bg-bg-3/70 hover:bg-accent transition duration-200"
                onClick={() => openDms(api, navigate, id)}
                use:tooltip={{ content: "Open DM", placement: 'left' }}
              >
                <Icon icon={MessageIcon} title="Open DM" class="w-3.5 h-3.5 fill-fg"/>
              </button>
              <RelationshipDeleteButton api={api} id={id} label="Remove Friend" />
            </FriendEntry>
          )}
        </For>
      </Show>
    </div>
  )
}
