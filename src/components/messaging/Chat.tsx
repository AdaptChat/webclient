import {createResource, createSignal, For, onMount, Show} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import {type MessageGroup} from "../../api/MessageGrouper";
import {humanizeTimestamp, snowflakes} from "../../utils";

export default function Chat(props: { channelId: number }) {
  const api = getApi()!
  const { grouper, cached } = api.cache!.useChannelMessages(props.channelId)
  const [loading, setLoading] = createSignal(!cached)

  if (!cached) {
    onMount(async () => {
      const response = await api.request<Message[]>('GET', `/channels/${props.channelId}/messages`, {
        params: { limit: 200 },
      })
      grouper.insertMessages(response.jsonOrThrow().reverse())
      setLoading(false)
    })
  }

  const fallback = (
    <div>Loading...</div>
  )

  return (
    <div class="flex flex-col w-full h-full">
      <div class="flex flex-col w-full h-full px-4 justify-end">
        <Show when={!loading()} keyed={false} fallback={fallback}>
          <For each={grouper.groups}>
            {(group: MessageGroup) => {
              if (group.isDivider) return (
                <div>{/* TODO */}</div>
              )

              const messages = group[0]()
              const firstMessage = messages[0]
              const author = firstMessage && api.cache!.users.get(firstMessage.author_id!)
              return (
                <Show when={messages.length >= 1} keyed={false}>
                  <div class="flex gap-x-2">
                    <img class="w-10 h-10 mt-1 rounded-full" src={api.cache!.avatarOf(author!.id)} alt=""/>
                    <div class="flex flex-col">
                      <div class="flex items-end gap-x-2">
                        <span class="font-medium">{author!.username}</span>
                        <span class="text-base-content/50 text-sm">
                          {humanizeTimestamp(snowflakes.timestamp(firstMessage.id))}
                        </span>
                      </div>
                      <span>{firstMessage.content}</span>
                      <For each={messages}>
                        {(message: Message, index) => index() > 0 && (
                          <span>{message.content}</span>
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
  )
}
