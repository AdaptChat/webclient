import {createMemo, createResource, createSignal, For, onMount, Show} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import {type MessageGroup} from "../../api/MessageGrouper";
import {humanizeTimestamp, snowflakes} from "../../utils";

export function MessageContent({ message }: { message: Message }) {
  return (
    <span
      id={`message-${message.id}`}
      classList={{
        "text-base-content/50": message._nonceState === 'pending',
        "text-error": message._nonceState === 'error',
      }}
    >
      {message.content}
    </span>
  )
}

export default function Chat(props: { channelId: number }) {
  const api = getApi()!
  const [loading, setLoading] = createSignal(true)

  const grouper = createMemo(() => {
    const { grouper, cached } = api.cache!.useChannelMessages(props.channelId)
    setLoading(!cached)

    if (!cached)
      grouper.fetchMessages().then(() => setLoading(false))
    return grouper
  })

  const fallback = (
    <div>Loading...</div>
  )

  return (
    <div class="flex flex-col justify-end w-full h-0 flex-grow">
      <div class="overflow-auto flex flex-col-reverse pb-4" onScroll={async (event) => {
        if (event.target.scrollTop + event.target.scrollHeight <= event.target.clientHeight) {
          await grouper().fetchMessages()
        }
      }}>
        <div class="flex flex-col gap-y-4">
          <Show when={!loading()} keyed={false} fallback={fallback}>
            <For each={grouper().groups}>
              {(group: MessageGroup) => {
                if (group.isDivider) return (
                  <div class="divider text-base-content/50">{group.content}</div>
                )

                const firstMessage = group[0]
                const author = firstMessage && api.cache!.users.get(firstMessage.author_id!)
                return (
                  <Show when={group.length >= 1} keyed={false}>
                    <div class="flex gap-x-2">
                      <img class="w-10 h-10 mt-1 rounded-full" src={api.cache!.avatarOf(author!.id)} alt="" />
                      <div class="flex flex-col">
                        <div class="flex items-end gap-x-2">
                          <span class="font-medium">{author!.username}</span>
                          <span class="text-base-content/50 text-sm">
                            {humanizeTimestamp(snowflakes.timestamp(firstMessage.id))}
                          </span>
                        </div>
                        <MessageContent message={firstMessage} />
                        <For each={group}>
                          {(message: Message, index) => index() > 0 && (
                            <MessageContent message={message} />
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                )
              }}
            </For>
          </Show>
        </div>
      </div>
      <div class="bg-gray-800 w-full p-4 pt-0">
        <div class="bg-gray-700 rounded-lg p-2">
          <div
            class="empty:before:content-[attr(data-placeholder)] empty:before:text-base-content/50"
            contentEditable
            data-placeholder="Send a message..."
            spellcheck={false}
            onKeyPress={async (event) => {
              if (event.shiftKey)
                return

              if (event.key === 'Enter') {
                event.preventDefault()
                const content = event.currentTarget.textContent!.trim()
                if (!content) return

                event.currentTarget.innerHTML = ''
                const nonce = Number(snowflakes.fromTimestamp(Date.now()))
                let mockMessage: Message = {
                  id: nonce,
                  type: 'default',
                  content,
                  author_id: api.cache!.clientUser!.id,
                  nonce: nonce.toString(),
                  _nonceState: 'pending',
                  ...grouper().nonceDefault,
                } as any

                grouper().pushMessage(mockMessage)
                grouper().nonced.add(nonce)

                try {
                  const json = { content, nonce: nonce.toString() }
                  await api.request('POST', `/channels/${props.channelId}/messages`, { json })
                    .then(res => res.ensureOk().jsonOrThrow())
                } catch (e: any) {
                  mockMessage._nonceState = 'error'
                  mockMessage._nonceError = e
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
