import Header from "../../../components/ui/Header";
import {getApi} from "../../../api/Api";
import {A, useNavigate, useParams} from "@solidjs/router";
import {createEffect, createMemo, createSignal, For, Show, Signal} from "solid-js";
import {
  closestCenter,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  DragOverlay,
  SortableProvider,
  Transformer,
  transformStyle,
  useDragDropContext
} from "@thisbeyond/solid-dnd";
import {mapIterator, maxIterator, snowflakes, sumIterator} from "../../../utils";
import {Member, Role} from "../../../types/guild";
import Icon from "../../../components/icons/Icon";
import GripDotsVertical from "../../../components/icons/svg/GripDotsVertical";
import ChevronRight from "../../../components/icons/svg/ChevronRight";
import {memberKey} from "../../../api/ApiCache";
import Users from "../../../components/icons/svg/Users";
import MagnifyingGlass from "../../../components/icons/svg/MagnifyingGlass";
import Xmark from "../../../components/icons/svg/Xmark";
import Fuse from "fuse.js";
import Plus from "../../../components/icons/svg/Plus";
import Modal from "../../../components/ui/Modal";
import CreateRoleModal from "../../../components/guilds/CreateRoleModal";
import Lock from "../../../components/icons/svg/Lock";
import ChevronLeft from "../../../components/icons/svg/ChevronLeft";
import useContextMenu from "../../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../../../components/ui/ContextMenu";
import Code from "../../../components/icons/svg/Code";
import Trash from "../../../components/icons/svg/Trash";
import ConfirmRoleDeleteModal from "../../../components/guilds/ConfirmRoleDeleteModal";
import {useSaveTask} from "../../settings/SettingsLayout";

function roleColor(provided: number | undefined) {
  return provided ? '#' + provided.toString(16).padStart(6, '0') : 'rgb(var(--c-fg) / 0.8)'
}

interface SmallRolePreviewParams {
  guildId: bigint;
  role: Role;
  topRolePosition: number;
  gripping?: boolean;
  onContextMenu?: (event: MouseEvent) => void;
}

function SmallRolePreview<T extends SmallRolePreviewParams>(props: T) {
  const managable = createMemo(() => props.topRolePosition === -1 || props.role.position < props.topRolePosition)
  const draggable = createMemo(() => !props.gripping && managable())

  const sortable = draggable() ? createSortable(props.role.id.toString()) : {} as any
  const sortableDirective = (element: HTMLElement) => {
    if (draggable()) sortable(element)
  }
  void sortableDirective

  const [state] = useDragDropContext() ?? []

  const navigate = useNavigate()
  const params = useParams()
  const active = createMemo(() => params.roleId === props.role.id.toString())
  const href = `/guilds/${props.guildId}/settings/roles/${props.role.id}`

  return (
    <button
      onClick={() => navigate(href)}
      onContextMenu={props.onContextMenu}
      classList={{
        "flex p-2 items-center gap-x-2 rounded-lg w-full cursor-pointer": true,
        "bg-fg/10": active() && !props.gripping,
        "hover:bg-3": !props.gripping,
        "bg-3": props.gripping,
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state?.active.draggable,
      }}
      use:sortableDirective
    >
      <div class="flex items-center gap-x-2 text-fg">
        <div
          class="w-2.5 h-2.5 rounded-full"
          style={{ "background-color": roleColor(props.role.color) }}
        />
        <span class="flex items-center text-left text-fg/70" classList={{ "text-fg/100": active() }}>
          {props.role.name}
          <Show when={!managable()}>
            <Icon icon={Lock} class="w-4 h-4 fill-fg/50 ml-2" tooltip="Locked" />
          </Show>
        </span>
      </div>
    </button>
  )
}

interface LargeRolePreviewParams {
  guildId: bigint;
  members: Member[];
  role: Role;
  topRolePosition: number;
  draggable: boolean;
  gripping?: boolean;
  onContextMenu?: (event: MouseEvent) => void;
}

