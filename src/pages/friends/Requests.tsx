import Api, {getApi} from "../../api/Api";
import {Accessor, createMemo, For, ParentProps, Show} from "solid-js";
import {displayName, filterIterator} from "../../utils";
import {RelationshipType} from "../../types/user";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import Icon from "../../components/icons/Icon";
import Xmark from "../../components/icons/svg/Xmark";
import Check from "../../components/icons/svg/Check";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton} from "../../components/ui/ContextMenu";
import Code from "../../components/icons/svg/Code";
import StatusIndicator from "../../components/users/StatusIndicator";
import Header from "../../components/ui/Header";
import {FriendsNav} from "./Friends";
noop(tooltip)

export function relationshipFilterFactory(api: Api, targetType: RelationshipType): Accessor<[bigint, RelationshipType][]> {
  return createMemo(() => [
    ...filterIterator(api.cache!.relationships.entries(), ([_, type]) => type === targetType)
  ])
}

export function RelationshipDeleteButton({ api, id, label }: { api: Api, id: bigint, label: string }) {
  return (
    <button
      class="p-2 rounded-full bg-bg-3/70 hover:bg-danger transition duration-200"
      onClick={() => api.request('DELETE', `/relationships/${id}`)}
      use:tooltip={{content: label, placement: 'left'}}
    >
      <Icon icon={Xmark} title={label} class="w-4 h-4 fill-fg"/>
    </button>
  )
}

export function FriendEntry({ api, id, index, children }: ParentProps<{ api: Api, id: bigint, index: Accessor<number> }>) {
  const user = api.cache!.users.get(id)!
  const presence = createMemo(() => api.cache!.presences.get(id))
  const contextMenu = useContextMenu()

  return (
    <>
      <Show when={index() != 0}>
        <div class="border-t-[1px] mx-2 border-bg-3/50"></div>
      </Show>
      <div
        class="flex items-center justify-between p-1 bg-transparent backdrop-blur hover:bg-bg-3/50 transition
          duration-200 rounded-xl cursor-pointer group"
        onContextMenu={contextMenu?.getHandler(
          <ContextMenu>
            <ContextMenuButton
              icon={Code}
              label="Copy User ID"
              onClick={() => navigator.clipboard.writeText(id.toString())}
            />
          </ContextMenu>
        )}
      >
        <div class="flex items-center">
          <div class="indicator m-1.5">
            <img src={api.cache!.avatarOf(id)} alt="" class="w-8 h-8 rounded-full" />
            <StatusIndicator tailwind="w-3 h-3 m-0.5" status={presence()?.status} indicator />
          </div>
          <div class="ml-1.5">
            <div class="font-title text-sm">
              {displayName(user)}
              <Show when={user.display_name}>
                <span class="text-transparent group-hover:text-fg/40 transition ml-2">@{user.username}</span>
              </Show>
            </div>
            <div class="text-fg/50 text-xs -mt-0.5">
              {presence()?.custom_status}
            </div>
          </div>
        </div>
        <div class="flex gap-x-2 m-1">
          {children}
        </div>
      </div>
    </>
  )
}

export default function Requests() {
  const api = getApi()!

  const incoming = relationshipFilterFactory(api, 'incoming_request')
  const outgoing = relationshipFilterFactory(api, 'outgoing_request')

  return (
    <div class="px-2 pt-2 h-full flex flex-col overflow-auto">
      <Header>
        <FriendsNav />
      </Header>
      <Show when={!outgoing().length && !incoming().length} keyed={false}>
        <p class="text-center font-medium text-fg/60 p-4">
          You currently have no incoming or outgoing friend requests.
        </p>
      </Show>
      <Show when={incoming().length} keyed={false}>
        <div class="divider font-title font-medium text-fg/60 mx-2 my-2">
          Incoming Requests ({incoming().length})
        </div>
        <For each={incoming()}>
          {([id, _], index) => (
            <FriendEntry api={api} id={id} index={index}>
              <button
                class="p-2 rounded-full bg-bg-3/70 hover:bg-success transition duration-200"
                onClick={() => api.request('PUT', `/relationships/friends/${id}`)}
                use:tooltip={{content: "Accept Request", placement: 'left'}}
              >
                <Icon icon={Check} title="Accept Request" class="w-4 h-4 fill-fg"/>
              </button>
              <RelationshipDeleteButton api={api} id={id} label="Deny Request" />
            </FriendEntry>
          )}
        </For>
        <div class="h-2 select-none">&nbsp;</div>
      </Show>
      <Show when={outgoing().length} keyed={false}>
        <div class="divider font-title font-medium text-fg/60 mx-2 my-2">
          Outgoing Requests ({outgoing().length})
        </div>
        <For each={outgoing()}>
          {([id, _], index) => (
            <FriendEntry api={api} id={id} index={index}>
              <RelationshipDeleteButton api={api} id={id} label="Revoke Request" />
            </FriendEntry>
          )}
        </For>
      </Show>
    </div>
  )
}
