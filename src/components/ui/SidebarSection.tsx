import {ParentProps} from "solid-js";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

export default function SidebarSection(
  { children, plusAction, plusTooltip }: ParentProps<{ plusAction?: () => any, plusTooltip?: string }>
) {
  return (
    <div class="flex justify-between select-none mt-1 items-center">
      <span class="font-bold text-xs px-1 py-2 uppercase text-base-content/50">{children}</span>
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
