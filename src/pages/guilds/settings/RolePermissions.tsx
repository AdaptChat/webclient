import manifest from '../../../permissions.json'
import {createEffect, createMemo, createSignal, Show} from "solid-js";
import {Permissions, RoleFlags} from "../../../api/Bitflags";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import Icon, {IconElement} from "../../../components/icons/Icon";
import Check from "../../../components/icons/svg/Check";
import Xmark from "../../../components/icons/svg/Xmark";
import Dash from "../../../components/icons/svg/Dash";
import {useSaveTask} from "../../settings/SettingsLayout";

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

  return (
    <div class="flex flex-col p-1">
      {manifest.map((category, i) => (
        <div class="flex flex-col border-fg/10" classList={{ "border-b-[1px] mb-4": i != manifest.length - 1 }}>
          <h3 class="font-bold text-sm uppercase text-fg/60 mt-2 mb-4">{category.name}</h3>
          {category.permissions.map(({ flag, label, description }) => (
            <div class="flex justify-between items-center mb-6 gap-x-2">
              <div class="flex flex-col flex-shrink">
                <h4 class="text-lg font-title">{label}</h4>
                <p class="text-fg/60 text-sm font-light">{description}</p>
              </div>
              <div class="flex overflow-hidden rounded-xl flex-shrink-0 border-[1px] border-fg/20">
                <PermissionButton
                  flag={flag}
                  icon={Check}
                  tooltip="Allow"
                  active={allow().has(flag)}
                  onClick={() => {
                    setAllow(allow().toggle(flag).copy())
                    setDeny(deny().remove(flag).copy())
                  }}
                  color="success"
                />
                <Show when={!isDefaultRole()}>
                  <PermissionButton
                    flag={flag}
                    icon={Dash}
                    tooltip="Inherit"
                    active={!allow().has(flag) && !deny().has(flag)}
                    onClick={() => {
                      setAllow(allow().remove(flag).copy())
                      setDeny(deny().remove(flag).copy())
                    }}
                    color="neutral"
                    fg="fg"
                    opacity={60}
                  />
                </Show>
                <PermissionButton
                  flag={flag}
                  icon={Xmark}
                  tooltip="Deny"
                  active={(isDefaultRole() ? !allow().has(flag) : false) || deny().has(flag)}
                  onClick={() => {
                    setAllow(allow().remove(flag).copy())
                    setDeny(deny().toggle(flag).copy())
                  }}
                  color="danger"
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

type Props = {
  flag: string,
  icon: IconElement,
  tooltip: string,
  active: boolean,
  onClick: (event: MouseEvent) => any
  color: string
  fg?: string
  opacity?: number,
}

function PermissionButton(props: Props) {
  return (
    <button
      class="w-8 h-8 items-center justify-center transition group flex"
      classList={{
        [props.active
          ? "bg-" + props.color
          : `bg-transparent hover:bg-${props.color} hover:bg-opacity-${props.opacity ?? 25}`]: true,
      }}
      onClick={props.onClick}
    >
      <Icon
        icon={props.icon}
        class="w-4 h-4 transition"
        classList={{ [props.active ? "fill-fg" : `fill-${props.fg ?? props.color}`]: true }}
      />
    </button>
  )
}
