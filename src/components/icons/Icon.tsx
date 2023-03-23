import * as tippy from "tippy.js";
import {JSX} from "solid-js";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

type SvgAttrs = JSX.SvgSVGAttributes<SVGSVGElement>
export type IconElement = (props: SvgAttrs) => JSX.Element

export default function Icon(
  props: { icon: IconElement, tooltip?: string | Partial<tippy.Props> } & JSX.HTMLAttributes<HTMLElement>,
) {
  const component = () => {
    const { icon, tooltip, ...rest } = props
    return icon(rest as SvgAttrs)
  }

  return (
    <span use:tooltip={props.tooltip} class="inline">
      {component()}
    </span>
  )
}
