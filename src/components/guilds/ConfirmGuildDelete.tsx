import {ModalTemplate} from "../ui/Modal";
import {createSignal, Show} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {getApi} from "../../api/Api";
import type {Props} from "./ConfirmGuildLeaveModal"

export default function ConfirmGuildDeleteModal({ guild, setConfirmGuildLeaveModal }: Props) {
  const [confirmGuildLeaveModalError, setConfirmGuildLeaveModalError] = createSignal<string>()
  const [guildNameIsCorrect, setGuildNameIsCorrect] = createSignal<boolean>(false)

  const api = getApi()!
  const navigate = useNavigate()

  let guildNameInput: HTMLInputElement | null = null
  let passwordInput: HTMLInputElement | null = null
  let submitButton: HTMLButtonElement | null = null

  return (
    <ModalTemplate title="Delete Server">
      <p class="text-base-content/80 text-justify text-sm mt-4">
        Are you sure you want to delete <b>{guild.name}</b>? You will not be able to undo this action.
        All data associated with this server will be deleted and you will not be able to recover them in the future.
      </p>
      <form
        class="flex flex-wrap justify-end"
        onSubmit={async (event) => {
          event.preventDefault()
          if (guildNameInput?.value !== guild.name)
            setConfirmGuildLeaveModalError("Guild name does not match")

          submitButton!.disabled = true

          let response
          try {
            response = await api.request('DELETE', `/guilds/${guild.id}`, {
              json: {
                password: passwordInput?.value,
              },
            })
          } finally {
            submitButton!.disabled = false
          }
          if (!response.ok) {
            setConfirmGuildLeaveModalError(response.errorJsonOrThrow().message)
            return
          }

          setConfirmGuildLeaveModal(false)
          navigate('/')
        }}
      >
        <div class="w-full">
          <label
            class="flex flex-col mt-4 pl-1 text-sm font-medium text-base-content/60 "
            for="guild-name"
          >
            Type the name of the server to confirm
          </label>
          <input
            class="input outline-none w-full bg-gray-900 mt-2 focus:outline-none focus:ring-2 focus:ring-accent"
            ref={guildNameInput!}
            id="guild-name"
            name="guild-name"
            type="text"
            autocomplete="off"
            placeholder={guild.name}
            required
            onInput={(event) => {
              setGuildNameIsCorrect(event.currentTarget.value === guild.name)
            }}
          />
        </div>
        <div class="w-full">
          <label
            class="flex flex-col mt-4 pl-1 text-sm font-medium text-base-content/60 w-full"
            for="password"
          >
            Enter your password
          </label>
          <input
            class="input outline-none w-full bg-gray-900 mt-2 focus:outline-none focus:ring-2 focus:ring-accent"
            ref={passwordInput!}
            id="password"
            name="password"
            type="text"
            placeholder="Password"
            minLength={6}
            required
            onKeyUp={(event) => {
              event.currentTarget.type = event.currentTarget.value == null ? 'text' : 'password'
            }}
          />
        </div>
        <Show when={confirmGuildLeaveModalError()} keyed={false}>
          <p class="text-error mt-4 w-full">{confirmGuildLeaveModalError()}</p>
        </Show>
        {/* Use a div to prevent it being treated as the target when pressing enter */}
        <div class="btn border-none bg-none mt-4" onClick={() => setConfirmGuildLeaveModal(false)}>
          Cancel
        </div>
        <button
          ref={submitButton!}
          type="submit"
          class="btn btn-error bg-error/80 border-none hover:bg-error/60 mt-4 ml-4"
          disabled={!guildNameIsCorrect()}
        >
          Delete Server
        </button>
      </form>
    </ModalTemplate>
  )
}