import Header from "../../../components/ui/Header";
import {getApi} from "../../../api/Api";
import {A, useParams} from "@solidjs/router";
import {createMemo, createSignal, For, Show, Signal} from "solid-js";
import {
  closestCenter,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  DragEventHandler, DragOverlay, SortableProvider, Transformer,
  useDragDropContext
} from "@thisbeyond/solid-dnd";
import {mapIterator, snowflakes, sumIterator} from "../../../utils";
import {Member, Role} from "../../../types/guild";
import Icon from "../../../components/icons/Icon";
import GripDotsVertical from "../../../components/icons/svg/GripDotsVertical";
import ChevronRight from "../../../components/icons/svg/ChevronRight";
import withModelType = snowflakes.withModelType;
import ModelType = snowflakes.ModelType;
import {memberKey} from "../../../api/ApiCache";
import Users from "../../../components/icons/svg/Users";
import MagnifyingGlass from "../../../components/icons/svg/MagnifyingGlass";
import Xmark from "../../../components/icons/svg/Xmark";
import Fuse from "fuse.js";
import Plus from "../../../components/icons/svg/Plus";
import Modal from "../../../components/ui/Modal";
import CreateRoleModal from "../../../components/guilds/CreateRoleModal";

function roleColor(provided: number | undefined) {
  return provided ? '#' + provided.toString(16) : 'rgb(var(--c-fg) / 0.8)'
}

function LargeRolePreview(
  props: { guildId: bigint, members: Member[], role: Role, draggable: boolean, gripping?: boolean }
) {
  const membersInRole = createMemo(() => sumIterator(mapIterator(
    props.members,
    (member) => member.roles?.includes(props.role.id) ? 1 : 0 as number
  )))

  const sortable = props.draggable ? createSortable(props.role.id.toString()) : {} as any
  const sortableDirective = props.draggable ? sortable : () => {}
  void sortableDirective

  return (
    <div
      ref={sortable.ref}
      classList={{
        "flex rounded-lg overflow-hidden transition-transform": true,
        "opacity-25": sortable.isActiveDraggable,
      }}
      use:sortableDirective
    >
      <Show when={props.draggable || props.gripping}>
        <div
          class="flex group items-center justify-center px-3 bg-bg-0 transition hover:bg-3 cursor-grab"
          {...(!props.gripping && sortable.dragActivators)}
        >
          <Icon
            icon={GripDotsVertical}
            classList={{
              "w-6 h-6 transition-all": true,
              [props.gripping ? "fill-fg/100" : "fill-fg/50 group-hover:fill-fg/80"]: true,
            }}
          />
        </div>
      </Show>
      <A
        class="flex flex-grow bg-bg-1/80 hover:bg-3 transition items-center justify-between p-4"
        href={`/guilds/${props.guildId}/settings/roles/${props.role.id}`}
      >
        <div class="flex items-center gap-x-4 text-fg">
          <div class="w-4 h-4 rounded-full" style={{ "background-color": roleColor(props.role.color) }} />
          <div class="flex-grow">
            <h3 class="text-lg font-title">{props.role.name}</h3>
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
  roleIds: Signal<bigint[]>,
  roles: Role[],
}

export function SortableRoles(props: Props) {
  const cache = getApi()!.cache!
  const members = createMemo(() =>
    cache.memberReactor.get(props.guildId)?.map(id => cache.members.get(memberKey(props.guildId, id))!) ?? []
  );
  const [roleIds, setRoleIds] = props.roleIds

  const [activeRole, setActiveRole] = createSignal<string>()
  const onDragStart: DragEventHandler = ({ draggable }) => setActiveRole(draggable.id as string)
  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    if (draggable && droppable) {
      const roles = roleIds()
      const fromIndex = roles.indexOf(BigInt(draggable.id))
      const toIndex = roles.indexOf(BigInt(droppable.id))

      if (fromIndex !== toIndex) {
        const newRoles = [...roles];
        [newRoles[fromIndex], newRoles[toIndex]] = [newRoles[toIndex], newRoles[fromIndex]]
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

  let searchRef: HTMLInputElement | null
  const [searchQuery, setSearchQuery] = createSignal('')

  const index = createMemo(() => new Fuse(props.roles, { keys: ['name'] }))
  const queryResults = createMemo(() => searchQuery()
    ? index().search(searchQuery()).map(result => result.item.id)
    : roleIds()
  )

  const [showCreateRoleModal, setShowCreateRoleModal] = createSignal(false)

  return (
    <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <Modal get={showCreateRoleModal} set={setShowCreateRoleModal}>
        <CreateRoleModal guildId={props.guildId} />
      </Modal>
      <DragDropSensors />
      <ConstrainDragAxis />
      <div class="flex flex-col w-full gap-y-2">
        <div class="flex gap-x-2">
          <div class="flex flex-grow bg-bg-3/60 rounded-lg items-center">
            <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/50 my-3 ml-3" />
            <input
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
            <Icon icon={Plus} class="w-4 h-4 fill-fg" />
            <span class="mobile:hidden">Create Role</span>
          </button>
        </div>
        <SortableProvider ids={roleIds().map(r => r.toString())}>
          <For each={queryResults()}>
            {roleId => (
              <LargeRolePreview
                guildId={props.guildId}
                members={members()}
                role={cache.roles.get(roleId)!}
                draggable={searchQuery() === ''}
              />
            )}
          </For>
        </SortableProvider>
        <A
          class="bg-bg-0/70 flex justify-between rounded-lg items-center p-4 transition hover:bg-3"
          href={`/guilds/${props.guildId}/settings/roles/${withModelType(props.guildId, ModelType.Role)}`}
        >
          <div class="flex items-center gap-x-3 font-title">
            <Icon icon={Users} class="w-6 h-6 fill-fg/80" />
            Manage Default Permissions
          </div>
          <Icon icon={ChevronRight} class="w-5 h-5 fill-fg/50" />
        </A>
      </div>
      <DragOverlay>
        <Show when={activeRole()}>
          <LargeRolePreview
            guildId={props.guildId}
            members={members()}
            role={cache.roles.get(BigInt(activeRole()!))!}
            draggable={false}
            gripping={true}
          />
        </Show>
      </DragOverlay>
    </DragDropProvider>
  )
}

export default function Roles() {
  const params = useParams()

  const api = getApi()!
  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)

  const defaultRoleId = createMemo(() => withModelType(guildId(), ModelType.Role))
  const guildRoles = createMemo(() => guild().roles!.filter(r => r.id != defaultRoleId()))

  const roleIds = createSignal<bigint[]>(guildRoles().map(r => r.id).reverse())

  return (
    <div class="px-3 py-2">
      <Header>Roles</Header>
      <p class="mb-4 px-1 font-light text-sm text-fg/50">
        Roles are used to group members in your server and grant them permissions.
      </p>
      <SortableRoles guildId={guildId()} roleIds={roleIds} roles={guildRoles()} />
    </div>
  )
}