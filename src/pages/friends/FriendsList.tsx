import {getApi} from "../../api/Api";
import {For, Setter, Show} from "solid-js";
import {FriendEntry, RelationshipDeleteButton, relationshipFilterFactory} from "./Requests";
import {useNavigate, useRouteData} from "@solidjs/router";
import tooltip from "../../directives/tooltip";
import {findIterator, noop} from "../../utils";
import {ChannelCreateEvent} from "../../types/ws";
import {Channel} from "../../types/channel";
import MessageIcon from "../../components/icons/svg/Message";
import Icon from "../../components/icons/Icon";
noop(tooltip)

export default function FriendsList() {
  const api = getApi()!
  const { setShowAddFriendModal } = useRouteData<{ setShowAddFriendModal: Setter<boolean> }>()
  const friends = relationshipFilterFactory(api, 'friend')
  const navigate = useNavigate()

  return (
    <div class="h-[calc(100%-3.5rem)] overflow-y-auto">
      <Show when={friends().length} keyed={false} fallback={(
        <div class="text-center font-medium text-base-content/60 p-4">
          You currently have no friends (just like Cryptex).
          <button class="ml-2 btn btn-sm btn-primary" onClick={() => setShowAddFriendModal(true)}>Add some?</button>
        </div>
      )}>
        <div class="divider font-title font-medium text-base-content/60 m-4">Friends</div>
        <For each={friends()}>
          {([id, _]) => (
            <FriendEntry api={api} id={id}>
              <button
                class="p-2.5 rounded-full bg-gray-700 hover:bg-accent transition duration-200"
                onClick={async () => {
                  const predicate = (channel: Channel) => channel.type === 'dm' && channel.recipient_ids.includes(id)
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
                    json: { type: 'dm', recipient_id: id }
                  })
                }}
                use:tooltip={{ content: "Open DM", placement: 'left' }}
              >
                <Icon icon={MessageIcon} title="Open DM" class="w-3 h-3 fill-base-content"/>
              </button>
              <RelationshipDeleteButton api={api} id={id} label="Remove Friend" />
            </FriendEntry>
          )}
        </For>
      </Show>
    </div>
  )
}
