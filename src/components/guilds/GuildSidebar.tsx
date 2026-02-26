import {A, useBeforeLeave, useNavigate, useParams} from "@solidjs/router";
import {createEffect, createMemo, createSignal, For, Match, Show, Switch, onMount, onCleanup, Index} from "solid-js";
import {getApi} from "../../api/Api";
import {GuildChannel} from "../../types/channel";
import {ModalId, useModal} from "../ui/Modal";
import Icon, {IconElement} from "../icons/Icon";
import ChevronDown from "../icons/svg/ChevronDown";
import UserPlus from "../icons/svg/UserPlus";
import Trash from "../icons/svg/Trash";
import RightFromBracket from "../icons/svg/RightFromBracket";
import HomeIcon from "../icons/svg/Home";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import Code from "../icons/svg/Code";
import Plus from "../icons/svg/Plus";
import {getIcon} from "../channels/CreateChannelModal";
import Gear from "../icons/svg/Gear";
import FolderPlus from "../icons/svg/FolderPlus";
import BookmarkEmpty from "../icons/svg/BookmarkEmpty";
import {ReactiveSet} from "@solid-primitives/set";
import ChevronRight from "../icons/svg/ChevronRight";
import tooltip from "../../directives/tooltip";
import {setShowSidebar} from "../../App";
import {t} from "../../i18n";
import GripDotsVertical from "../icons/svg/GripDotsVertical";
import PenToSquare from "../icons/svg/PenToSquare";
import Check from "../icons/svg/Check";
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
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
void tooltip

interface GuildDropdownButtonProps {
  icon: IconElement,
  label: string,
  groupHoverColor?: string,
  svgClass?: string,
  labelClass?: string,
  onClick?: () => any,
  py?: string,
}

function GuildDropdownButton(props: GuildDropdownButtonProps) {
  const svgClasses = "w-4 h-4 " + (props.svgClass ?? "")
  const labelClasses = "ml-2 font-medium " + (props.labelClass ?? "")
  const groupHoverClass = props.groupHoverColor
    ? `hover:bg-${props.groupHoverColor}`
    : "hover:bg-accent"

  return (
    <li class={`mx-1.5 rounded-lg group/gdb ${groupHoverClass} transition-all duration-300`}>
      <a class="px-2 py-1.5 text-sm flex items-center" onClick={props.onClick}>
        <Icon icon={props.icon} class={svgClasses} />
        <span class={labelClasses}>{props.label}</span>
      </a>
    </li>
  )
}

interface ChannelProps {
  channel: GuildChannel
  editing: boolean
  gripping?: boolean
}

