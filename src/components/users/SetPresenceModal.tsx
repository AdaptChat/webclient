import {createEffect, createMemo, createSignal, Setter} from "solid-js";
import {getApi} from "../../api/Api";
import {ModalTemplate, useModal} from "../ui/Modal";
import {UpdatePresencePayload} from "../../types/ws";

export default function SetPresence() {
  const api = getApi()!
  const presence = createMemo(() => api.cache?.presences.get(api.cache!.clientId!))
  const {hideModal} = useModal()

  const [updatePayload, setUpdatePayload] = createSignal<UpdatePresencePayload>({ status: 'online' })
  createEffect(() => {
    if (presence()) {
      setUpdatePayload({ status: presence()?.status ?? 'offline', custom_status: presence()?.custom_status })
    }
  })

  return (
    <ModalTemplate title="Custom Status">
      <p class="text-fg/70 text-center font-light text-sm mt-2 md:min-w-[300px]">
        Set a custom status for your account.
      </p>
      <form class="flex flex-col">
        <label for="custom-status" class="text-fg/70 text-sm font-bold uppercase mt-4 mx-1">Custom Status</label>
        <input
          id="custom-status"
          type="text"
          class="mt-1 input"
          placeholder="So sleepy..."
          maxLength={256}
          value={updatePayload().custom_status}
          onInput={(e) => setUpdatePayload(old => ({ ...old, custom_status: e.currentTarget.value }))}
        />
        <button
          type="submit"
          class="btn btn-primary mt-2"
          onClick={async (e) => {
            e.preventDefault()
            api.ws?.updatePresence(updatePayload())
            hideModal()
          }}
        >
          Save
        </button>
      </form>
    </ModalTemplate>
  )
}
