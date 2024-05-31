import {createMemo, JSX, ParentProps} from "solid-js";
import {A, useLocation} from "@solidjs/router";
import {setShowSidebar} from "../../App";
import Icon, {IconElement} from "../icons/Icon";

const WrappedButtonComponent = (props: ParentProps<JSX.ButtonHTMLAttributes<HTMLButtonElement>>) => (
  <button {...props} />
)

export interface Props {
  href?: string | string[],
  onClick?: () => void,
  onContextMenu?: (event: MouseEvent) => any,
  svg?: IconElement,
  iconUrl?: string,
  active?: boolean | ((pathname: string) => boolean),
  danger?: boolean,
  large?: boolean,
  disabled?: boolean,
}

export default function SidebarButton(props: ParentProps<Props>) {
  const Component = props.href ? A : WrappedButtonComponent
  const location = useLocation()
  const active = createMemo(() => {
    if (typeof props.active == 'function')
      return props.active(location.pathname)

    if (props.active) return true
    if (!props.href) return false

    if (typeof props.href == 'string')
      return location.pathname == props.href

    return props.href.includes(location.pathname)
  })

  return (
    <Component
      href={typeof props.href == 'string' ? props.href : props.href?.[0]!}
      classList={{
        "w-full group flex items-center gap-x-2 rounded-lg transition-all duration-200": true,
        [props.large ? "p-2.5 mobile:px-2.5 mobile:py-4 mobile:gap-x-4" : "p-2"]: true,
        "hover:bg-3": !props.danger,
        "hover:bg-danger": props.danger,
        "opacity-50 disabled cursor-not-allowed": props.disabled,
        "bg-0": active(),
      }}
      onClick={() => {
        if (window.innerWidth < 768) setShowSidebar(false)
        if (!props.disabled) props.onClick?.()
      }}
      onContextMenu={props.onContextMenu}
    >
      {props.svg && (
        <Icon
          icon={props.svg}
          classList={{
            "select-none transition-all duration-200": true,
            [props.large ? "w-5 h-5" : "w-4 h-4"]: true,
            "opacity-100": active() || props.danger,
            "opacity-50": !active() && !props.danger,
            "group-hover:opacity-80 fill-fg": !props.danger,
            "fill-danger group-hover:fill-fg": props.danger,
          }}
        />
      )}
      {props.iconUrl && <img src={props.iconUrl} alt="" class="w-4 h-4" />}
      <span classList={{
        "transition-all duration-200 text-left w-full": true,
        [props.large ? "font-title" : "text-sm"]: true,
        "text-opacity-100": active() || props.danger,
        "text-opacity-60": !active() && !props.danger,
        "text-fg group-hover:text-opacity-80": !props.danger,
        "text-danger group-hover:text-fg": props.danger,
      }}>
        {props.children}
      </span>
    </Component>
  )
}