function LargeRolePreview(props: LargeRolePreviewParams) {
  const membersInRole = createMemo(() => sumIterator(mapIterator(
    props.members,
    (member) => member.roles?.includes(props.role.id) ? 1 : 0 as number
  )))

  const managable = createMemo(() => props.topRolePosition === -1 || props.role.position < props.topRolePosition)
  const sortable = props.gripping || !managable() ? {} as any : createSortable(props.role.id.toString())
  const showGripper = () => props.draggable || props.gripping

  const [state] = useDragDropContext() ?? []

  return (
    <div
      ref={sortable.ref}
      classList={{
        "flex rounded-lg overflow-hidden": true,
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state?.active.draggable,
      }}
      style={props.draggable && managable() ? transformStyle(sortable.transform) : undefined}
      onContextMenu={props.onContextMenu}
    >
      <Show when={showGripper()}>
        <div
          class="flex group items-center justify-center px-3 bg-bg-0 transition touch-none"
          classList={{ [managable() ? "cursor-grab hover:bg-3" : "cursor-not-allowed"]: true }}
          {...(!props.gripping && managable() && sortable.dragActivators)}
        >
          <Icon
            icon={managable() ? GripDotsVertical : Lock}
            classList={{
              "w-6 h-6 transition-all": true,
              [props.gripping ? "fill-fg/100" : "fill-fg/50"]: true,
              "group-hover:fill-fg/80": managable() && props.gripping,
              "opacity-30": !managable(),
            }}
          />
        </div>
      </Show>
      <A
        class="flex flex-grow bg-bg-1/80 hover:bg-3 transition items-center justify-between p-4"
        href={`/guilds/${props.guildId}/settings/roles/${props.role.id}`}
      >
        <div class="flex items-center gap-x-4 text-fg">
          <div
            class="w-4 h-4 rounded-full"
            classList={{ "mx-2": !showGripper() }}
            style={{ "background-color": roleColor(props.role.color) }}
          />
          <div class="flex-grow">
            <h3 class="text-lg font-title flex items-center">
              {props.role.name}
              <Show when={!showGripper() && !managable()}>
                <Icon icon={Lock} class="w-4 h-4 fill-fg/50 ml-2" tooltip="Locked" />
              </Show>
            </h3>
            <p class="text-fg/60 text-sm">{membersInRole()} members</p>
          </div>
        </div>
        <Icon icon={ChevronRight} class="w-6 h-6 fill-fg/50" />
      </A>
    </div>
  )
}

export interface Props {
  guildId: bigint,
  originalOrder: bigint[],
  roleIds: Signal<bigint[]>,
  roles: Role[],
  large?: boolean,
}

