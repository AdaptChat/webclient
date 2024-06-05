import {createEffect, createMemo, createSignal, Show} from "solid-js";
import {Permissions, RoleFlags} from "../../../api/Bitflags";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {useSaveTask} from "../../settings/SettingsLayout";
import PermissionsView from "../../../components/settings/PermissionsView";

export default function RolePermissions() {
  const params = useParams()

  const api = getApi()!
  const cache = api.cache!

  const roleId = createMemo(() => BigInt(params.roleId))
  const role = createMemo(() => cache.roles.get(roleId())!)

  const [allow, setAllow] = createSignal<Permissions>(Permissions.empty())
  const [deny, setDeny] = createSignal<Permissions>(Permissions.empty())

  const reset = () => {
    setAllow(Permissions.fromValue(role().permissions.allow))
    setDeny(Permissions.fromValue(role().permissions.deny))
  }
  createEffect(reset)

  const [setChanged] = useSaveTask(
    async () => {
      const json = {
        permissions: {
          allow: allow().value,
          deny: deny().value,
        }
      }
      await api.request('PATCH', `/guilds/${role().guild_id}/roles/${role().id}`, { json })
    },
    reset
  )
  createEffect(() => setChanged(
    allow().value != BigInt(role().permissions.allow)
      || deny().value != BigInt(role().permissions.deny)
  ))

  const isDefaultRole = createMemo(() => RoleFlags.fromValue(role().flags).has('DEFAULT'))
  const memberPermissions = createMemo(() => cache.getMemberPermissions(role().guild_id, cache.clientId!))

  return (
    <div class="flex flex-col p-1">
      <PermissionsView
        enabledPermissions={memberPermissions()}
        allowSignal={[allow, setAllow]}
        denySignal={[deny, setDeny]}
        noInherit={isDefaultRole()}
      />
    </div>
  )
}
