import {type JSX, ParentProps, Show} from "solid-js";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import Icon from "../icons/Icon";
import Plus from "../icons/svg/Plus";
noop(tooltip)

export default function SidebarSection(
  props: ParentProps<{ plusAction?: () => any, plusTooltip?: string, badge?: () => JSX.Element }>
) {
  return (
    <div class="flex justify-between select-none mt-1 items-center">
      <span class="font-bold text-xs px-1 py-2 uppercase text-fg/50">
        {props.children}
        <Show when={props.badge?.() != null} keyed={false}>
          <span class="px-1.5 py-0.5 rounded-[25%] bg-0 ml-1">{props.badge!()}</span>
        </Show>
      </span>
      {props.plusAction && (
        <button
          class="w-4 h-4 mr-2 group"
          onClick={() => props.plusAction!()}
          use:tooltip={props.plusTooltip}
        >
          <Icon
            icon={Plus}
            title={props.plusTooltip}
            class="w-full h-full fill-fg opacity-50 group-hover:opacity-80 transition duration-200"
          />
        </button>
      )}
    </div>
  )
}
