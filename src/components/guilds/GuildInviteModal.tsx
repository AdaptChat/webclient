import type {Guild} from "../../types/guild";
import {getApi} from "../../api/Api";
import {Accessor, createEffect, createSignal} from "solid-js";
import {ModalTemplate} from "../ui/Modal";

export default function GuildInviteModal({ guild, show }: { guild: Guild, show: Accessor<boolean> }) {
  let inputRef: HTMLInputElement | null = null

  const api = getApi()!
  const [code, setCode] = createSignal<string>()
  const [copied, setCopied] = createSignal(false)

  createEffect(async () => {
    if (!show())
      return

    const code = api.cache!.inviteCodes.get(guild.id)
    if (code) {
      setCode(code)
      return
    }

    const response = await api.request('POST', `/guilds/${guild.id}/invites`, {
      json: {},
    })
    const { code: inviteCode } = response.ensureOk().jsonOrThrow()

    api.cache!.inviteCodes.set(guild.id, inviteCode)
    setCode(inviteCode)
  })

  return (
    <ModalTemplate title="Invite People">
      <p class="text-base-content/70 text-center mt-2">
        Invite people to join <b>{guild.name}</b> by sending them this link:
      </p>
      <div class="flex items-center justify-between bg-gray-900 mt-4 rounded-lg box-border overflow-hidden">
        <input
          ref={inputRef!}
          type="text"
          class="bg-transparent p-2 text-base-content flex-grow"
          value={code() ? `https://adapt.chat/invite/${code()}` : 'Loading...'}
          readonly
        />
        <button
          classList={{
            "flex items-center justify-center transition-all duration-200 p-2 w-10 h-10": true,
            "bg-gray-700 hover:bg-accent": !copied(),
            "bg-success": copied(),
          }}
          onClick={async () => {
            await navigator.clipboard.writeText(inputRef!.value)

            setCopied(true)
            setTimeout(() => setCopied(false), 1000)
          }}
        >
          <img
            src={copied() ? "/icons/check.svg" : "/icons/clipboard.svg"}
            alt="Copy to clipboard"
            class="w-4 h-4 invert"
            width={20}
          />
        </button>
      </div>
    </ModalTemplate>
  )
}
