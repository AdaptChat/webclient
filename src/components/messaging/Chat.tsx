import {
  Accessor,
  createMemo,
  createSignal,
  For,
  JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch
} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import {type MessageGroup} from "../../api/MessageGrouper";
import {
  displayName,
  filterIterator,
  flatMapIterator,
  humanizeFullTimestamp,
  humanizeSize,
  humanizeTime,
  humanizeTimestamp,
  snowflakes,
  uuid
} from "../../utils";
import TypingKeepAlive from "../../api/TypingKeepAlive";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import Icon from "../icons/Icon";
import PaperPlaneTop from "../icons/svg/PaperPlaneTop";
import {DynamicMarkdown} from "./Markdown";
import type {DmChannel, GuildChannel} from "../../types/channel";
import Fuse from "fuse.js";
import {User} from "../../types/user";
import Plus from "../icons/svg/Plus";
import Hashtag from "../icons/svg/Hashtag";
import Trash from "../icons/svg/Trash";

noop(tooltip)

const CONVEY = 'https://convey.adapt.chat'

type SkeletalData = {
  headerWidth: string,
  contentLines: string[],
}
function generateSkeletalData(n: number = 10): SkeletalData[] {
  const data: SkeletalData[] = []
  for (let i = 0; i < n; i++) {
    const headerWidth = `${Math.random() * 25 + 25}%`
    const contentLines = []

    const lines = Math.random() * (
      Math.random() < 0.2 ? 5 : 2
    )
    for (let j = 0; j < lines; j++) {
      contentLines.push(`${Math.random() * 60 + 20}%`)
    }
    data.push({ headerWidth, contentLines })
  }
  return data
}

function getCaretPosition(editableDiv: HTMLDivElement) {
  let caretPos = 0, selection, range

  if (window.getSelection) {
    selection = window.getSelection();
    if (selection?.rangeCount) {
      range = selection.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode == editableDiv) {
        caretPos = range.endOffset;
      }
    }
  }
  // @ts-ignore
  else if (document.selection && document.selection.createRange) {
    // @ts-ignore
    range = document.selection.createRange();
    if (range.parentElement == editableDiv) {
      const tempEl = document.createElement("span");
      editableDiv.insertBefore(tempEl, editableDiv.firstChild);
      const tempRange = range.duplicate();
      tempRange.moveToElementText(tempEl);
      tempRange.setEndPoint("EndToEnd", range);
      caretPos = tempRange.text.length;
    }
  }
  return caretPos;
}

