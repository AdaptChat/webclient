import {createResource, For} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";

export default function Chat(props: { channelId: number }) {
  const api = getApi()!
  const [messages, setMessages] = api.cache!.useMessageSignal(props.channelId)

  // TODO: only fire if this is the first time creating the messages signal
  createResource(async () => {
    const res = await api.request<Message[]>('GET', `/channels/${props.channelId}/messages`)
    setMessages(res.jsonOrThrow())
  })

  return (
    <div class="flex flex-col w-full h-full">
      <div class="flex flex-col w-full h-full items-end">
        <For each={messages()}>
          {(message: Message) => (
            <div>
              {message.content}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
