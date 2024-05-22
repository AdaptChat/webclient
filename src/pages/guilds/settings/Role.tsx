import Header from "../../../components/ui/Header";
import {SortableRoles} from "./Roles";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {createEffect, createMemo, createSignal} from "solid-js";
import {snowflakes} from "../../../utils";

export default function Role() {
  const params = useParams()

  const api = getApi()!
  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)

  const defaultRoleId = createMemo(() => snowflakes.withModelType(guildId(), snowflakes.ModelType.Role))
  const guildRoles = createMemo(() => guild().roles!.filter(r => r.id != defaultRoleId()))

  const [roleIds, setRoleIds] = createSignal<bigint[]>([])
  createEffect(() => setRoleIds(guildRoles().map(r => r.id).reverse()))

  return (
    <div class="flex px-2 pt-4 h-[calc(100%-3rem)]">
      <Header>Roles</Header>
      <div class="pr-1 w-52 mobile:hidden border-r-[1px] border-fg/10 overflow-y-auto">
        <SortableRoles guildId={guildId()} roleIds={[roleIds, setRoleIds]} roles={guildRoles()} />
      </div>
      <p class="px-4">WIP</p>
    </div>
  )
}
