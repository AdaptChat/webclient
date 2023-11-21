import {ParentProps} from "solid-js";
import Icon, {IconElement} from "../icons/Icon";
import ChevronRight from "../icons/svg/ChevronRight";
import {useContextMenu} from "../../App";

interface ContextMenuButtonProps {
  icon: IconElement,
  label: string,
  buttonClass?: string,
  iconClass?: string,
  textClass?: string,
  onClick?: (event: MouseEvent) => any,
  hideOnClick?: boolean,
  _chevron?: boolean,
}

function BaseContextMenuButton(props: ContextMenuButtonProps) {
  const contextMenu = useContextMenu()!

  return (
    <button
      classList={{
        "flex items-center justify-between w-full p-2 rounded text-sm font-medium transition group": true,
        [props.buttonClass!]: true,
      }}
      onClick={(event: MouseEvent) => {
        props.onClick?.(event)
        if (props.hideOnClick ?? true) contextMenu.hide()
      }}
    >
      <div classList={{ "flex items-center": true, [props.textClass!]: true }}>
        <Icon icon={props.icon} classList={{ "w-4 h-4 mr-2": true, [props.iconClass!]: true }} />
        <span>{props.label}</span>
      </div>
      {props._chevron && (
        <Icon icon={ChevronRight} class="w-4 h-4 ml-auto fill-base-content/50" />
      )}
    </button>
  )
}

export function ContextMenuButton(props: ContextMenuButtonProps) {
  return (
    <BaseContextMenuButton
      buttonClass="hover:bg-gray-800"
      iconClass="fill-base-content"
      textClass=""
      {...props}
    />
  )
}

export function DangerContextMenuButton(props: ContextMenuButtonProps) {
  return (
    <BaseContextMenuButton
      buttonClass="hover:bg-error"
      iconClass="fill-error group-hover:fill-base-content"
      textClass="text-error group-hover:text-base-content"
      {...props}
    />
  )
}

export default function ContextMenu({ children }: ParentProps) {
  return (
    <div class="flex flex-col p-2 min-w-[200px] bg-gray-900 rounded-lg">
      {children}
    </div>
  )
}
