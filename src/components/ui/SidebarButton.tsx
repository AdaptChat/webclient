import {createMemo, JSX, ParentProps} from "solid-js";
import {A, useLocation} from "@solidjs/router";
import {setShowSidebar} from "../../pages/Layout";

const WrappedButtonComponent = (props: ParentProps<JSX.ButtonHTMLAttributes<HTMLButtonElement>>) => (
  <button {...props} />
)

export interface Props {
  href?: string | string[],
  onClick?: () => void,
  svg?: string,
  icon?: string,
  active?: boolean,
  danger?: boolean
}

export default function SidebarButton(props: ParentProps<Props>) {
  const Component = props.href ? A : WrappedButtonComponent
  const location = useLocation()
  const active = createMemo(() => {
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
        "w-full group flex items-center gap-x-2 p-2 rounded-lg transition-all duration-200": true,
        "hover:bg-gray-700": !props.danger,
        "hover:bg-error": props.danger,
        "bg-gray-900": active(),
      }}
      onClick={() => {
        if (window.innerWidth < 768) setShowSidebar(false)
        props.onClick?.()
      }}
    >
      {props.svg && (
        <img
          src={props.svg}
          alt=""
          classList={{
            "w-4 h-4 select-none transition-all duration-200": true,
            "opacity-100": active() || props.danger,
            "opacity-50": !active() && !props.danger,
            "group-hover:opacity-80 invert": !props.danger,
            "filter-error group-hover:invert": props.danger,
          }}
        />
      )}
      {props.icon && <img src={props.icon} alt="" class="w-4 h-4" />}
      <span classList={{
        "font-medium text-sm transition-all duration-200": true,
        "text-opacity-100": active() || props.danger,
        "text-opacity-60": !active() && !props.danger,
        "text-base-content group-hover:text-opacity-80": !props.danger,
        "text-error group-hover:text-base-content": props.danger,
      }}>
        {props.children}
      </span>
    </Component>
  )
}