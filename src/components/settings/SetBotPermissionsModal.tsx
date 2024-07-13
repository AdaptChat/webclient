import {Signal} from "solid-js";
import {ModalTemplate, useModal} from "../ui/Modal";
import PermissionsView from "./PermissionsView";
import {Permissions} from "../../api/Bitflags";

type Props = {
  permissionsSignal: Signal<Permissions>,
}

export function SetRequestedBotPermissionsModal(props: Props & { name: string, allowed: Permissions }) {
  const {hideModal} = useModal()
  return (
    <ModalTemplate title="Grant Permissions">
      <p class="text-fg/70 text-center mt-4 text-sm font-light">
        Choose what permissions you want to grant <b>{props.name}</b>.
      </p>
      <form
        class="flex flex-wrap justify-end mt-4 gap-x-4"
        onSubmit={(event) => {
          event.preventDefault()
          hideModal()
        }}
      >
        <div class="overflow-y-auto max-h-[50vh] px-2">
          <PermissionsView checkbox enabledPermissions={props.allowed} signal={props.permissionsSignal} />
        </div>
        <button type="button" class="btn flex-grow border-none" onClick={() => hideModal()}>
          Done
        </button>
      </form>
    </ModalTemplate>
  )
}

export default function SetBotPermissionsModal(props: Props) {
  const {hideModal} = useModal()
  return (
    <ModalTemplate title="Default Permissions">
      <p class="text-fg/70 text-center mt-4 text-sm font-light">
        Server owners will be asked to grant your bot these permissions when they add it to their server.
        Note that server owners can still selectively grant or deny permissions.
      </p>
      <form
        class="flex flex-wrap justify-end mt-4 gap-x-4"
        onSubmit={(event) => {
          event.preventDefault()
          hideModal()
        }}
      >
        <div class="overflow-y-auto max-h-[50vh] px-2">
          <PermissionsView checkbox enabledPermissions={Permissions.all()} signal={props.permissionsSignal} />
        </div>
        <button type="button" class="btn flex-grow border-none" onClick={() => hideModal()}>
          Done
        </button>
      </form>
    </ModalTemplate>
  )
}