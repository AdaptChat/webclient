import {ParentProps} from "solid-js";

export default function Layout(props: ParentProps) {
  return (
    <div class="w-full h-full overflow-auto">
      {props.children}
    </div>
  )
}
