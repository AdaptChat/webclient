import {createMemo, createSignal, For, JSX, Match, onCleanup, onMount, Show, Suspense, Switch} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import {type MessageGroup} from "../../api/MessageGrouper";
import {humanizeFullTimestamp, humanizeTime, humanizeTimestamp, snowflakes, uuid} from "../../utils";
import TypingKeepAlive from "../../api/TypingKeepAlive";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import Icon from "../icons/Icon";
import PaperPlaneTop from "../icons/svg/PaperPlaneTop";
import {DynamicMarkdown} from "./Markdown";
import {DmChannel} from "../../types/channel";
import Fuse from "fuse.js";
import {User} from "../../types/user";
import Plus from "../icons/svg/Plus";

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
      <DynamicMarkdown content={message().content!} />
      {/* Attachments */}
      <For each={message().attachments}>
        {(attachment) => (
          <div classList={{
            "mt-1 inline-block box-border rounded-lg overflow-hidden max-h-96 cursor-pointer": true,
            "opacity-50": message()._nonceState === 'pending',
            "opacity-30": message()._nonceState === 'error',
          }}>
            {shouldDisplayImage(attachment.filename) ? (
              <img
                src={attachment._imageOverride ?? CONVEY + `/attachments/compr/${uuid(attachment.id)}/${attachment.filename}`}
                alt={attachment.alt}
                class="max-w-[min(60vw,56rem)] max-h-80 object-contain object-left"
              />
            ) : (
              <p>{attachment.filename}</p>
            )}
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

  const [messageInput, setMessageInput] = createSignal('')
  const [messageInputFocused, setMessageInputFocused] = createSignal(false)
  const [messageInputFocusTimeout, setMessageInputFocusTimeout] = createSignal<number | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [autocompleteState, setAutocompleteState] = createSignal<AutocompleteState | null>(null)
  const [uploadedAttachments, setUploadedAttachments] = createSignal<UploadedAttachment[]>([])

  const sendable = () => !!messageInputRef?.innerText?.trim() || uploadedAttachments().length > 0
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

    setMessageInput('')
    setUploadedAttachments([])
    messageInputRef!.innerHTML = ''
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

  const updateAutocompleteState = () => {
    const [currentWord, index] = getWordAt(messageInputRef?.innerText!, getCaretPosition(messageInputRef!) - 1)
    if (currentWord.startsWith('@')) {
      setAutocompleteState({
        type: AutocompleteType.UserMention,
        value: currentWord.slice(1),
        selected: 0,
        data: { index },
      })
    } else {
      setAutocompleteState(null)
    }
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

  const setAutocompleteSelection = (index: number) => {
    setAutocompleteState(prev => ({
      ...prev!,
      selected: trueModulo(index, autocompleteResult()?.length || 1),
    }))
  }
  const autocompleteResult = createMemo(() => {
    const state = autocompleteState()
    if (!state) return

    const { type, value } = state
    switch (type) {
      case AutocompleteType.UserMention:
        return value
          ? fuseMemberIndex()?.search(value).slice(0, 5).map(result => result.item)
          : members().slice(0, 5)
    }
  })
  const executeAutocomplete = (index?: number) => {
    const result = autocompleteResult()
    if (!result) return

    const { type, value, selected } = autocompleteState()!
    switch (type) {
      case AutocompleteType.UserMention: {
        const user = result[index ?? selected]
        const { index: wordIndex } = autocompleteState()!.data!

        const text = messageInputRef!.innerText!
        const before = text.slice(0, wordIndex) + `<@${user.id}>`
        const after = text.slice(wordIndex + value.length + 1)
        messageInputRef!.innerText = before + after

        setAutocompleteState(null)
        messageInputRef!.focus()
        setSelectionRange(messageInputRef!, before.length)
        break
      }
    }
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
      <div class="relative flex items-center bg-gray-800 w-full px-4">
        <Switch>
          <Match when={!autocompleteResult()?.length} keyed={false}>
            {null}
          </Match>
          <Match when={autocompleteState()?.type === AutocompleteType.UserMention} keyed={false}>
            <div class="absolute inset-x-4 bottom-10 rounded-lg bg-gray-900 p-2 flex flex-col">
              <For each={autocompleteResult()}>
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
                    <div class="ml-2 text-sm">
                      <span>{user.username}</span>
                      <span class="text-base-content/60 text-sm">
                        #{user.discriminator.toString().padStart(4, '0')}
                      </span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
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
            })
            input.click()
          }}
          use:tooltip="Upload"
        >
          <Icon icon={Plus} title="Upload" class="fill-base-content w-[18px] h-[18px]" />
        </button>
        <div classList={{ "w-full bg-gray-700 rounded-lg py-2": true, "w-[calc(100%-3rem)]": mobile }}>
          <Show when={uploadedAttachments().length > 0} keyed={false}>
            <div class="flex flex-wrap gap-x-2 gap-y-1 px-2">
              <For each={uploadedAttachments()}>
                {(attachment, idx) => (
                  <div class="flex flex-col rounded-xl bg-gray-800 w-60 h-48 overflow-hidden box-border">
                    <div class="overflow-hidden w-60 h-40">
                      {attachment.preview ? (
                        <img src={attachment.preview} alt={attachment.filename} class="flex-grow w-60 h-40 object-contain" />
                      ) : (
                        <span class="w-full h-full flex items-center justify-center text-base-content/60 p-2 bg-gray-900 break-words">
                          {attachment.type}
                        </span>
                      )}
                    </div>
                    <div class="break-words flex-grow p-2">
                      <h2 class="font-title font-medium justify-self-center">{attachment.filename}</h2>
                      {attachment.alt && <div>{attachment.alt}</div>}
                    </div>
                  </div>
                )}
              </For>
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
                if (autocompleteState() != null)
                  return executeAutocomplete()

                await createMessage()
              }
            }}
            onMouseUp={updateAutocompleteState}
            onTouchStart={updateAutocompleteState}
            onSelect={updateAutocompleteState}
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