function MessageLoadingSkeleton() {
  const skeletalData = generateSkeletalData()

  return (
    <div class="flex flex-col gap-y-4">
      <For each={skeletalData}>
        {(data: SkeletalData, i) => (
          <div class="flex flex-col animate-pulse" style={{ 'animation-delay': `${i() * 100}ms` }}>
            <div class="flex flex-col relative pl-[62px] py-px hover:bg-gray-850/60 transition-all duration-200">
              <div class="absolute left-3.5 w-9 h-9 mt-0.5 rounded-full bg-gray-400" />
              <div class="h-5 bg-gray-600 rounded-full" style={{ width: data.headerWidth }} />
              {data.contentLines.map((width) => (
                <div class="h-5 bg-gray-700 rounded-full" style={{ width }} />
              ))}
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

function shouldDisplayImage(filename: string): boolean {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].some((ext) => filename.endsWith(ext))
}

export function MessageContent(props: { message: Message, largePadding?: boolean }) {
  const message = () => props.message
  const largePadding = () => props.largePadding

  return (
    <span
      data-message-id={message().id}
      classList={{
        "text-base-content/50": message()._nonceState === 'pending',
        "text-error": message()._nonceState === 'error',
        "break-words text-sm font-light": true,
      }}
      style={{
        width: largePadding()
          ? "calc(100% - 4.875rem)"
          : "calc(100% - 1rem)",
      }}
    >
      <Show when={message().content}>
        <DynamicMarkdown content={message().content!} />
      </Show>
      <For each={message().embeds}>
        {(embed) => (
          <div class="rounded overflow-hidden inline-flex my-1">
            <div class="inline-flex flex-col p-2 bg-gray-900 border-l-accent border-l-4">
              <Show when={embed.title}>
                <h1 class="text-lg font-title font-bold">{embed.title}</h1>
              </Show>
              <Show when={embed.description}>
                <div class="text-base-content/80 text-sm">{embed.description}</div>
              </Show>
            </div>
          </div>
        )}
      </For>
      {/* Attachments */}
      <For each={message().attachments}>
        {(attachment) => (
          <div classList={{
            "mt-1 inline-block box-border rounded-lg overflow-hidden max-h-96 cursor-pointer": true,
            "opacity-50": message()._nonceState === 'pending',
            "opacity-30": message()._nonceState === 'error',
          }}>
            {(() => {
              const url = attachment.id && CONVEY + `/attachments/compr/${uuid(attachment.id)}/${attachment.filename}`
              return shouldDisplayImage(attachment.filename) ? (
                <img
                  src={attachment._imageOverride ?? url}
                  alt={attachment.alt}
                  class="max-w-[min(60vw,56rem)] max-h-80 object-contain object-left"
                />
              ) : (
                <div class="flex justify-between bg-gray-900 w-[min(60vw,24rem)] p-4 rounded-lg">
                  <div>
                    <a
                      class="text-lg font-medium font-title hover:underline"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {attachment.filename}
                    </a>
                    <div class="text-base-content/60 text-sm">{humanizeSize(attachment.size)}</div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </For>
      {/* Error */}
      <Show when={message()._nonceError} keyed={false}>
        <p class="p-2 bg-error-content rounded-lg text-sm font-medium">
          <b>Error: </b>
          {message()._nonceError}
        </p>
      </Show>
    </span>
  )
}

function getWordAt(str: string, pos: number) {
  const left = str.slice(0, pos + 1).search(/\S+$/)
  const right = str.slice(pos).search(/\s/)

  return [right < 0 ? str.slice(left) : str.slice(left, right + pos), left] as const
}

export enum AutocompleteType {
  UserMention,
  ChannelMention,
}

export interface AutocompleteState {
  type: AutocompleteType,
  value: string,
  selected: number,
  data?: any,
}

function trueModulo(n: number, m: number) {
  return ((n % m) + m) % m
}

function setSelectionRange(element: HTMLDivElement, selectionStart: number, selectionEnd: number = selectionStart) {
  const range = document.createRange()
  const selection = window.getSelection()

  range.setStart(element.childNodes[0], selectionStart)
  range.setEnd(element.childNodes[0], selectionEnd)
  range.collapse(true)

  selection?.removeAllRanges()
  selection?.addRange(range)
}

interface UploadedAttachment {
  filename: string
  alt?: string
  file: File
  type: string,
  preview?: string,
}

export default function Chat(props: { channelId: number, guildId?: number, title: string, startMessage: JSX.Element }) {
  const api = getApi()!

  const [messageInputFocused, setMessageInputFocused] = createSignal(false)
  const [messageInputFocusTimeout, setMessageInputFocusTimeout] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [autocompleteState, setAutocompleteState] = createSignal<AutocompleteState | null>(null)
  const [uploadedAttachments, setUploadedAttachments] = createSignal<UploadedAttachment[]>([])
  const [sendable, setSendable] = createSignal(false)

  const updateSendable = () => setSendable(!!messageInputRef?.innerText?.trim() || uploadedAttachments().length > 0)
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
    if (
      document.activeElement == document.body
        && e.key.length == 1
        && charCode >= 32 && charCode <= 126
        && !e.ctrlKey && !e.altKey && !e.metaKey
    ) {
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
    if (!sendable()) return;
    const content = messageInputRef!.innerText!.trim()
    const attachments = uploadedAttachments()

    setUploadedAttachments([])
    setSendable(false)
    // Clear the message input without invalidating undo history
    messageInputRef!.focus()
    document.execCommand('selectAll', false)
    document.execCommand('insertHTML', false, '')

    messageAreaRef!.scrollTo(0, messageAreaRef!.scrollHeight)

    const nonce = snowflakes.fromTimestamp(Date.now()).toString()
    let mockMessage = {
      id: nonce,
      type: 'default',
      content,
      author_id: api.cache!.clientUser!.id,
      attachments: attachments.map(attachment => ({
        _imageOverride: attachment.preview,
        filename: attachment.filename,
        alt: attachment.alt,
        size: attachment.file.size,
      })),
      _nonceState: 'pending',
      ...grouper().nonceDefault,
    } as Message

    const loc = grouper().pushMessage(mockMessage)
    grouper().nonced.set(nonce, loc)

    try {
      const json = { content, nonce }

      let options;
      if (attachments.length > 0) {
        const formData = new FormData()
        formData.append('json', JSON.stringify(json));
        for (const [i, attachment] of Object.entries(attachments)) {
          formData.append('file' + i, attachment.file, attachment.filename)
        }
        options = { multipart: formData }
      } else {
        options = { json }
      }

      const response = await api.request('POST', `/channels/${props.channelId}/messages`, options)
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

  const MAPPING = [
    ['@', AutocompleteType.UserMention],
    ['#', AutocompleteType.ChannelMention],
  ] as const
  const updateAutocompleteState = () => {
    const [currentWord, index] = getWordAt(messageInputRef?.innerText!, getCaretPosition(messageInputRef!) - 1)
    for (const [char, type] of MAPPING) {
      if (currentWord.startsWith(char)) {
        setAutocompleteState({
          type,
          value: currentWord.slice(1),
          selected: 0,
          data: { index },
        })
        return
      }
    }
    setAutocompleteState(null)
  }

  const members = createMemo(() => {
    const cache = api.cache
    if (!cache) return []

    const m = (
      props.guildId
        ? cache.memberReactor.get(props.guildId)?.map(u => cache.users.get(u))
        : (cache.channels.get(props.channelId) as DmChannel | null)?.recipient_ids.map(u => cache.users.get(u))
    ) ?? []
    return m.filter((u): u is User => !!u)
  })
  const fuseMemberIndex = createMemo(() => new Fuse(members()!, {
    keys: ['username'], // TODO: nickname
  }))

  const recipientId = createMemo(() => {
    if (props.guildId) return null
    const ids = (api?.cache?.channels.get(props.channelId) as DmChannel | null)?.recipient_ids as any
    return ids[0] == api?.cache?.clientId ? ids[1] : ids[0]
  })
  const channels = createMemo(() => {
    const cache = api.cache
    if (!cache) return []

    // TODO: filter by permissions
    if (props.guildId) {
      return [...cache.guilds.get(props.guildId)?.channels?.values() ?? []]
    } else {
      const mutuals = filterIterator(
        cache.guilds.values(),
        // performance here is O(n^2), this could be improved
        (guild) => guild.members?.some((member) => member.id == recipientId()) ?? false
      )
      return [...flatMapIterator(
        mutuals,
        (guild) => guild
          .channels
          ?.map(channel => ({...channel, key: `${channel.name}:${guild.name}`}) as unknown as GuildChannel) ?? []
      )]
    }
  })
  const fuseChannelIndex = createMemo(() => new Fuse(channels()!, {
    keys: ['key', 'name'],
  }))

  const setAutocompleteSelection = (index: number) => {
    setAutocompleteState(prev => ({
      ...prev!,
      selected: trueModulo(index, autocompleteResult()?.length || 1),
    }))
  }
  const fuse = function<T>(value: string, index: Accessor<Fuse<T>>, fallback: Accessor<T[]>) {
    return value
      ? index()?.search(value).slice(0, 5).map(result => result.item)
      : fallback().slice(0, 5)
  }
  const autocompleteResult = createMemo(() => {
    const state = autocompleteState()
    if (!state) return

    const { type, value } = state
    switch (type) {
      case AutocompleteType.UserMention: return fuse(value, fuseMemberIndex, members)
      case AutocompleteType.ChannelMention: return fuse(value, fuseChannelIndex, channels)
    }
  })
  const executeAutocomplete = (index?: number) => {
    const result = autocompleteResult()
    if (!result?.length) {
      return void setAutocompleteState(null)
    }

    const { type, value, selected } = autocompleteState()!
    switch (type) {
      case AutocompleteType.UserMention:
      case AutocompleteType.ChannelMention: {
        const target = result[index ?? selected]
        const { index: wordIndex } = autocompleteState()!.data!

        const symbol = MAPPING.find(([_, ty]) => type === ty)![0]
        const text = messageInputRef!.innerText!
        const before = text.slice(0, wordIndex) + `<${symbol}!${target.id}>`
        const after = text.slice(wordIndex + value.length + 1)
        messageInputRef!.innerText = before + after

        messageInputRef!.focus()
        setSelectionRange(messageInputRef!, before.length)
        break
      }
    }
    setAutocompleteState(null)
  }

  return (
    <div class="flex flex-col justify-end w-full h-0 flex-grow">
      <div ref={messageAreaRef!} class="overflow-auto flex flex-col-reverse pb-5" onScroll={async (event) => {
        if (event.target.scrollTop + event.target.scrollHeight <= event.target.clientHeight + 10) {
          await grouper().fetchMessages()
        }
      }}>
        <div class="flex flex-col gap-y-4">
          <Show when={grouper().noMoreMessages() && !loading()} keyed={false}>
            <div class="pl-4 pt-8">
              <h1 class="font-title font-bold text-xl">{props.title}</h1>
              <p class="text-base-content/60 text-sm">{props.startMessage}</p>
            </div>
          </Show>
          <Show when={!loading()} keyed={false} fallback={<MessageLoadingSkeleton />}>
            <For each={grouper().groups}>
              {(group: MessageGroup) => {
                if (group.isDivider) return (
                  <div class="divider text-base-content/50 mx-4 h-0 text-sm">{group.content}</div>
                )

                const firstMessage = group[0]
                if (!firstMessage) return null

                const author = firstMessage
                  && (firstMessage.author ?? (firstMessage.author_id && api.cache!.users.get(firstMessage.author_id)))
                  || grouper().authorDefault

                return (
                  <div class="flex flex-col">
                    <div class="flex flex-col relative pl-[62px] py-px hover:bg-gray-850/60 transition-all duration-200">
                      <img
                        class="absolute left-3.5 w-9 h-9 mt-0.5 rounded-full"
                        src={api.cache!.avatarOf(author.id)}
                        alt=""
                      />
                      <div class="inline text-sm">
                        <span class="font-medium">{displayName(author)}</span>
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
                        </div>
                      )}
                    </For>
                  </div>
                )
              }}
            </For>
          </Show>
        </div>
      </div>
      <div class="ml-11 mr-2 relative">
        <div
          classList={{
            "absolute inset-x-4 bottom-2 rounded-lg bg-gray-900 p-2 flex flex-col": true,
            "hidden": !autocompleteResult()?.length,
          }}
        >
          <Switch>
            <Match when={autocompleteState()?.type === AutocompleteType.UserMention} keyed={false}>
              <For each={autocompleteResult() as User[]}>
                {(user, idx) => (
                  <div
                    classList={{
                      "flex items-center px-1 py-1.5 cursor-pointer transition duration-200 rounded-lg": true,
                      "bg-gray-800": idx() === autocompleteState()?.selected,
                    }}
                    onClick={() => executeAutocomplete(idx())}
                    onMouseOver={() => setAutocompleteSelection(idx())}
                  >
                    <img src={api.cache!.avatarOf(user.id)} class="w-6 h-6 rounded-full" alt="" />
                    <div class="ml-2 text-sm">{user.username}</div>
                  </div>
                )}
              </For>
            </Match>

            {/* TODO lots of boilerplate here */}
            <Match when={autocompleteState()?.type === AutocompleteType.ChannelMention} keyed={false}>
              <For each={autocompleteResult() as GuildChannel[]}>
                {(channel, idx) => (
                  <div
                    classList={{
                      "flex items-center px-1 py-1.5 cursor-pointer transition duration-200 rounded-lg": true,
                      "bg-gray-800": idx() === autocompleteState()?.selected,
                    }}
                    onClick={() => executeAutocomplete(idx())}
                    onMouseOver={() => setAutocompleteSelection(idx())}
                  >
                    <Icon icon={Hashtag} class="w-5 h-5 fill-base-content/60" />
                    <div class="ml-2 text-sm">
                      <span>{channel.name}</span>
                      <Show when={channel.guild_id != props.guildId} keyed={false}>
                      <span class="text-base-content/60 text-sm">
                        &nbsp;in <b>{api?.cache?.guilds?.get(channel.guild_id)?.name}</b>
                      </span>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </Match>
          </Switch>
        </div>
      </div>
      <div class="relative flex items-center bg-gray-800 w-full px-4">
        <button
          class="w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-700 mr-2 transition-all duration-200 hover:bg-accent"
          onClick={() => {
            // Upload attachment
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = '*'
            input.addEventListener('change', async () => {
              const files = input.files
              if (!files) return

              const uploaded = await Promise.all(Array.from(files, async (file) => {
                const attachment: UploadedAttachment = {
                  filename: file.name,
                  type: file.type,
                  file,
                }
                if (file.type.startsWith('image/')) {
                  // show a preview of this image
                  attachment.preview = URL.createObjectURL(file)
                }
                return attachment
              }))
              setUploadedAttachments(prev => [...prev, ...uploaded])
              updateSendable()
            })
            input.click()
            messageInputRef?.focus()
          }}
          use:tooltip="Upload"
        >
          <Icon icon={Plus} title="Upload" class="fill-base-content w-[18px] h-[18px]" />
        </button>
        <div
          classList={{
            "w-full bg-gray-700 rounded-lg py-2 max-h-[40vh] overflow-y-auto": true,
            "w-[calc(100%-5.75rem)]": mobile,
            "w-[calc(100%-2.75rem)]": !mobile,
          }}
        >
          <Show when={uploadedAttachments().length > 0} keyed={false}>
            <div class="flex flex-wrap gap-x-2 gap-y-1 px-2">
              <For each={uploadedAttachments()}>
                {(attachment, idx) => (
                  <div class="flex flex-col rounded-xl bg-gray-800 w-52 h-40 overflow-hidden box-border relative group">
                    <div
                      class="absolute inset-0 flex items-center justify-center gap-x-2 bg-gray-900/70 opacity-0
                        group-hover:opacity-100 transition-all duration-200 group-hover:backdrop-blur-md overflow-hidden
                        box-border rounded-xl"
                    >
                      <button
                        class="rounded-full p-4 bg-transparent hover:bg-error transition-all duration-200"
                        onClick={() => {
                          setUploadedAttachments(prev => prev.filter((_, i) => i !== idx()))
                          updateSendable()
                        }}
                      >
                        <Icon icon={Trash} class="w-5 h-5 fill-base-content" />
                      </button>
                    </div>
                    <div class="overflow-hidden w-52 h-[6.75rem]">
                      {attachment.preview ? (
                        <img src={attachment.preview} alt={attachment.filename} class="w-60 h-[6.75rem] object-contain" />
                      ) : (
                        <span class="w-full h-full flex items-center justify-center text-base-content/60 p-2 bg-gray-900 break-words">
                          {attachment.type || attachment.filename}
                        </span>
                      )}
                    </div>
                    <div class="break-words flex-grow p-2 bg-gray-850">
                      <h2 class="text-sm font-title font-medium justify-self-center">{attachment.filename}</h2>
                      <div class="text-xs text-base-content/60">
                        {humanizeSize(attachment.file.size)} {attachment.alt && <> - {attachment.alt}</>}
                      </div>
                    </div>
                  </div>
                )}
              </For>
              <Show when={uploadedAttachments().length > 1} keyed={false}>
                <div class="self-center justify-self-center text-base-content/60">
                  = {humanizeSize(uploadedAttachments().reduce((acc, cur) => acc + cur.file.size, 0))}
                </div>
              </Show>
            </div>
            <div class="divider m-0 p-0" />
          </Show>
          <div
            ref={messageInputRef!}
            class="mx-2 empty:before:content-[attr(data-placeholder)] text-sm empty:before:text-base-content/50 outline-none break-words"
            contentEditable
            data-placeholder="Send a message..."
            spellcheck={false}
            // Paste listener for attachments
            onPaste={async (event) => {
              event.preventDefault()

              const types = event.clipboardData?.types
              if (types?.includes('Files')) {
                const files = event.clipboardData?.files
                if (!files) return

                const uploaded = await Promise.all(Array.from(files, async (file) => {
                  const attachment: UploadedAttachment = {
                    filename: file.name,
                    type: file.type,
                    file,
                  }
                  if (file.type.startsWith('image/')) {
                    // show a preview of this image
                    attachment.preview = URL.createObjectURL(file)
                  }
                  return attachment
                }))
                setUploadedAttachments(prev => [...prev, ...uploaded])
              }

              if (types?.includes('text/plain')) {
                const text = event.clipboardData?.getData('text/plain')
                if (!text) return

                document.execCommand('insertText', false, text)
              }
              updateSendable()
            }}
            onKeyUp={(event) => {
              const oldState = autocompleteState()
              if (oldState)
                if (event.key === 'ArrowUp') {
                  return setAutocompleteSelection(oldState.selected - 1)
                } else if (event.key === 'ArrowDown') {
                  return setAutocompleteSelection(oldState.selected + 1)
                }

              updateAutocompleteState()
            }}
            onKeyDown={(event) => {
              const oldState = autocompleteState()
              if (oldState && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
                event.preventDefault()
            }}
            onKeyPress={async (event) => {
              if (event.shiftKey)
                return

              if (event.key === 'Enter' && (!mobile || event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                if (autocompleteState() && autocompleteResult()?.length)
                  return executeAutocomplete()

                await createMessage()
              }
            }}
            onMouseUp={updateAutocompleteState}
            onTouchStart={updateAutocompleteState}
            onSelect={updateAutocompleteState}
            onInput={() => {
              const _ = typingKeepAlive.ackTyping()
              updateSendable()
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
              "w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-full bg-gray-700 ml-2 transition-all duration-200"
            ]: true,
            "opacity-50 cursor-not-allowed": !sendable(),
            "hover:bg-accent": sendable(),
            "hidden": !mobile,
          }}
          onClick={async () => {
            // Focus back if it was focused before
            if (messageInputFocused())
              messageInputRef!.focus()

            await createMessage()
          }}
        >
          <Icon icon={PaperPlaneTop} title="Send" class="fill-base-content w-[18px] h-[18px]" />
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
