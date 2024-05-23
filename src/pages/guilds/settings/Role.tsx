import Header from "../../../components/ui/Header";
import {SortableRoles} from "./Roles";
import {A, useNavigate, useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {createEffect, createMemo, createSignal, ParentProps} from "solid-js";
import {snowflakes} from "../../../utils";
import {RoleFlags} from "../../../api/Bitflags";
import Icon from "../../../components/icons/Icon";
import ChevronLeft from "../../../components/icons/svg/ChevronLeft";

export default function Role(props: ParentProps) {
  const params = useParams()

  const api = getApi()!
  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)

  const defaultRoleId = createMemo(() => snowflakes.withModelType(guildId(), snowflakes.ModelType.Role))
  const guildRoles = createMemo(() => guild().roles!.filter(r => r.id != defaultRoleId()))

  const [roleIds, setRoleIds] = createSignal<bigint[]>([])
  createEffect(() => setRoleIds(guildRoles().map(r => r.id).reverse()))

  const navigate = useNavigate()
  const roleId = createMemo(() => BigInt(params.roleId))
  const role = createMemo(() => api.cache!.roles.get(roleId())!)
  const roleFlags = createMemo(() => RoleFlags.fromValue(role().flags))

  const root = () => `/guilds/${guildId()}/settings/roles`
  const base = () => `${root()}/${roleId()}`
  createEffect(() => {
    if (!role()) navigate(`${root()}/${defaultRoleId()}`)
  })

  return (
    <div class="flex px-2 pt-4 h-[calc(100%-3rem)]">
      <Header>
        <A href={base()} class="hover:underline underline-offset-2">Roles</A>
      </Header>
      <div class="pr-1 w-52 mobile:hidden border-r-[1px] border-fg/10 overflow-y-auto">
        <SortableRoles guildId={guildId()} roleIds={[roleIds, setRoleIds]} roles={guildRoles()} />
      </div>
      <div class="px-4 mobile:px-2">
        <h2 class="font-title font-bold text-lg flex items-center gap-x-1">
          <A href={base()} class="hidden mobile:block">
            <Icon icon={ChevronLeft} class="w-5 h-5 fill-fg/50 hover:fill-fg/100 transition-all" tooltip="Back" />
          </A>
          {roleFlags().has('DEFAULT') ? 'Default Permissions' : role().name}
        </h2>
      </div>
    </div>
  )
}
