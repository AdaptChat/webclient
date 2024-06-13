import manifest from "../../permissions.json";
import Check from "../icons/svg/Check";
import {Accessor, createMemo, Show} from "solid-js";
import Dash from "../icons/svg/Dash";
import Xmark from "../icons/svg/Xmark";
import {Permissions} from "../../api/Bitflags";
import Icon, {IconElement} from "../icons/Icon";
import {GuildChannel} from "../../types/channel";

type SignalLike<T> = [Accessor<T>, (value: T) => any]

interface Props {
  enabledPermissions: Permissions
  allowSignal: SignalLike<Permissions>
  denySignal: SignalLike<Permissions>
  noInherit?: boolean
  channelType?: GuildChannel["type"]
}

export default function PermissionsView(props: Props) {
  const [allow, setAllow] = props.allowSignal
  const [deny, setDeny] = props.denySignal

  const filterCategory = (category: (typeof manifest)[number]) => category
    .permissions
    .filter(({ channels }) => props.channelType == null || channels.includes(props.channelType))

  const filtered = createMemo(() => manifest.map((category) => {
    category.permissions = filterCategory(category)
    return category
  }).filter(
    ({ permissions }) => permissions.length > 0
  ))

  return (
    <>
      {filtered().map((category, i) => (
        <div class="flex flex-col border-fg/10" classList={{ "border-b-[1px] mb-4": i != filtered().length - 1 }}>
          <h3 class="font-bold text-sm uppercase text-fg/60 mt-2 mb-4">{category.name}</h3>
          {category.permissions.map(({ flag, label, description }) => (
            <div
              class="flex justify-between items-center mb-6 gap-x-2"
              classList={{
                "opacity-50 pointer-events-none cursor-not-allowed": !props.enabledPermissions.has(flag)
              }}
            >
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
                <Show when={!props.noInherit}>
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
                  active={(props.noInherit ? !allow().has(flag) : false) || deny().has(flag)}
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
    </>
  )
}

type ButtonProps = {
  flag: string,
  icon: IconElement,
  tooltip: string,
  active: boolean,
  onClick: (event: MouseEvent) => any
  color: string
  fg?: string
  opacity?: number,
}

function PermissionButton(props: ButtonProps) {
  return (
    <button
      class="w-8 h-8 items-center justify-center transition group flex"
      classList={{
        [props.active ? "bg-" + props.color : `bg-transparent hover:bg-fg/10`]: true,
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