function Channel(props: ChannelProps) {
  const api = getApi()!
  const cache = api.cache!

  const params = useParams()
  const navigate = useNavigate()
  const guildId = createMemo(() => BigInt(params.guildId!))
  const contextMenu = useContextMenu()!

  const isUnread = createMemo(() => cache.isChannelUnread(props.channel.id))
  const mentionCount = createMemo(() => cache.countGuildMentionsIn(guildId(), props.channel.id))
  const permissions = createMemo(() => cache.getClientPermissions(guildId(), props.channel.id))

  // only createSortable when editing and not in overlay
  const sortable = props.editing && !props.gripping ? createSortable(props.channel.id.toString()) : {} as any
  const sortableDirective = (el: HTMLElement) => {
    if (props.editing && !props.gripping) sortable(el)
  }
  void sortableDirective

  const [state] = useDragDropContext() ?? []

  const markRead = async () => {
    const lastMessageId = cache.lastMessages.get(props.channel.id)?.id
    if (lastMessageId) {
      await api.request('PUT', `/channels/${props.channel.id}/ack/${lastMessageId}`)
    }
  }
  const active = () => params.channelId === props.channel.id.toString()
  const settings = () => `/guilds/${guildId()}/${props.channel.id}/settings`

  const [hovered, setHovered] = createSignal(false)
  const {showModal} = useModal()

  const sharedClass = "flex items-center gap-x-2 p-2 rounded-xl group transition hover:bg-3"
  const sharedClassList = () => ({
    "bg-bg-3/50": active() && !props.gripping && !props.editing,
    "bg-3": !!props.gripping,
    "opacity-25": props.editing && !props.gripping && sortable.isActiveDraggable,
    "transition-transform": props.editing && !!state?.active.draggable,
  })
  const sharedStyle = () => props.editing && !props.gripping ? transformStyle(sortable.transform) : undefined

  const innerContent = () => (
    <>
      <Icon
        icon={getIcon(props.channel.type)}
        class="w-4 h-4 transition-all flex-shrink-0"
        classList={{ [isUnread() || active() ? "fill-fg/100" : "fill-fg/60"]: true }}
      />
      <span class="flex justify-between items-center flex-grow min-w-0">
        <span
          class="transition text-sm overflow-x-hidden"
          classList={{ [active() || isUnread() || !!mentionCount() ? "text-fg/100" : "text-fg/60"]: true }}
        >
          {props.channel.name}
        </span>
        <Show when={props.editing} fallback={
          <Switch>
            <Match when={permissions().has("MODIFY_CHANNELS") && hovered()}>
              <A href={settings()} onClick={e => e.stopPropagation()}>
                <Icon
                  icon={Gear}
                  class="w-3 h-3 fill-fg/50 transition hover:fill-fg/100"
                  tooltip={{ content: "Edit Channel", placement: "right" }}
                />
              </A>
            </Match>
            <Match when={mentionCount()}>
              <div class="text-sm px-1.5 min-w-[1.25rem] h-5 bg-red-600 text-fg rounded-full flex items-center justify-center">
                {mentionCount()?.toLocaleString()}
              </div>
            </Match>
            <Match when={isUnread()}>
              <span class="w-2 h-2 bg-fg rounded-lg flex-shrink-0" />
            </Match>
          </Switch>
        }>
          <div
            class="flex-shrink-0 cursor-grab touch-none ml-1"
            {...(!props.gripping && sortable.dragActivators)}
          >
            <Icon
              icon={GripDotsVertical}
              classList={{
                "w-4 h-4 transition-all": true,
                [props.gripping ? "fill-fg/60" : "fill-fg/20 group-hover:fill-fg/40"]: true,
              }}
            />
          </div>
        </Show>
      </span>
    </>
  )

  return (
    <Show when={props.editing} fallback={
      <A
        class={sharedClass}
        classList={sharedClassList()}
        href={`/guilds/${guildId()}/${props.channel.id}`}
        onContextMenu={contextMenu.getHandler(
          <ContextMenu>
            <Show when={isUnread()}>
              <ContextMenuButton icon={BookmarkEmpty} label="Mark as Read" onClick={markRead} />
            </Show>
            <ContextMenuButton
              icon={Code}
              label={t("copy.channel_id.imperative")}
              onClick={() => window.navigator.clipboard.writeText(props.channel.id.toString())}
            />
            <Show when={permissions().has('MODIFY_CHANNELS')}>
              <ContextMenuButton icon={Gear} label="Edit Channel" onClick={() => navigate(settings())} />
            </Show>
            <Show when={permissions().has('MANAGE_CHANNELS')}>
              <DangerContextMenuButton
                icon={Trash}
                label="Delete Channel"
                onClick={() => showModal(ModalId.DeleteChannel, props.channel)}
              />
            </Show>
          </ContextMenu>
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => { if (window.innerWidth < 768) setShowSidebar(false) }}
      >
        {innerContent()}
      </A>
    }>
      <div
        class={sharedClass}
        classList={sharedClassList()}
        style={sharedStyle()}
        use:sortableDirective
      >
        {innerContent()}
      </div>
    </Show>
  )
}

function GuildMajorLink(props: { icon: IconElement, label: string, href: string, active: boolean }) {
  return (
    <A href={props.href} class="rounded-xl flex items-center p-1 gap-x-2 group transition hover:bg-3">
      <div
        class="w-9 h-9 rounded-[10px] flex items-center justify-center transition"
        classList={{ [props.active ? "bg-accent" : "bg-fg/10"]: true }}
      >
        <Icon icon={props.icon} class="w-4 h-4 fill-fg" />
      </div>
      <span class="font-title transition" classList={{ [props.active ? "text-fg/100" : "text-fg/70"]: true }}>
        {props.label}
      </span>
    </A>
  )
}

function ChannelListSkeleton() {
  return (
    <div class="flex flex-col gap-y-1 p-2">
      <Index each={Array(6)}>
        {(_, i) => (
          <div class="flex items-center gap-x-2 py-2 animate-pulse" style={{
            "animation-delay": i * 100 + 'ms',
          }}>
            <div class="w-4 h-4 rounded-full bg-fg/10 flex-shrink-0" />
            <div
              class="h-3 rounded-full bg-fg/10"
              style={{ width: `${55 + ((i * 37 + 13) % 35)}%` }}
            />
          </div>
        )}
      </Index>
    </div>
  )
}

/**
 * Builds the flat ordered list of channel IDs used by SortableProvider.
 *
 * Order: uncategorized channels (sorted by position), then for each category
 * (sorted by position): the category itself, then its children (sorted by position).
 */
function buildFlatOrder(allChannels: GuildChannel[]): bigint[] {
  const uncategorized = allChannels
    .filter(c => c.type !== 'category' && !c.parent_id)
    .sort((a, b) => a.position - b.position)

  const categories = allChannels
    .filter(c => c.type === 'category')
    .sort((a, b) => a.position - b.position)

  const result: bigint[] = uncategorized.map(c => c.id)
  for (const cat of categories) {
    result.push(cat.id)
    const children = allChannels
      .filter(c => c.type !== 'category' && c.parent_id && BigInt(c.parent_id) === cat.id)
      .sort((a, b) => a.position - b.position)
    for (const child of children) result.push(child.id)
  }
  return result
}

/**
 * Given the flat ordered list, reconstruct the channel groups.
 */
function buildGroups(
  orderedIds: bigint[],
  channelMap: Map<bigint, GuildChannel>,
): Map<bigint | null, { category: GuildChannel | null; children: GuildChannel[] }> {
  const map = new Map<bigint | null, { category: GuildChannel | null; children: GuildChannel[] }>()
  map.set(null, { category: null, children: [] })

  let currentCategoryId: bigint | null = null
  for (const id of orderedIds) {
    const ch = channelMap.get(id)
    if (!ch) continue
    if (ch.type === 'category') {
      currentCategoryId = id
      map.set(id, { category: ch, children: [] })
    } else {
      map.get(currentCategoryId)?.children.push(ch)
    }
  }
  return map
}

/** 
 * Computes the actual payload for updating channels in the webserver.
 */
function computePositionPayload(
  orderedIds: bigint[],
  channelMap: Map<bigint, GuildChannel>,
): { id: bigint; position: number; parent_id?: bigint | null }[] {
  const payloads: { id: bigint; position: number; parent_id?: bigint | null }[] = []
  let currentCategoryId: bigint | null = null
  const scopeCounters = new Map<bigint | null, number>()
  scopeCounters.set(null, 0)
  let catCounter = 0

  for (const id of orderedIds) {
    const ch = channelMap.get(id)
    if (!ch) continue

    if (ch.type === 'category') {
      currentCategoryId = id
      if (!scopeCounters.has(id)) scopeCounters.set(id, 0)

      const newPos = catCounter++
      if (newPos !== ch.position) {
        payloads.push({ id, position: newPos })
      }
    } else {
      const scope = currentCategoryId
      const pos = scopeCounters.get(scope) ?? 0
      scopeCounters.set(scope, pos + 1)

      const oldParentId = ch.parent_id ? BigInt(ch.parent_id) : null
      const newParentId = scope
      const parentChanged = newParentId !== oldParentId

      if (pos !== ch.position || parentChanged) {
        payloads.push({ id, position: pos, ...(parentChanged ? { parent_id: newParentId } : {}) })
      }
    }
  }
  return payloads
}

export default function GuildSidebar() {
  const params = useParams()
  const navigate = useNavigate()
  const guildId = createMemo(() => BigInt(params.guildId!))
  const channelId = createMemo(() => params.channelId && BigInt(params.channelId))
  const contextMenu = useContextMenu()!
  const {showModal} = useModal()

  const api = getApi()!
  const guild = createMemo(() => api.cache!.guilds.get(guildId()))
  createEffect(() => {
    if (!guild()) navigate('/')
  })
  onMount(() => api.ws?.ensureGuildLoaded(guildId()))

  const [dropdownExpanded, setDropdownExpanded] = createSignal(false)
  const isOwner = createMemo(() => guild()?.owner_id === api.cache?.clientUser?.id)
  const guildPermissions = createMemo(() => api.cache?.getClientPermissions(guildId()))

  const [editing, setEditing] = createSignal(false)
  const [editOrder, setEditOrder] = createSignal<bigint[]>([])
  const [saving, setSaving] = createSignal(false)

  let dropdownRef: HTMLUListElement | undefined
  let toggleRef: HTMLDivElement | undefined

  onMount(() => {
    const handleClick = (e: MouseEvent) => {
      if (!dropdownExpanded()) return
      if (
        !dropdownRef?.contains(e.target as Node) &&
        !toggleRef?.contains(e.target as Node)
      ) {
        setDropdownExpanded(false)
      }
    }
    document.addEventListener("click", handleClick)
    onCleanup(() => document.removeEventListener("click", handleClick))
  })

  const BaseContextMenu = () => (
    <Show when={guildPermissions()?.has('CREATE_INVITES')}>
      <ContextMenuButton
        icon={UserPlus}
        label="Invite People"
        buttonClass="hover:bg-accent"
        onClick={() => showModal(ModalId.CreateInvite, guild()!)}
      />
    </Show>
  )

  const allChannels = createMemo(() => {
    const ids = api.cache?.guildChannelReactor?.get(guildId())
    if (!ids) return undefined

    return ids
      .map(id => api.cache!.channels.get(id) as GuildChannel)
      .filter(c => c && api.cache?.getClientPermissions(guildId(), c.id).has('VIEW_CHANNEL'))
  })
  const channelMap = createMemo(() => {
    const map = new Map<bigint, GuildChannel>()
    for (const ch of allChannels() ?? []) map.set(ch.id, ch)
    return map
  })
  const liveOrder = createMemo(() => {
    const channels = allChannels()
    if (!channels) return []
    return buildFlatOrder(channels)
  })

  // when not editing, editOrder tracks liveOrder.
  // when editing, it is only mutated by drag
  createEffect(() => {
    if (!editing()) setEditOrder(liveOrder())
  })

  const enterEditMode = () => {
    setEditOrder(liveOrder())
    setEditing(true)
  }
  const cancelEdit = () => void setEditing(false)
  useBeforeLeave(() => {
    if (editing()) cancelEdit()
  })
  const saveEdit = async () => {
    setSaving(true)
    try {
      const payload = computePositionPayload(editOrder(), channelMap())
      if (payload.length > 0) {
        await api.request('PATCH', `/guilds/${guildId()}/channels`, {
          json: payload.map(p => ({
            id: p.id,
            position: p.position,
            ...(p.parent_id !== undefined ? { parent_id: p.parent_id } : {}),
          }))
        })
      }
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const displayOrder = createMemo(() => editing() ? editOrder() : liveOrder())
  const groups = createMemo(() => {
    const map = channelMap()
    return buildGroups(displayOrder(), map)
  })
  const collapsed = new ReactiveSet<bigint>()

  const [activeChannelId, setActiveChannelId] = createSignal<string>()

  const ConstrainDragAxis = () => {
    const [, { onDragStart, onDragEnd, addTransformer, removeTransformer }] = useDragDropContext()!
    const transformer: Transformer = {
      id: "constrain-x-axis",
      order: 100,
      callback: (transform) => ({ ...transform, x: 0 }),
    }
    onDragStart(({ draggable }) => addTransformer("draggables", draggable.id, transformer))
    onDragEnd(({ draggable }) => removeTransformer("draggables", draggable.id, transformer.id))
    return <></>
  }

  const onDragStart: DragEventHandler = ({ draggable }) => {
    setActiveChannelId(draggable.id as string)
  }

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => {
    setActiveChannelId(undefined)
    if (!draggable || !droppable) return

    const order = editOrder()
    const fromIndex = order.indexOf(BigInt(draggable.id))
    const toIndex = order.indexOf(BigInt(droppable.id))
    if (fromIndex === toIndex) return

    const newOrder = [...order]
    newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, BigInt(draggable.id))
    setEditOrder(newOrder)
  }

  const ChannelRow = (channelRowProps: { channel: GuildChannel; gripping?: boolean }) => (
    <Channel
      channel={channelRowProps.channel}
      editing={editing()}
      gripping={channelRowProps.gripping}
    />
  )

  const RenderCategoryHeader = (catProps: {
    id: bigint | null
    group: { category: GuildChannel | null; children: GuildChannel[] }
    gripping?: boolean
  }) => {
    const sortable = editing() && catProps.id && !catProps.gripping
      ? createSortable(catProps.id.toString())
      : {} as any
    const sortableDirective = (el: HTMLElement) => {
      if (editing() && catProps.id && !catProps.gripping) sortable(el)
    }
    void sortableDirective

    const [state] = useDragDropContext() ?? []

    return (
      <div
        ref={sortable.ref}
        classList={{
          "flex justify-between items-center pb-1 pt-3 px-2 group/cat": true,
          "opacity-25": editing() && !catProps.gripping && sortable.isActiveDraggable,
          "transition-transform": editing() && !!state?.active.draggable,
          "bg-3 rounded-lg": !!catProps.gripping,
        }}
        style={editing() && catProps.id && !catProps.gripping ? transformStyle(sortable.transform) : undefined}
        onContextMenu={catProps.id ? contextMenu.getHandler(
          <ContextMenu>
            <ContextMenuButton
              icon={Code}
              label={t("copy.channel_id.category")}
              onClick={() => window.navigator.clipboard.writeText(catProps.id!.toString())}
            />
            <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
              <DangerContextMenuButton
                icon={Trash}
                label={t('sidebar.guild.delete_category')}
                onClick={() => showModal(ModalId.DeleteChannel, catProps.group.category!)}
              />
            </Show>
          </ContextMenu>
        ) : undefined}
        use:sortableDirective
      >
        <button
          class="group flex items-center gap-x-1.5 min-w-0"
          onClick={() => !editing() && catProps.id && (collapsed.has(catProps.id) ? collapsed.delete(catProps.id) : collapsed.add(catProps.id))}
        >
          <Show when={!editing()}>
            <Icon
              icon={catProps.id && collapsed.has(catProps.id) ? ChevronRight : ChevronDown}
              class="w-3 h-3 fill-fg/50 group-hover:fill-fg/100 transition flex-shrink-0"
              tooltip={catProps.id && collapsed.has(catProps.id) ? "Expand" : "Collapse"}
            />
          </Show>
          <span class="font-medium text-sm text-fg/50 group-hover:text-fg/100 transition truncate">
            {catProps.group.category?.name ?? "Channels"}
          </span>
        </button>
        <Show when={!editing()} fallback={
          <Show when={catProps.id && !catProps.gripping}>
            <div
              class="cursor-grab touch-none flex-shrink-0"
              {...sortable.dragActivators}
            >
              <Icon
                icon={GripDotsVertical}
                class="w-4 h-4 fill-fg/20 group-hover/cat:fill-fg/50 transition"
              />
            </div>
          </Show>
        }>
          <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
            <button class="group flex-shrink-0" use:tooltip="Create Channel" onClick={() => {
              showModal(ModalId.CreateChannel, { guildId: guildId(), parentId: catProps.id ?? undefined })
            }}>
              <Icon icon={Plus} class="w-4 h-4 fill-fg/50 group-hover:fill-fg/100 transition" />
            </button>
          </Show>
        </Show>
      </div>
    )
  }

  const channelList = () => {
    const g = groups()
    const uncategorized = g.get(null)
    const sortedCategories = [...(allChannels() ?? [])]
      .filter(c => c.type === 'category')
      .sort((a, b) => displayOrder().indexOf(a.id) - displayOrder().indexOf(b.id))

    return { uncategorized, sortedCategories, g }
  }

  return (
    <Show when={guild()}>
    <div
      class="flex flex-col items-center flex-grow"
      onContextMenu={!editing() ? contextMenu.getHandler(
        <ContextMenu>
          <BaseContextMenu />
          <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
            <ContextMenuButton
              icon={Plus}
              label={t('sidebar.guild.create_channel')}
              onClick={() => showModal(ModalId.CreateChannel, { guildId: guildId() })}
            />
            <ContextMenuButton
              icon={FolderPlus}
              label={t('sidebar.guild.create_category')}
              onClick={() => showModal(ModalId.CreateCategory, { guildId: guildId() })}
            />
            <ContextMenuButton
              icon={PenToSquare}
              label={t('sidebar.guild.edit_channel_order')}
              onClick={enterEditMode}
            />
          </Show>
        </ContextMenu>
      ) : undefined}
    >
      <div
        ref={toggleRef}
        class="box-border flex flex-col justify-end border-b-[1px] border-fg/5
          group hover:bg-2 transition-all duration-200 cursor-pointer relative w-full"
        classList={{ 'min-h-[150px]': !!guild()!.banner }}
        onClick={() => setDropdownExpanded(prev => !prev)}
      >
        <Show when={guild()!.banner}>
          <figure
            class="absolute inset-0 z-0"
            style={{
              "background-image": `url(${guild()!.banner})`,
              "background-size": "cover",
              "background-position": "center",
              "mask-image": "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
            }}
          />
        </Show>
        <div classList={{
          "flex justify-between items-center px-3 mt-3": true,
          "pb-3": !guild()!.description,
        }}>
          <span class="inline-block font-title font-bold text-base truncate min-w-0 pr-2">
            {guild()!.name}
          </span>
          <label tabIndex={0} classList={{
            "cursor-pointer transition-transform transform": true,
            "rotate-0": !dropdownExpanded(),
            "rotate-180": dropdownExpanded()
          }}>
            <Icon
              icon={ChevronDown}
              title="Server Options"
              class="w-3 fill-fg/50"
            />
          </label>
        </div>
        {guild()!.description && (
          <div class="card-body px-3 pt-1 pb-3">
            <p class="text-xs text-fg/50 truncate min-w-0">{guild()!.description}</p>
          </div>
        )}
        <Show when={dropdownExpanded()}>
          <ul
            ref={dropdownRef}
            tabIndex={0}
            class="flex flex-col py-1 absolute rounded-b-xl bg-bg-3/60 backdrop-blur inset-x-0 top-full z-[200]"
          >
            <Show when={guildPermissions()?.has('CREATE_INVITES')}>
              <GuildDropdownButton
                icon={UserPlus}
                label={t('guild.actions.invite_people')}
                svgClass="fill-fg"
                onClick={() => showModal(ModalId.CreateInvite, guild()!)}
              />
            </Show>
            <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
              <GuildDropdownButton
                icon={Plus}
                label={t('sidebar.guild.create_channel')}
                svgClass="fill-fg"
                onClick={() => showModal(ModalId.CreateChannel, { guildId: guildId() })}
              />
              <GuildDropdownButton
                icon={FolderPlus}
                label={t('sidebar.guild.create_category')}
                svgClass="fill-fg"
                onClick={() => showModal(ModalId.CreateCategory, { guildId: guildId() })}
              />
              <GuildDropdownButton
                icon={PenToSquare}
                label={t('sidebar.guild.edit_channel_order')}
                svgClass="fill-fg"
                onClick={enterEditMode}
              />
            </Show>
            <Show when={guildPermissions()?.has('MANAGE_GUILD')}>
              <GuildDropdownButton
                icon={Gear}
                label={t('sidebar.guild.server_settings')}
                groupHoverColor="fg/10"
                svgClass="fill-fg"
                onClick={() => navigate(`/guilds/${guildId()}/settings`)}
              />
            </Show>
            <Show when={!isOwner()}>
              <GuildDropdownButton
                icon={RightFromBracket}
                label={t('guild.actions.leave_server')}
                groupHoverColor="danger"
                svgClass="fill-danger group-hover/gdb:fill-fg"
                labelClass="text-danger group-hover/gdb:text-fg"
                onClick={() => showModal(ModalId.LeaveGuild, guild()!)}
              />
            </Show>
          </ul>
        </Show>
      </div>

      <div class="flex flex-col w-full p-2 flex-grow min-h-0">
        <GuildMajorLink label="Server Home" href={`/guilds/${guildId()}`} icon={HomeIcon} active={!channelId()} />

        <Show when={allChannels()} fallback={<ChannelListSkeleton />}>
          <DragDropProvider onDragStart={onDragStart} onDragEnd={onDragEnd} collisionDetector={closestCenter}>
            <DragDropSensors />
            <ConstrainDragAxis />
            <SortableProvider ids={displayOrder().map(id => id.toString())}>

              <For each={channelList().uncategorized?.children ?? []}>
                {channel => (
                  <Show when={!collapsed.has(BigInt(0)) || api.cache?.isChannelUnread(channel.id)}>
                    <ChannelRow channel={channel} />
                  </Show>
                )}
              </For>

              {/* Categories */}
              <For each={channelList().sortedCategories}>
                {category => {
                  const group = () => channelList().g.get(category.id)
                  return (
                    <Show when={
                      (group()?.children.length ?? 0) > 0
                      || api.cache!.getClientPermissions(guildId(), category.id).has('MANAGE_CHANNELS')
                    }>
                      <RenderCategoryHeader id={category.id} group={group()!} />
                      <For each={group()?.children ?? []} fallback={
                        <div class="rounded-lg p-2 w-full bg-2 text-center">
                          <span class="font-title text-fg/50 text-sm">{t('sidebar.guild.empty_category')}</span>
                        </div>
                      }>
                        {channel => (
                          <Show when={editing() || !collapsed.has(category.id) || api.cache?.isChannelUnread(channel.id)}>
                            <ChannelRow channel={channel} />
                          </Show>
                        )}
                      </For>
                    </Show>
                  )
                }}
              </For>
            </SortableProvider>

            <DragOverlay>
              <Show when={activeChannelId()}>
                {id => {
                  const ch = channelMap().get(BigInt(id()))
                  return (
                    <Show when={ch}>
                      <Show when={ch!.type === 'category'} fallback={<ChannelRow channel={ch!} gripping />}>
                        <RenderCategoryHeader
                          id={ch!.id}
                          group={{ category: ch!, children: [] }}
                          gripping
                        />
                      </Show>
                    </Show>
                  )
                }}
              </Show>
            </DragOverlay>
          </DragDropProvider>
        </Show>
      </div>

      <Show when={editing()}>
        <div class="w-full p-2 flex gap-x-2">
          <button
            class="btn btn-primary cursor-pointer btn-sm flex-grow flex items-center justify-center gap-x-1.5"
            disabled={saving()}
            onClick={saveEdit}
          >
            <Icon icon={Check} class="w-4 h-4 fill-fg" />
            <span>{saving() ? t('generic.saving') : t('sidebar.guild.save_channel_order')}</span>
          </button>
          <button
            class="btn btn-sm cursor-pointer flex items-center justify-center gap-x-1.5 bg-fg/10 hover:bg-fg/15 transition"
            disabled={saving()}
            onClick={cancelEdit}
          >
            <span class="text-fg/70">{t('generic.cancel')}</span>
          </button>
        </div>
      </Show>
    </div>
    </Show>
  )
}
