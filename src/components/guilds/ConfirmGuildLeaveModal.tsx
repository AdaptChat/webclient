import {ModalTemplate} from "../ui/Modal";
import {createSignal, Setter, Show} from "solid-js";
import {Guild} from "../../types/guild";
import {useNavigate} from "@solidjs/router";
import {getApi} from "../../api/Api";
import RightFromBracket from "../icons/svg/RightFromBracket";
import Icon from "../icons/Icon";

export interface Props {
  guild: Guild,
  setConfirmGuildLeaveModal: Setter<boolean>,
}

export default function ConfirmGuildLeaveModal(props: Props) {
  const [confirmGuildLeaveModalError, setConfirmGuildLeaveModalError] = createSignal<string>()

  const api = getApi()!
  const navigate = useNavigate()

  return (
    <ModalTemplate title="Leave Server">
      <p class="text-fg/80 mt-4 text-center">
        Are you sure you want to leave <b>{props.guild.name}</b>? You will be unable to rejoin unless you are re-invited.
      </p>
      <Show when={confirmGuildLeaveModalError()} keyed={false}>
        <p class="text-danger mt-2">{confirmGuildLeaveModalError()}</p>
      </Show>
      <div class="flex justify-end mt-4 gap-x-4">
        <button class="btn border-none btn-ghost" onClick={() => props.setConfirmGuildLeaveModal(false)}>
          Cancel
        </button>
        <button
          class="btn btn-danger border-none"
          onClick={async (event) => {
            const currentTarget = event.currentTarget
            currentTarget.disabled = true

            const response = await api.request('DELETE', `/guilds/${props.guild.id}/members/me`)
            if (!response.ok) {
              currentTarget.disabled = false
              setConfirmGuildLeaveModalError(response.errorJsonOrThrow().message)
              return
            }

            props.setConfirmGuildLeaveModal(false)
            navigate('/')
          }}
        >
          <Icon icon={RightFromBracket} class="fill-fg w-4 h-4 mr-2" />
          Leave
        </button>
      </div>
    </ModalTemplate>
  )
}