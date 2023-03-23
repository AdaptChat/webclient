import Modal, {createPaginatedModalSignal, ModalTemplate} from "../ui/Modal";
import {createSignal, type JSX, Match, type ParentProps, Setter, Show, Signal, Switch} from "solid-js";
import {getApi} from "../../api/Api";
import type {Guild, Member} from "../../types/guild";
import {useNavigate} from "@solidjs/router";
import {type UpdateGuildOptions} from "../../api/ApiCache";
import {snowflakes} from "../../utils";
import {GuildCreateEvent} from "../../types/ws";
import Icon from "../icons/Icon";
import ChevronRight from "../icons/svg/ChevronRight";
import ChevronLeft from "../icons/svg/ChevronLeft";

export enum ModalPage { New, Create, Join }

interface Props {
  setPage: Setter<ModalPage>
  setShowModal: Setter<boolean>
}

function Card({ title, children, ...props }: ParentProps<{ title: string }> & JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      class="flex justify-between gap-2 border-2 border-gray-700 rounded-lg p-4 w-full hover:bg-gray-900
        transition-colors cursor-pointer items-center mt-4"
      {...props}
    > {/* TODO */}
      <div>
        <h3 class="text-left font-medium font-title text-lg">{title}</h3>
        <p class="text-sm text-left">{children}</p>
      </div>
      <Icon icon={ChevronRight} title="Click to go" class="fill-base-content select-none w-4 h-4"/>
    </button>
  )
}

interface ExtendedProps extends Props {
  title: string,
  placeholder: string,
  onSubmit: (name: string, nonce: string, acker: (guildId: number) => void) => Promise<string | void>,
  buttonLabel: string,
  minLength: number,
  maxLength: number,
  updateOptions: UpdateGuildOptions,
}

function Base(props: ParentProps<ExtendedProps>) {
  const api = getApi()!
  const navigate = useNavigate()

  const [error, setError] = createSignal<string>()
  let input: HTMLInputElement | null = null
  let submit: HTMLButtonElement | null = null

  return (
    <ModalTemplate title={props.title}>
      {props.children}
      <form
        class="flex flex-wrap gap-4"
        onSubmit={async (event) => {
          event.preventDefault()

          const name = input!.value
          submit!.disabled = true

          let acked = false
          let ack = (guildId: number) => {
            acked = true
            props.setShowModal(false)
            navigate(`/guilds/${guildId}`)
          }

          const nonce = snowflakes.fromTimestamp(Date.now())
          api.ws?.on("guild_create", (event: GuildCreateEvent, remove) => {
            if (acked)
              return remove()
            if (!event.nonce || event.nonce != nonce.toString())
              return

            ack(event.guild.id)
            remove()
          })

          const error = await props.onSubmit(name, nonce.toString(), ack)
          if (error) {
            submit!.disabled = false
            setError(error)
          }
        }}
      >
        <input
          ref={input!}
          name="name"
          type="text"
          class="w-full bg-gray-900 rounded-lg p-2 mt-4"
          placeholder={props.placeholder}
          minLength={props.minLength}
          maxLength={props.maxLength}
          required
        />
        <Show when={error()} keyed={false}>
          <div class="w-full text-error rounded-lg p-1">
            {error()}
          </div>
        </Show>
        {/* If a button component was used, some browsers will not recognize the button after it. */}
        <div class="flex gap-x-2 btn btn-neutral" onClick={() => props.setPage(ModalPage.New)}>
          <Icon icon={ChevronLeft} class="fill-base-content select-none w-[10px] h-[10px] opacity-60" />
          Back
        </div>
        <button
          ref={submit!}
          type="submit"
          class="btn btn-primary flex-grow disabled:bg-accent/50 disabled:text-opacity-50"
        >
          {props.buttonLabel}
        </button>
      </form>
    </ModalTemplate>
  )
}

function NewGuild(props: Props) {
  return (
    <ModalTemplate title="New Server">
      <div class="flex flex-col">
        <Card title="Create a server" onClick={() => props.setPage(ModalPage.Create)}>
          Start a new community. It can be a place for you and your friends, or you can grow it into a large community.
        </Card>
        <Card title="Join a server" onClick={() => props.setPage(ModalPage.Join)}>
          Enter an invite code to join an existing server.
        </Card>
      </div>
    </ModalTemplate>
  )
}

function NewGuildModal(
  { pageSignal, showSignal }: { pageSignal: Signal<ModalPage>, showSignal: Signal<boolean> }
) {
  const [page, setPage] = pageSignal
  const [showNewServerModal, setShowNewServerModal] = showSignal
  const props = { setPage, setShowModal: setShowNewServerModal }
  const api = getApi()!

  return (
    <Modal get={showNewServerModal} set={setShowNewServerModal}>
      <Switch>
        <Match when={page() == ModalPage.New} keyed={false}>
          <NewGuild {...props} />
        </Match>
        <Match when={page() == ModalPage.Create} keyed={false}>
          <Base
            {...props}
            title="Create a Server"
            placeholder={`${api.cache!.clientUser?.username}'s server`}
            onSubmit={async (name, nonce) => {
              const response = await api.request<Guild>('POST', '/guilds', { json: { name, nonce } })
              if (!response.ok)
                return response.errorJsonOrThrow().message
            }}
            buttonLabel="Create Server"
            minLength={2}
            maxLength={50}
            updateOptions={{ updateChannels: true }}
          >
            <p class="text-base-content/70 text-center mt-2 mx-2">
              Before we create your server, let's give it a name. You can always change this later.
            </p>
          </Base>
        </Match>
        <Match when={page() == ModalPage.Join} keyed={false}>
          <Base
            {...props}
            title="Join a Server"
            placeholder="Enter an invite code..."
            onSubmit={async (code, nonce, acker) => {
              const matches = code.match(/(?:(?:https?:\/\/(?:www\.)?)?adapt\.chat\/invite\/)?(\w{6,12})\/?/) ?? code
              if (!matches || matches.length < 1)
                return "That doesn't look like a valid invite code."

              const response = await api.request<Member>('POST', `/invites/${matches[1]}`, { params: { nonce } })
              if (!response.ok)
                return response.errorJsonOrThrow().message

              const { guild_id } = response.ensureOk().jsonOrThrow()
              if (api.cache?.guildList?.includes(guild_id))
                acker(guild_id)
            }}
            buttonLabel="Join Server"
            minLength={6}
            maxLength={38}
            updateOptions={{ updateChannels: true, updateUsers: true }}
          >
            <div class="mt-2 mx-2 text-base-content/70">
              <span class="block text-center">Enter an invite code to join an existing server.</span>
              <h2 class="font-bold mt-2 text-sm">Examples of valid invite codes:</h2>
              <ul class="text-sm list-disc pl-4">
                <li>https://adapt.chat/invite/Dv6a7c2t</li>
                <li>adapt.chat/invite/Dv6a7c2t</li>
                <li>Dv6a7c2t</li>
              </ul>
            </div>
          </Base>
        </Match>
      </Switch>
    </Modal>
  )
}

export default function useNewGuildModalComponent() {
  const [page, setPage] = createSignal(ModalPage.New)
  const [show, setShow] = createPaginatedModalSignal(setPage, ModalPage.New)

  return {
    NewGuildModal: () => <NewGuildModal pageSignal={[page, setPage]} showSignal={[show, setShow]} />,
    page, setPage, show, setShow,
  }
}