export function SortableRoles(props: Props) {
  const cache = getApi()!.cache!
  const members = createMemo(() =>
    cache.memberReactor.get(props.guildId)?.map(id => cache.members.get(memberKey(props.guildId, id))!) ?? []
  );
  const [roleIds, setRoleIds] = props.roleIds

  const guild = createMemo(() => cache.guilds.get(props.guildId)!)
  const topRolePosition = createMemo(() => guild().owner_id == cache.clientId
    ? -1
    : maxIterator(mapIterator(cache.getMemberRoles(props.guildId, cache.clientId!), r => r.position))!
  )

  const [setNeedsReorder] = useSaveTask(
    () => updateRolePositions(props.guildId, roleIds()),
    () => setRoleIds(props.originalOrder),
  )
  createEffect(() => setNeedsReorder(roleIds().some((id, i) => id != props.originalOrder[i])))

  const baseParams = createMemo(() => ({
    guildId: props.guildId,
    members: members(),
    topRolePosition: topRolePosition(),
  }) satisfies Partial<LargeRolePreviewParams>)

  const [activeRole, setActiveRole] = createSignal<string>()
  const onDragStart: DragEventHandler = ({ draggable }) => setActiveRole(draggable.id as string)
  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (draggable && droppable) {
      const roles = roleIds()
      const fromIndex = roles.indexOf(BigInt(draggable.id))
      const toIndex = roles.indexOf(BigInt(droppable.id))

      if (fromIndex !== toIndex) {
        const newRoles = [...roles];
        newRoles.splice(fromIndex, 1);
        newRoles.splice(toIndex, 0, BigInt(draggable.id));
        setRoleIds(newRoles)
      }
    }
  }

  const ConstrainDragAxis = () => {
    const [, { onDragStart, onDragEnd, addTransformer, removeTransformer }] = useDragDropContext()!

    const transformer: Transformer = {
      id: "constrain-x-axis",
      order: 100,
      callback: (transform) => ({ ...transform, x: 0 }),
    };

    onDragStart(({ draggable }) => {
      addTransformer("draggables", draggable.id, transformer);
    });

    onDragEnd(({ draggable }) => {
      removeTransformer("draggables", draggable.id, transformer.id);
    });

    return <></>;
  };

  let searchRef: HTMLInputElement | null = null
  const [searchQuery, setSearchQuery] = createSignal('')

  const index = createMemo(() => new Fuse(props.roles, { keys: ['name'] }))
  const queryResults = createMemo(() => searchQuery()
    ? index().search(searchQuery()).map(result => result.item.id)
    : roleIds()
  )

  const [showCreateRoleModal, setShowCreateRoleModal] = createSignal(false)

  const [roleToDelete, setRoleToDelete] = createSignal<Role | null>(null)
  const [showDeleteRoleModal, setShowDeleteRoleModal] = createSignal(false)

  const Component = props.large ? LargeRolePreview : SmallRolePreview
  const defaultRoleId = snowflakes.withModelType(props.guildId, snowflakes.ModelType.Role)
  const defaultRoleHref = `/guilds/${props.guildId}/settings/roles/${defaultRoleId}`

  const params = useParams()
  const contextMenu = useContextMenu()!

  return (
    <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <Modal get={showCreateRoleModal} set={setShowCreateRoleModal}>
        <CreateRoleModal guildId={props.guildId} setShow={setShowCreateRoleModal} />
      </Modal>
      <Modal get={showDeleteRoleModal} set={setShowDeleteRoleModal}>
        <Show when={roleToDelete()}>
          <ConfirmRoleDeleteModal role={roleToDelete()!} setShow={setShowDeleteRoleModal} />
        </Show>
      </Modal>
      <DragDropSensors />
      <ConstrainDragAxis />
      <div class="flex flex-col w-full" classList={{ "gap-y-2": props.large }}>
        {props.large ? (
          <div class="flex gap-x-2">
            <div class="flex flex-grow bg-bg-3/60 rounded-lg items-center">
              <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/50 my-3 ml-3"/>
              <input
                ref={searchRef!}
                type="text"
                class="w-full p-2 outline-none font-medium bg-transparent"
                placeholder="Search Roles"
                value={searchQuery()}
                onInput={(event) => setSearchQuery(event.currentTarget.value)}
              />
              <Show when={searchQuery()}>
                <Icon
                  icon={Xmark}
                  class="w-4 h-4 fill-fg/50 mr-3 cursor-pointer hover:fill-fg/80 transition duration-200"
                  onClick={() => {
                    setSearchQuery('')
                    searchRef!.focus()
                  }}
                />
              </Show>
            </div>
            <button class="btn btn-primary btn-sm flex gap-x-1" onClick={() => setShowCreateRoleModal(true)}>
              <Icon icon={Plus} class="w-4 h-4 fill-fg"/>
              <span class="mobile:hidden">Create Role</span>
            </button>
          </div>
        ) : (
          <div class="flex justify-between items-center mx-1 mt-1 mb-2">
            <A class="group flex items-center gap-x-1" href={`/guilds/${props.guildId}/settings/roles`}>
              <Icon icon={ChevronLeft} class="w-3.5 h-3.5 fill-fg/50 group-hover:fill-fg/100 transition" />
              <span class="uppercase font-bold text-sm text-fg/50 group-hover:text-fg/100 transition">Back</span>
            </A>
            <button class="group" onClick={() => setShowCreateRoleModal(true)}>
              <Icon icon={Plus} class="w-4 h-4 fill-fg/50 group-hover:fill-fg/100 transition" tooltip="New Role" />
            </button>
          </div>
        )}
        <SortableProvider ids={roleIds().map(r => r.toString())}>
          <For each={queryResults()}>
            {roleId => (
              <Component
                {...baseParams()}
                role={cache.roles.get(roleId)!}
                draggable={searchQuery() === ''}
                onContextMenu={contextMenu.getHandler(
                  <ContextMenu>
                    <ContextMenuButton
                      icon={Code}
                      label="Copy Role ID"
                      onClick={() => window.navigator.clipboard.writeText(roleId.toString())}
                    />
                    <Show when={cache.roles.get(roleId)!.position >= topRolePosition()}>
                      <DangerContextMenuButton
                        icon={Trash}
                        label="Delete Role"
                        onClick={() => {
                          setRoleToDelete(cache.roles.get(roleId)!)
                          setShowDeleteRoleModal(true)
                        }}
                      />
                    </Show>
                  </ContextMenu>
                )}
              />
            )}
          </For>
        </SortableProvider>
        {props.large ? (
          <A
            class="bg-bg-0/70 flex justify-between rounded-lg items-center p-4 transition hover:bg-3"
            href={defaultRoleHref}
          >
            <div class="flex items-center gap-x-3 font-title">
              <Icon icon={Users} class="w-6 h-6 fill-fg/80"/>
              Manage Default Permissions
            </div>
            <Icon icon={ChevronRight} class="w-5 h-5 fill-fg/50"/>
          </A>
        ) : (
          <A
            href={defaultRoleHref}
            class="flex items-center p-2 gap-x-2 hover:bg-3 rounded-lg transition"
            classList={{ "bg-fg/10": params.roleId === defaultRoleId.toString() }}
          >
            <Icon icon={Users} class="w-4 h-4 fill-fg/50"/>
            <span class="text-fg/70 font-medium">All Members</span>
          </A>
        )}
      </div>
      <DragOverlay>
        <Show when={activeRole()}>
          <Component
            {...baseParams()}
            role={cache.roles.get(BigInt(activeRole()!))!}
            draggable={false}
            gripping={true}
          />
        </Show>
      </DragOverlay>
    </DragDropProvider>
  )
}

export async function updateRolePositions(guildId: bigint, roleIds: bigint[]) {
  const api = getApi()!
  await api.request('PATCH', `/guilds/${guildId}/roles`, { json: roleIds.reverse() })
}

export default function Roles() {
  const params = useParams()

  const api = getApi()!
  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)

  const defaultRoleId = createMemo(() => snowflakes.withModelType(guildId(), snowflakes.ModelType.Role))
  const guildRoles = createMemo(() => guild().roles!.filter(r => r.id != defaultRoleId()))

  const originalOrder = createMemo(() => guildRoles().map(r => r.id).reverse())
  const [roleIds, setRoleIds] = createSignal<bigint[]>([])
  createEffect(() => setRoleIds(originalOrder()))

  return (
    <div class="px-3 pt-2 relative pb-16">
      <Header>Roles</Header>
      <p class="mb-4 px-1 font-light text-sm text-fg/50">
        Roles are used to group members in your server and grant them permissions.
      </p>
      <SortableRoles
        guildId={guildId()}
        originalOrder={originalOrder()}
        roleIds={[roleIds, setRoleIds]}
        roles={guildRoles()}
        large
      />
    </div>
  )
}