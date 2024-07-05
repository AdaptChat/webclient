import Icon from "../icons/Icon";
import PenToSquare from "../icons/svg/PenToSquare";
import {ParentProps, Setter} from "solid-js";

export interface Props {
  setImageData: Setter<string | null | undefined>
}

export function promptImageUpload(setData: (data: string) => any) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/png, image/jpeg, image/gif'
  input.onchange = async () => {
    const file = input.files![0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => setData(reader.result as string)
    reader.readAsDataURL(file)
  }
  input.click()
}

export default function EditableAvatar(props: ParentProps<Props>) {
  return (
    <button
      class="group relative rounded-[50%] hover:rounded-lg overflow-hidden transition-all duration-200"
      onClick={() => promptImageUpload(props.setImageData)}
    >
      <div
        class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur rounded-lg
          opacity-0 group-hover:opacity-100 transition duration-200"
      >
        <Icon icon={PenToSquare} class="w-6 h-6 fill-fg" title="Edit Avatar" />
        <span class="uppercase font-bold text-xs mt-1">Edit</span>
      </div>
      {props.children}
    </button>
  )
}
