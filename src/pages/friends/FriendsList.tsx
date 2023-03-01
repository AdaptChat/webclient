import {getApi} from "../../api/Api";
import {For, Setter, Show} from "solid-js";
import {FriendEntry, RelationshipDeleteButton, relationshipFilterFactory} from "./Requests";
import {useRouteData} from "@solidjs/router";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

export default function FriendsList() {
  const api = getApi()!
  const { setShowAddFriendModal } = useRouteData<{ setShowAddFriendModal: Setter<boolean> }>()
  const friends = relationshipFilterFactory(api, 'friend')

  return (
    <div>
      <Show when={friends().length} keyed={false} fallback={(
        <div class="flex items-center justify-center font-medium text-base-content/60 p-4">
          You currently have no friends (just like Cryptex).
          <button class="ml-2 btn btn-sm btn-primary" onClick={() => setShowAddFriendModal(true)}>Add some?</button>
        </div>
      )}>
        <div class="divider font-title font-medium text-base-content/60 m-4">Friends</div>
        <For each={friends()}>
          {([id, _]) => (
            <FriendEntry api={api} id={id}>
              <RelationshipDeleteButton api={api} id={id} label="Remove Friend" />
            </FriendEntry>
          )}
        </For>
      </Show>
    </div>
  )
}
