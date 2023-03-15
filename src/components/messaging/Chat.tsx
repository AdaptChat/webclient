import {createMemo, createSignal, For, JSX, onCleanup, onMount, Show} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import {type MessageGroup} from "../../api/MessageGrouper";
import {humanizeFullTimestamp, humanizeTime, humanizeTimestamp, snowflakes} from "../../utils";
import TypingKeepAlive from "../../api/TypingKeepAlive";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
noop(tooltip)

export function MessageContent({ message, largePadding }: { message: Message, largePadding?: boolean }) {
  return (
    <span
      data-message-id={message.id}
      classList={{
        "text-base-content/50": message._nonceState === 'pending',
        "text-error": message._nonceState === 'error',
        "break-words text-sm font-light": true,
      }}
      style={{
        width: largePadding
          ? "calc(100% - 4.875rem)"
          : "calc(100% - 1rem)",
      }}
    >
      {message.content}
      <Show when={message._nonceError} keyed={false}>
        <p class="p-2 bg-error-content rounded-lg text-sm font-medium">
          <b>Error: </b>
          {message._nonceError}
        </p>
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
    const { grouper, cached } = getApi()!.cache!.useChannelMessages(props.channelId)
    setLoading(!cached)

    if (!cached)
      grouper.fetchMessages().then(() => setLoading(false))
    return grouper
  })

  const typing = api.cache!.useTyping(props.channelId)
  const typingKeepAlive = new TypingKeepAlive(api, props.channelId)
  const focusListener = (e: KeyboardEvent) => {
    const charCode = e.key.charCodeAt(0)
    if (e.key.length == 1 && charCode >= 32 && charCode <= 126 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      messageInputRef!.focus()
    }
  }

  onMount(() => {
    document.addEventListener('keydown', focusListener)
  })
  onCleanup(async () => {
    document.removeEventListener('keydown', focusListener)
    await typingKeepAlive.stop()
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
      _nonceState: 'pending',
      ...grouper().nonceDefault,
    } as any

    const loc = grouper().pushMessage(mockMessage)
    grouper().nonced.set(nonce, loc)

    try {
      const json = { content, nonce }
      const response = await api.request('POST', `/channels/${props.channelId}/messages`, { json })

      const ignored = typingKeepAlive.stop()
      if (!response.ok)
        grouper().ackNonceError(nonce, mockMessage, response.errorJsonOrThrow().message)
    } catch (e: any) {
      grouper().ackNonceError(nonce, mockMessage, e)
      throw e
    }
  }

  const timestampTooltip = (messageId: number) => ({
    content: humanizeFullTimestamp(snowflakes.timestamp(messageId)),
    delay: [1000, null] as [number, null],
    interactive: true
  })
  const fallback = (
    <div>Loading...</div>
  )

  return (
    <div class="flex flex-col justify-end w-full h-0 flex-grow">
      <div ref={messageAreaRef!} class="overflow-auto flex flex-col-reverse pb-5" onScroll={async (event) => {
        if (event.target.scrollTop + event.target.scrollHeight <= event.target.clientHeight + 10) {
          await grouper().fetchMessages()
        }
      }}>
        <div class="flex flex-col gap-y-4">
          <Show when={!loading()} keyed={false} fallback={fallback}>
            <For each={grouper().groups}>
              {(group: MessageGroup) => {
                if (group.isDivider) return (
                  <div class="divider text-base-content/50 mx-4 h-0 text-sm">{group.content}</div>
                )

                const firstMessage = group[0]
                const author = firstMessage
                  && (firstMessage.author ?? (firstMessage.author_id && api.cache!.users.get(firstMessage.author_id)))
                  || grouper().authorDefault

                return (
                  <Show when={group.length >= 1} keyed={false}>
                    <div class="flex flex-col">
                      <div class="flex flex-col relative pl-[62px] py-px hover:bg-gray-850/60 transition-all duration-200">
                        <img
                          class="absolute left-3.5 w-9 h-9 mt-0.5 rounded-full"
                          src={api.cache!.avatarOf(author.id)}
                          alt=""
                        />
                        <div class="inline text-sm">
                          <span class="font-medium">{author.username}</span>
                          <span
                            class="text-base-content/50 text-xs ml-2"
                            use:tooltip={timestampTooltip(firstMessage.id)}
                          >
                            {humanizeTimestamp(snowflakes.timestamp(firstMessage.id))}
                          </span>
                        </div>
                        <MessageContent message={firstMessage} />
                      </div>
                      <For each={group.slice(1)}>
                        {(message: Message) => (
                          <div class="relative group flex items-center hover:bg-gray-850/60 py-px transition-all duration-200">
                            <span
                              class="w-[62px] invisible text-center group-hover:visible text-[0.65rem] text-base-content/40"
                              use:tooltip={timestampTooltip(message.id)}
                            >
                              {humanizeTime(snowflakes.timestamp(message.id))}
                            </span>
                            <MessageContent message={message} largePadding />
                            <div>

                            </div>
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
      <div class="flex items-center bg-gray-800 w-full px-4">
        <div classList={{ "w-full bg-gray-700 rounded-lg p-2": true, "w-[calc(100%-3rem)]": mobile }}>
          <div
            ref={messageInputRef!}
            class="empty:before:content-[attr(data-placeholder)] text-sm empty:before:text-base-content/50 outline-none break-words"
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
              const ignored = typingKeepAlive.ackTyping()
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
              "w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-700 ml-2 transition-all duration-200"
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
      <div class="mx-4 h-5 text-xs flex-shrink-0">
        <Show when={typing.users.size > 0} keyed={false}>
          <For each={[...typing.users].map(id => api.cache?.users.get(id)?.username).filter((u): u is string => !!u)}>
            {(username, index) => (
              <>
                <span class="font-bold">{username}</span>
                {index() < typing.users.size - 1 && typing.users.size > 2 && (
                  <span class="text-base-content/50">, </span>
                )}
                {index() === typing.users.size - 2 && (
                  <span class="text-base-content/50"> and </span>
                )}
              </>
            )}
          </For>
          <span class="text-base-content/50 font-medium"> {typing.users.size === 1 ? 'is' : 'are'} typing...</span>
        </Show>
      </div>
    </div>
  )
}
