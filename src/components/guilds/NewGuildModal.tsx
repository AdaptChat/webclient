import {ModalTemplate} from "../ui/Modal";
import {ParentProps} from "solid-js";

function Card({ title, children }: ParentProps<{ title: string }>) {
  return (
    <button
      class="flex justify-between gap-2 bg-neutral rounded-lg p-4 w-full hover:bg-neutral-focus transition-colors
        cursor-pointer items-center mt-4"
    > {/* TODO */}
      <div>
        <h3 class="text-left font-medium font-title text-lg">{title}</h3>
        <p class="text-sm text-left">{children}</p>
      </div>
      <img src="/icons/chevron-right.svg" alt="Click to go" class="invert select-none w-4"/>
    </button>
  )
}

export default function NewGuildModal() {
  return (
    <ModalTemplate title="New Server">
      <div class="flex flex-col max-w-xl">
        <Card title="Create a server">
          Start a new community. It can be a place for you and your friends, or you can grow it into a large community.
        </Card>
        <Card title="Join a server">
          Enter an invite code to join an existing server.
        </Card>
      </div>
    </ModalTemplate>
  )
}
