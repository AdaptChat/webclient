import {type JSX, ParentProps} from "solid-js";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

export default function SidebarSection(
  { children, plusAction, plusTooltip, badge }:
    ParentProps<{ plusAction?: () => any, plusTooltip?: string, badge?: JSX.Element }>
) {
  return (
    <div class="flex justify-between select-none mt-1 items-center">
      <span class="font-bold text-xs px-1 py-2 uppercase text-base-content/50">
        {children}
        {badge != null && (
          <span class="px-1.5 py-0.5 rounded-[25%] bg-gray-900 ml-1">{badge}</span>
        )}
      </span>
      {plusAction && (
        <button
          class="w-4 h-4 mr-2 group"
          onClick={() => plusAction()}
          use:tooltip={plusTooltip}
        >
          <img
            src="/icons/plus.svg"
            alt={plusTooltip}
            class="w-full h-full invert opacity-50 group-hover:opacity-80 transition duration-200"
          />
        </button>
      )}
    </div>
  )
}
