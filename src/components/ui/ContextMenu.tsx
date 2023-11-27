import {Accessor, createSignal, JSX, ParentProps, Setter} from "solid-js";
import Icon, {IconElement} from "../icons/Icon";
import ChevronRight from "../icons/svg/ChevronRight";
import useContextMenu, {ContextMenuContext} from "../../hooks/useContextMenu";

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
        <Icon icon={ChevronRight} class="w-4 h-4 ml-auto fill-fg/50" />
      )}
    </button>
  )
}

export function ContextMenuButton(props: ContextMenuButtonProps) {
  return (
    <BaseContextMenuButton
      buttonClass="hover:bg-2"
      iconClass="fill-fg"
      textClass=""
      {...props}
    />
  )
}

export function DangerContextMenuButton(props: ContextMenuButtonProps) {
  return (
    <BaseContextMenuButton
      buttonClass="hover:bg-danger"
      iconClass="fill-danger group-hover:fill-fg"
      textClass="text-danger group-hover:text-fg"
      {...props}
    />
  )
}

export default function ContextMenu({ children }: ParentProps) {
  return (
    <div class="flex flex-col p-2 min-w-[200px] bg-0 rounded-lg">
      {children}
    </div>
  )
}

type Position = { x: number, y: number }

export interface ContextMenuProps {
  menu: Accessor<JSX.Element | null>
  setMenu: Setter<JSX.Element | null>
  pos: Accessor<Position>
  setPos: Setter<Position>
  getHandler(menu: JSX.Element): (event: MouseEvent) => void
  hide(): void
}

export function ContextMenuProvider(props: ParentProps) {
  const [menu, setMenu] = createSignal<JSX.Element>(null)
  const [pos, setPos] = createSignal({ x: 0, y: 0 })
  const manager: ContextMenuProps = {
    menu,
    setMenu,
    pos,
    setPos,
    getHandler(menu: JSX.Element) {
      return (event: MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setPos({
          x: event.clientX,
          y: event.clientY,
        })
        setMenu(() => menu)
      }
    },
    hide() {
      setMenu(null)
    },
  }

  return (
    <ContextMenuContext.Provider value={manager}>
      {props.children}
    </ContextMenuContext.Provider>
  )
}
