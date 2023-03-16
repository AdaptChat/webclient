import {ModalTemplate} from "../ui/Modal";
import {createSignal, Setter, Show} from "solid-js";
import {Guild} from "../../types/guild";
import {useNavigate} from "@solidjs/router";
import {getApi} from "../../api/Api";

export interface Props {
  guild: Guild,
  setConfirmGuildLeaveModal: Setter<boolean>,
}

export default function ConfirmGuildLeaveModal({ guild, setConfirmGuildLeaveModal }: Props) {
  const [confirmGuildLeaveModalError, setConfirmGuildLeaveModalError] = createSignal<string>()

  const api = getApi()!
  const navigate = useNavigate()

  return (
    <ModalTemplate title="Leave Server">
      <p class="text-base-content/80 mt-4 text-center">
        Are you sure you want to leave <b>{guild.name}</b>? You will be unable to rejoin unless you are re-invited.
      </p>
      <Show when={confirmGuildLeaveModalError()} keyed={false}>
        <p class="text-error mt-2">{confirmGuildLeaveModalError()}</p>
      </Show>
      <div class="flex justify-end mt-4 gap-x-4">
        <button class="btn border-none bg-none" onClick={() => setConfirmGuildLeaveModal(false)}>
          Cancel
        </button>
        <button
          class="btn btn-error bg-error/80 border-none hover:bg-error/60"
          onClick={async (event) => {
            const currentTarget = event.currentTarget
            currentTarget.disabled = true

            const response = await api.request('DELETE', `/guilds/${guild.id}/members/me`)
            if (!response.ok) {
              currentTarget.disabled = false
              setConfirmGuildLeaveModalError(response.errorJsonOrThrow().message)
              return
            }

            setConfirmGuildLeaveModal(false)
            navigate('/')
          }}
        >
          Leave
        </button>
      </div>
    </ModalTemplate>
  )
}