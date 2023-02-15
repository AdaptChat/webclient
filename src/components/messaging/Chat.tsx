import {createMemo, createSignal, For, Show} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import {type MessageGroup} from "../../api/MessageGrouper";
import {humanizeTime, humanizeTimestamp, snowflakes} from "../../utils";

export function MessageContent({ message }: { message: Message }) {
  return (
    <span
      data-message-id={message.id}
      classList={{
        "text-base-content/50": message._nonceState === 'pending',
        "text-error": message._nonceState === 'error',
        "break-words": true,
      }}
      style={{
        width: "calc(100% - /* base width */ 68px - /* padding */ 8px)",
      }}
    >
      {message.content}
      <Show when={message._nonceError} keyed={false}>
        <span class="flex">
          {message._nonceError}
        </span>
      </Show>
    </span>
  )
}

export default function Chat(props: { channelId: number }) {
  const api = getApi()!

  const [messageInput, setMessageInput] = createSignal('')
  const [messageInputFocused, setMessageInputFocused] = createSignal(false)
  const [messageInputFocusTimeout, setMessageInputFocusTimeout] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(true)

  const mobile = /Android|webOS|iPhone|iP[ao]d|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const grouper = createMemo(() => {
    const { grouper, cached } = api.cache!.useChannelMessages(props.channelId)
    setLoading(!cached)

    if (!cached)
      grouper.fetchMessages().then(() => setLoading(false))
    return grouper
  })

  let messageInputRef: HTMLDivElement | null = null
  let messageAreaRef: HTMLDivElement | null = null
  const createMessage = async () => {
    const content = messageInputRef!.textContent!.trim()
    if (!content) return

    setMessageInput('')
    messageInputRef!.innerHTML = ''
    messageAreaRef!.scrollTo(0, messageAreaRef!.scrollHeight)

    const nonce = snowflakes.fromTimestamp(Date.now()).toString()
    let mockMessage: Message = {
      id: nonce,
      type: 'default',
      content,
      author_id: api.cache!.clientUser!.id,
      nonce,
      _nonceState: 'pending',
      ...grouper().nonceDefault,
    } as any

    const loc = grouper().pushMessage(mockMessage)
    grouper().nonced.set(nonce, loc)

    try {
      const json = { content, nonce }
      await api.request('POST', `/channels/${props.channelId}/messages`, { json })
        .then(res => res.ensureOk().jsonOrThrow())
    } catch (e: any) {
      mockMessage._nonceState = 'error'
      mockMessage._nonceError = e
      throw e
    }
  }

  const fallback = (
    <div>Loading...</div>
  )

  return (
    <div class="flex flex-col justify-end w-full h-0 flex-grow">
      <div ref={messageAreaRef!} class="overflow-auto flex flex-col-reverse pb-6" onScroll={async (event) => {
        if (event.target.scrollTop + event.target.scrollHeight <= event.target.clientHeight + 10) {
          await grouper().fetchMessages()
        }
      }}>
        <div class="flex flex-col gap-y-4">
          <Show when={!loading()} keyed={false} fallback={fallback}>
            <For each={grouper().groups}>
              {(group: MessageGroup) => {
                if (group.isDivider) return (
                  <div class="divider text-base-content/50 mx-4">{group.content}</div>
                )

                const firstMessage = group[0]
                const author = firstMessage && api.cache!.users.get(firstMessage.author_id!)
                return (
                  <Show when={group.length >= 1} keyed={false}>
                    <div class="flex flex-col">
                      <div class="flex flex-col relative pl-[68px] hover:bg-gray-850/60 transition-all duration-200">
                        <img
                          class="absolute left-4 w-10 h-10 mt-1 rounded-full"
                          src={api.cache!.avatarOf(author!.id)}
                          alt=""
                        />
                        <div class="inline">
                          <span class="font-medium">{author!.username}</span>
                          <span class="text-base-content/50 text-sm ml-2">
                            {humanizeTimestamp(snowflakes.timestamp(firstMessage.id))}
                          </span>
                        </div>
                        <MessageContent message={firstMessage} />
                      </div>
                      <For each={group}>
                        {(message: Message, index) => index() > 0 && (
                          <div class="group flex items-center hover:bg-gray-850/60 transition-all duration-200">
                            <span class="w-[68px] invisible text-center group-hover:visible text-xs text-base-content/40">
                              {humanizeTime(snowflakes.timestamp(message.id))}
                            </span>
                            <MessageContent message={message} />
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                )
              }}
            </For>
          </Show>
        </div>
      </div>
      <div class="flex items-center bg-gray-800 w-full p-4 pt-0">
        <div class="flex-grow bg-gray-700 rounded-lg p-2">
          <div
            ref={messageInputRef!}
            class="empty:before:content-[attr(data-placeholder)] empty:before:text-base-content/50 outline-none break-words"
            contentEditable
            data-placeholder="Send a message..."
            spellcheck={false}
            onKeyPress={async (event) => {
              if (event.shiftKey)
                return

              if (event.key === 'Enter' && (!mobile || event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                await createMessage()
              }
            }}
            onInput={event => {
              if (mobile) setMessageInput(event.target.textContent!.trim())
            }}
            onFocus={() => {
              const timeout = messageInputFocusTimeout()
              if (timeout)
                clearTimeout(timeout)

              setMessageInputFocused(true)
            }}
            onBlur={() => setMessageInputFocusTimeout(
              setTimeout(() => setMessageInputFocused(false), 100) as any
            )}
          />
        </div>
        <button
          classList={{
            [
              "w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 ml-2 transition-all duration-200"
            ]: true,
            "opacity-50 cursor-not-allowed": !messageInput(),
            "hover:bg-accent": !!messageInput(),
            "hidden": !mobile,
          }}
          onClick={async () => {
            // Focus back if it was focused before
            if (messageInputFocused())
              messageInputRef!.focus()

            await createMessage()
          }}
        >
          <img src="/icons/paper-plane-top.svg" alt="Send" class="invert" width={18} height={18} />
        </button>
      </div>
    </div>
  )
}
