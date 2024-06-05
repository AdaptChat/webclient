import Header from "../../../components/ui/Header";
import {SortableRoles, updateRolePositions} from "./Roles";
import {A, useLocation, useNavigate, useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {createEffect, createMemo, createSignal, ParentProps, Show} from "solid-js";
import {mapIterator, maxIterator, snowflakes} from "../../../utils";
import {RoleFlags} from "../../../api/Bitflags";
import Icon from "../../../components/icons/Icon";
import ChevronLeft from "../../../components/icons/svg/ChevronLeft";
import Lock from "../../../components/icons/svg/Lock";

function RoleInner(props: ParentProps) {
  const params = useParams()

  const cache = getApi()!.cache!
  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => cache.guilds.get(guildId())!)

  const defaultRoleId = createMemo(() => snowflakes.withModelType(guildId(), snowflakes.ModelType.Role))
  const guildRoles = createMemo(() => guild().roles!.filter(r => r.id != defaultRoleId()))

  const originalOrder = createMemo(() => guildRoles().map(r => r.id).reverse())
  const [roleIds, setRoleIds] = createSignal<bigint[]>([])
  createEffect(() => setRoleIds(originalOrder()))

  const navigate = useNavigate()
  const roleId = createMemo(() => BigInt(params.roleId))
  const role = createMemo(() => cache.roles.get(roleId())!)
  const roleFlags = createMemo(() => RoleFlags.fromValue(role().flags))

  const managable = createMemo(() => (
    guild().owner_id == cache.clientId
      || role().position < maxIterator(mapIterator(cache.getMemberRoles(guildId(), cache.clientId!), r => r.position))!
  ))

  const root = () => `/guilds/${guildId()}/settings/roles`
  const base = () => `${root()}/${roleId()}`
  createEffect(() => {
    if (!role()) navigate(`${root()}/${defaultRoleId()}`)
  })

  return (
    <div class="flex px-2 pt-4 h-[calc(100%-2.25rem)]">
      <Header>
        <A href={root()} class="hover:underline underline-offset-2">Roles</A>
      </Header>
      <div class="pr-1 w-52 mobile:hidden border-r-[1px] border-fg/10 overflow-y-auto">
        <SortableRoles
          guildId={guildId()}
          originalOrder={originalOrder()}
          roleIds={[roleIds, setRoleIds]}
          roles={guildRoles()}
        />
      </div>
      <div class="px-4 mobile:px-2 w-full overflow-y-auto">
        <h2 class="font-title font-bold text-lg flex items-center gap-x-1">
          <A href={root()} class="hidden mobile:block">
            <Icon icon={ChevronLeft} class="w-5 h-5 fill-fg/50 hover:fill-fg/100 transition-all" tooltip="Back" />
          </A>
          {roleFlags().has('DEFAULT') ? 'Default Permissions' : role().name}
          <Show when={!managable()}>
            <Icon icon={Lock} class="w-5 h-5 ml-1 fill-fg/50" tooltip="You cannot modify this role" />
          </Show>
        </h2>
        <Show when={!roleFlags().has('DEFAULT')}>
          <div class="flex gap-x-2 mt-2 border-b-[1px] border-fg/10">
            <RoleSublink href={base()}>Overview</RoleSublink>
            <RoleSublink href={`${base()}/permissions`}>Permissions</RoleSublink>
            <Show when={roleId() != defaultRoleId()}>
              <RoleSublink href={`${base()}/members`}>Members</RoleSublink>
            </Show>
          </div>
        </Show>
        <div
          class="flex flex-col w-full mt-2"
          classList={{ "opacity-50 cursor-not-allowed pointer-events-none": !managable() }}
        >
          {props.children}
        </div>
      </div>
    </div>
  )
}

function RoleSublink(props: {href: string, children: string}) {
  const location = useLocation()
  return (
    <A
      href={props.href}
      class="text-fg/70 px-3 py-1 mobile:py-1.5 rounded-t-lg hover:text-fg/100 transition-all"
      classList={{ "bg-accent !text-fg/100": location.pathname === props.href }}
    >
      {props.children}
    </A>
  )
}

export default function Role(props: ParentProps) {
  const params = useParams()
  const cache = getApi()!.cache!

  return (
    <Show when={cache.roles.has(BigInt(params.roleId))} fallback="Loading...">
      <RoleInner {...props} />
    </Show>
  )
}
