import Api, {getApi} from "../../api/Api";
import {Accessor, createMemo, For, ParentProps, Show} from "solid-js";
import {filterIterator} from "../../utils";
import {RelationshipType} from "../../types/user";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

export function relationshipFilterFactory(api: Api, targetType: RelationshipType): Accessor<[number, RelationshipType][]> {
  return createMemo(() => [
    ...filterIterator(api.cache!.relationships.entries(), ([_, type]) => type === targetType)
  ])
}

export function RelationshipDeleteButton({ api, id, label }: { api: Api, id: number, label: string }) {
  return (
    <button
      class="p-2 rounded-full bg-gray-700 hover:bg-error transition duration-200"
      onClick={() => api.request('DELETE', `/relationships/${id}`)}
      use:tooltip={{content: label, placement: 'left'}}
    >
      <img src="/icons/xmark.svg" alt={label} class="w-4 h-4 invert"/>
    </button>
  )
}

export function FriendEntry({ api, id, children }: ParentProps<{ api: Api, id: number }>) {
  const user = api.cache!.users.get(id)!

  return (
    <div
      class="flex items-center justify-between mx-4 my-2 p-2 border-2 border-gray-700 hover:bg-gray-850 transition
        duration-200 rounded-lg cursor-pointer"
    >
      <div class="flex items-center">
        <img src={api.cache!.avatarOf(id)} alt="" class="w-8 h-8 rounded-lg" />
        <div class="ml-4">
          {user.username}
          <span class="text-base-content/60">#{user.discriminator.toString().padStart(4, '0')}</span>
        </div>
      </div>
      <div class="flex gap-x-2">
        {children}
      </div>
    </div>
  )
}

export default function Requests() {
  const api = getApi()!

  const incoming = relationshipFilterFactory(api, 'incoming_request')
  const outgoing = relationshipFilterFactory(api, 'outgoing_request')

  return (
    <div class="h-[calc(100%-3.5rem)] overflow-y-auto">
      <Show when={!outgoing().length && !incoming().length} keyed={false}>
        <p class="text-center font-medium text-base-content/60 p-4">
          You currently have no incoming or outgoing friend requests.
        </p>
      </Show>
      <Show when={outgoing().length} keyed={false}>
        <div class="divider font-title font-medium text-base-content/60 m-4">Outgoing Requests</div>
        <For each={outgoing()}>
          {([id, _]) => (
            <FriendEntry api={api} id={id}>
              <RelationshipDeleteButton api={api} id={id} label="Revoke Request" />
            </FriendEntry>
          )}
        </For>
      </Show>
      <Show when={incoming().length} keyed={false}>
        <div class="divider font-title font-medium text-base-content/60 m-4">Incoming Requests</div>
        <For each={incoming()}>
          {([id, _]) => (
            <FriendEntry api={api} id={id}>
              <button
                class="p-2 rounded-full bg-gray-700 hover:bg-success transition duration-200"
                onClick={() => api.request('PUT', `/relationships/friends/${id}`)}
                use:tooltip={{content: "Accept Request", placement: 'left'}}
              >
                <img src="/icons/check.svg" alt="Accept Request" class="w-4 h-4 invert"/>
              </button>
              <RelationshipDeleteButton api={api} id={id} label="Deny Request" />
            </FriendEntry>
          )}
        </For>
      </Show>
    </div>
  )
}
