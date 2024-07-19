import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  Match,
  onCleanup,
  onMount,
  ParentProps,
  Show,
  splitProps,
  Switch
} from "solid-js";
import type {Message} from "../../types/message";
import {getApi} from "../../api/Api";
import MessageGrouper, {authorDefault, type MessageGroup} from "../../api/MessageGrouper";
import {
  displayName,
  extendedColor,
  filterIterator,
  filterMapIterator,
  flatMapIterator,
  humanizeFullTimestamp,
  humanizeSize,
  humanizeTime,
  humanizeTimeDelta,
  humanizeTimestamp,
  mapIterator,
  snowflakes,
  uuid
} from "../../utils";
import TypingKeepAlive from "../../api/TypingKeepAlive";
import tooltip from "../../directives/tooltip";
import Icon, {IconElement} from "../icons/Icon";
import Clipboard from "../icons/svg/Clipboard";
import PaperPlaneTop from "../icons/svg/PaperPlaneTop";
import {DynamicMarkdown} from "./Markdown";
import type {DmChannel, GuildChannel} from "../../types/channel";
import Fuse from "fuse.js";
import {gemoji} from 'gemoji'
import {User} from "../../types/user";
import Plus from "../icons/svg/Plus";
import Hashtag from "../icons/svg/Hashtag";
import Trash from "../icons/svg/Trash";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import {toast} from "solid-toast";
import Code from "../icons/svg/Code";
import {ExtendedColor, Invite} from "../../types/guild";
import GuildIcon from "../guilds/GuildIcon";
import UserPlus from "../icons/svg/UserPlus";
import {joinGuild} from "../../pages/guilds/Invite";
import {useNavigate} from "@solidjs/router";
import BookmarkFilled from "../icons/svg/BookmarkFilled";
import {UserFlags} from "../../api/Bitflags";
import {ReactiveSet} from "@solid-primitives/set";
import PenToSquare from "../icons/svg/PenToSquare";
import {getUnicodeEmojiUrl} from "./Emoji";
import Users from "../icons/svg/Users";
import {ModalId, useModal} from "../ui/Modal";
import EllipsisVertical from "../icons/svg/EllipsisVertical";
import FaceSmile from "../icons/svg/FaceSmile";
import Reply from "../icons/svg/Reply";
void tooltip

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
            <div class="flex flex-col relative pl-[62px] py-px hover:bg-bg-1/60 transition-all duration-200">
              <div class="absolute left-3.5 w-9 h-9 mt-0.5 rounded-full bg-fg/50" />
              <div class="h-5 bg-fg/25 rounded-full" style={{ width: data.headerWidth }} />
              {data.contentLines.map((width) => (
                <div class="h-5 bg-fg/10 rounded-full" style={{ width }} />
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

const INVITE_REGEX = /https:\/\/adapt\.chat\/invite\/([a-zA-Z0-9]+)/g

export type MessageContentProps = {
  message: Message,
  grouper?: MessageGrouper,
  editing?: ReactiveSet<bigint>,
  largePadding?: boolean
}

export function MessageContent(props: MessageContentProps) {
  const message = () => props.message
  const largePadding = () => props.largePadding
  const navigate = useNavigate()

  const api = getApi()!
  const [invites, setInvites] = createSignal<Invite[]>([])
  onMount(() => {
    const codes = new Set(
      mapIterator(message().content?.matchAll(INVITE_REGEX) ?? [], (match) => match[1])
    )
    if (codes.size == 0) return

    let tasks = [...codes].slice(0, 5).map(async (code) => {
      const cached = api.cache!.invites.get(code)
      if (cached) return cached

      const response = await api.request('GET', `/invites/${code}`)
      if (!response.ok) return null

      const invite: Invite = response.jsonOrThrow()
      api.cache!.invites.set(code, invite)
      return invite
    })
    Promise.all(tasks).then((invites) => {
      setInvites(invites.filter((invite): invite is Invite => !!invite))
    })
  })

  let editAreaRef: HTMLDivElement | null = null
  const editMessage = async () => {
    const editedContent = editAreaRef!.innerText.trim()
    if (!editedContent) return

    const msg = {
      ...message(),
      content: editedContent,
      _nonceState: 'pending',
    } satisfies Message;
    props.grouper?.editMessage(msg.id, msg)

    const response = await api.request('PATCH', `/channels/${message().channel_id}/messages/${message().id}`, {
      json: { content: editedContent }
    })
    if (!response.ok) {
      toast.error(`Failed to edit message: ${response.errorJsonOrThrow().message}`)
    }
  }
  createEffect(() => {
    if (props.editing?.has(message().id)) {
      editAreaRef!.innerText = message().content!
      editAreaRef!.focus()
    }
  })

  return (
    <span
      data-message-id={message().id}
      class="break-words text-sm font-light overflow-hidden"
      classList={{
        "text-fg/50": message()._nonceState === 'pending',
        "text-danger": message()._nonceState === 'error',
      }}
      style={{
        width: largePadding()
          ? "calc(100% - 4.875rem)"
          : "calc(100% - 1rem)",
      }}
    >
      <Show when={props.editing?.has(message().id)} fallback={
        <Show when={message().content}>
          <div
            class="break-words"
            classList={{ "[&>*:nth-last-child(2)]:inline-block message-content-root": !!message().edited_at }}
          >
            <DynamicMarkdown content={message().content!} />
            <Show when={message().edited_at}>
              <span
                class="ml-1 inline-block text-xs text-fg/40"
                use:tooltip={`Edited ${humanizeTimeDelta(Date.now() - Date.parse(message().edited_at!))} ago`}>
                (edited)
              </span>
            </Show>
          </div>
        </Show>
      }>
        <div
          ref={editAreaRef!}
          contentEditable={true}
          class="break-words text-sm font-light overflow-auto rounded-lg bg-bg-3/50 p-2 my-0.5
            empty:before:content-[attr(data-placeholder)] empty:before:text-fg/50
            focus:outline-none border-2 focus:border-accent border-transparent transition"
          data-placeholder="Edit this message..."
          onKeyDown={async (e) => {
            if (e.key == 'Enter' && !e.shiftKey || e.key == 'Escape') {
              e.preventDefault()
              props.editing?.delete(message().id)
              if (e.key == 'Enter') await editMessage()
            }
          }}
        />
      </Show>
      <For each={message().embeds}>
        {(embed) => (
          <div class="rounded overflow-hidden inline-flex my-1">
            <div class="inline-flex flex-col p-2.5 border-l-4" style={{
              'background-color': embed.hue != null
                ? `color-mix(in srgb, rgb(var(--c-bg-0)), hsl(${embed.hue * 3.6}, 35%, 50%) 25%)`
                : 'rgb(var(--c-bg-0))',
              'border-left-color': embed.color != null
                ? '#' + embed.color!.toString(16).padStart(6, '0')
                : 'rgb(var(--c-accent))',
            }}>
              <Show when={embed.author}>
                <a
                  classList={{
                    "flex items-center text-fg/70 font-normal": true,
                    "hover:underline underline-offset-2": !!embed.author!.url,
                    "mb-0.5": !!embed.author!.icon_url && !embed.title,
                    "mb-1.5": !embed.title,
                  }}
                  href={embed.author!.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Show when={embed.author!.icon_url}>
                    <img src={embed.author!.icon_url!} alt="" class="mr-1 w-5 h-5 rounded-full" />
                  </Show>
                  <DynamicMarkdown content={embed.author!.name} />
                </a>
              </Show>
              <Show when={embed.title}>
                <a
                  classList={{
                    "text-lg font-medium font-title py-0.5 md:min-w-[128px]": true,
                    "hover:underline underline-offset-2": !!embed.url,
                  }}
                  href={embed.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <DynamicMarkdown content={embed.title!} />
                </a>
              </Show>
              <Show when={embed.description}>
                <div class="text-fg/80 text-sm">
                  <DynamicMarkdown content={embed.description!} />
                </div>
              </Show>
              <Show when={embed.footer}>
                <div class="flex items-center text-fg/50 text-xs mt-1.5">
                  <Show when={embed.footer!.icon_url}>
                    <img src={embed.footer!.icon_url!} alt="" class="mr-1 w-5 h-5 rounded-full" />
                  </Show>
                  <DynamicMarkdown content={embed.footer!.text} />
                </div>
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
                  class="max-w-[clamp(56rem,60vw,90%)] max-h-80 object-contain object-left"
                />
              ) : (
                <div class="flex justify-between bg-0 w-[min(60vw,24rem)] p-4 rounded-lg">
                  <div>
                    <a
                      class="text-lg font-medium font-title hover:underline"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {attachment.filename}
                    </a>
                    <div class="text-fg/60 text-sm">{humanizeSize(attachment.size)}</div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </For>
      {/* Invites */}
      <For each={invites()}>
        {(invite) => (
          <div class="my-1 bg-0 rounded-lg p-4 max-w-[360px] overflow-hidden relative [&_*]:z-[1]">
            <Show when={invite.guild?.banner}>
              <img src={invite.guild?.banner} alt="" class="absolute inset-0 opacity-25" />
            </Show>
            <p class="pb-2 flex items-center justify-center text-xs text-fg/40 font-title">
              <Icon icon={UserPlus} class="w-5 h-5 mr-2 fill-fg/40" />
              <span>You've been invited to join a server!</span>
            </p>
            <div class="flex gap-x-3 items-start">
              <GuildIcon guild={invite!.guild!} pings={0} unread={false} sizeClass="w-16 h-16 text-lg" />
              <div class="flex flex-col flex-grow">
                <h1 class="font-title text-lg font-medium">{invite.guild?.name}</h1>
                <Show when={invite.guild?.description}>
                  <p class="text-fg/50 text-sm">{invite.guild?.description}</p>
                </Show>
                <p class="select-none opacity-50 flex items-center">
                  <Icon icon={Users} class="w-4 h-4 mr-1 fill-fg" />
                  {invite.guild?.member_count?.total} Member{invite.guild?.member_count?.total === 1 ? '' : 's'}
                </p>
                <button class="btn btn-primary btn-sm mt-2" onClick={() => joinGuild(invite.code, navigate)}>
                  <Icon icon={Plus} class="w-4 h-4 mr-1 fill-fg" />
                  Join Server
                </button>
              </div>
            </div>
          </div>
        )}
      </For>
      {/* Error */}
      <Show when={message()._nonceError} keyed={false}>
        <p class="inline-block p-2 bg-danger/20 rounded-lg text-sm font-medium">
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
  Emoji,
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

function MessageContextMenu(
  { message, guildId, editing }: { message: Message, guildId?: bigint, editing?: ReactiveSet<bigint> }
) {
  const api = getApi()!
  const {showModal} = useModal()

  return (
    <ContextMenu>
      <ContextMenuButton
        icon={BookmarkFilled}
        label="Mark Unread"
        onClick={() => api.request('PUT', `/channels/${message.channel_id}/ack/${message.id - BigInt(1)}`)}
      />
      <Show when={message.content}>
        <ContextMenuButton
          icon={Clipboard}
          label="Copy Text"
          onClick={() => toast.promise(
            navigator.clipboard.writeText(message.content!),
            {
              loading: "Copying message text...",
              success: "Copied to your clipboard!",
              error: "Failed to copy message text, try again later.",
            }
          )}
        />
      </Show>
      <ContextMenuButton
        icon={Code}
        label="Copy Message ID"
        onClick={() => navigator.clipboard.writeText(message.id.toString())}
      />
      <Show when={editing != null && message.author_id == api.cache!.clientId}>
        <ContextMenuButton
          icon={PenToSquare}
          label="Edit Message"
          onClick={() => editing!.add(message.id)}
        />
      </Show>
      <Show when={
        message.author_id == api.cache!.clientId
        || (
          guildId && api.cache!.getClientPermissions(guildId, message.channel_id).has('MANAGE_MESSAGES')
        )
      }>
        <DangerContextMenuButton
          icon={Trash}
          label="Delete Message"
          onClick={async (event) => {
            if (!event.shiftKey)
              return showModal(ModalId.DeleteMessage, message)

            const resp = await api.deleteMessage(message.channel_id, message.id)
            if (!resp.ok) {
              toast.error(`Failed to delete message: ${resp.errorJsonOrThrow().message}`)
            }
          }}
        />
      </Show>
    </ContextMenu>
  )
}

interface UploadedAttachment {
  filename: string
  alt?: string
  file: File
  type: string,
  preview?: string,
}

const timestampTooltip = (timestamp: number | Date) => ({
  content: humanizeFullTimestamp(timestamp),
  delay: [1000, null] as [number, null],
  interactive: true
})

export type MessageHeaderProps = {
  mentioned?: boolean,
  onContextMenu?: (e: MouseEvent) => any,
  authorAvatar?: string,
  authorColor?: ExtendedColor | null,
  authorName: string,
  badge?: string,
  timestamp: number | Date,
  class?: string,
  classList?: Record<string, boolean>,
  noHoverEffects?: boolean,
  quickActions?: ReturnType<typeof QuickActions>,
}

export function MessageHeader(props: ParentProps<MessageHeaderProps>) {
  return (
    <div
      class="flex flex-col relative py-px transition-all duration-200 rounded-r-lg group"
      classList={{
        [props.class ?? '']: true,
        "bg-accent/10 hover:bg-accent/20 border-l-2 border-l-accent pl-[60px]": props.mentioned,
        "pl-[62px]": !props.mentioned,
        "hover:bg-bg-1/60": !props.mentioned && !props.noHoverEffects,
        ...(props.classList ?? {}),
      }}
      onContextMenu={props.onContextMenu}
    >
      {props.quickActions}
      <img
        class="absolute left-3.5 w-9 h-9 mt-0.5 rounded-full"
        src={props.authorAvatar}
        alt=""
      />
      <div class="inline text-sm">
        <span
          class="font-medium"
          style={extendedColor.fg(props.authorColor)}
        >
          {props.authorName}
          <Show when={props.badge}>
            <span class="text-xs ml-1.5 rounded px-1 py-[1px] bg-accent text-fg">{props.badge}</span>
          </Show>
        </span>
        <span
          class="timestamp text-fg/50 text-xs ml-2"
          use:tooltip={timestampTooltip(props.timestamp)}
        >
          {humanizeTimestamp(props.timestamp)}
        </span>
      </div>
      {props.children}
    </div>
  )
}

export function MessagePreview(
  props: { message: Message, guildId?: bigint } & Partial<MessageHeaderProps> & MessageContentProps
) {
  const api = getApi()!
  const contextMenu = useContextMenu()!
  const message = () => props.message

  // if no guild id is provided, try resolving one
  const guildId = createMemo(() =>
    props.guildId ?? (api.cache!.channels.get(message().channel_id) as GuildChannel)?.guild_id
  )

  const author = createMemo(() =>
    message().author ?? api.cache!.users.get(message().author_id!) ?? authorDefault()
  )
  const authorColor = guildId()
    ? api.cache!.getMemberColor(guildId(), message().author_id!)
    : undefined

  const [contentProps, rest] = splitProps(props, ['message', 'grouper', 'editing', 'largePadding'])
  const [, headerProps] = splitProps(rest, ['guildId'])

  return (
    <MessageHeader
      mentioned={api.cache?.isMentionedIn(message())}
      onContextMenu={contextMenu.getHandler(
        <MessageContextMenu message={message()} guildId={props.guildId} editing={contentProps.editing} />
      )}
      authorAvatar={api.cache!.avatarOf(message().author_id!)}
      authorColor={authorColor}
      authorName={displayName(author())}
      badge={UserFlags.fromValue(author().flags).has('BOT') ? 'BOT' : undefined}
      timestamp={snowflakes.timestamp(message().id)}
      {...headerProps}
    >
      <MessageContent {...contentProps} />
    </MessageHeader>
  )
}

function QuickActionButton(
  { icon, tooltip: tt, ...props }: { icon: IconElement, tooltip: string } & JSX.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      class="p-2 aspect-square rounded-full hover:bg-fg/10 transition group/action"
      use:tooltip={tt}
      {...props}
    >
      <Icon icon={icon} class="fill-fg/70 w-4 h-4 group-hover/action:fill-accent/100 transition"/>
    </button>
  )
}

function QuickActions(props: { message: Message, offset?: number, guildId?: bigint, grouper: MessageGrouper }) {
  const contextMenu = useContextMenu()
  const permissions = createMemo(() =>
    props.guildId ? getApi()?.cache?.getClientPermissions(props.guildId, props.message.channel_id) : null
  )
  return (
    <div
      class="absolute backdrop-blur right-3 rounded-full bg-bg-0/80 p-0.5 z-[100] hidden group-hover:flex"
      style={{ top: `-${(props.offset ?? 4) * 4}px` }}
    >
      <Show when={!permissions() || permissions()!.has('ADD_REACTIONS')}>
        <QuickActionButton icon={FaceSmile} tooltip="Add Reaction" />
      </Show>
      <Show when={!permissions() || permissions()!.has('SEND_MESSAGES')}>
        <QuickActionButton icon={Reply} tooltip="Reply" />
      </Show>
      <QuickActionButton
        icon={EllipsisVertical}
        tooltip="More"
        onClick={contextMenu?.getHandler(<MessageContextMenu message={props.message} guildId={props.guildId} />)}
      />
    </div>
  )
}

export default function Chat(props: { channelId: bigint, guildId?: bigint, title: string, startMessage: JSX.Element }) {
  const api = getApi()!
  const contextMenu = useContextMenu()!

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

  const typing = createMemo(() => api.cache!.useTyping(props.channelId))
  const typingKeepAlive = new TypingKeepAlive(api, props.channelId)
  const editing = new ReactiveSet<bigint>()

  const focusListener = (e: KeyboardEvent) => {
    const charCode = e.key.charCodeAt(0)
    if (document.activeElement == document.body && (
      e.key.length == 1
        && charCode >= 32 && charCode <= 126
        && !e.ctrlKey && !e.altKey && !e.metaKey
        || (e.ctrlKey || e.metaKey) && e.key == 'v'
    )) {
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

    let mockMessage = {
      id: snowflakes.fromTimestamp(Date.now()),
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

    const nonce = mockMessage.id.toString()
    const loc = grouper().pushMessage(mockMessage)
    grouper().nonced.set(nonce, loc)
    messageAreaRef!.scrollTo(0, messageAreaRef!.scrollHeight)

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
      void typingKeepAlive.stop()
      if (!response.ok)
        grouper().ackNonceError(nonce, mockMessage, response.errorJsonOrThrow().message)
    } catch (e: any) {
      grouper().ackNonceError(nonce, mockMessage, e)
      throw e
    }
  }

  const MAPPING = [
    ['@', AutocompleteType.UserMention],
    ['#', AutocompleteType.ChannelMention],
    [':', AutocompleteType.Emoji],
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
    keys: ['username', 'display_name'], // TODO: nickname
  }))

  const permissions = createMemo(() => props.guildId ? api.cache!.getClientPermissions(props.guildId, props.channelId) : null)
  const canSendMessages = createMemo(() => !permissions() || permissions()!.has('SEND_MESSAGES'))

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

  const externalAllowedFrom = createMemo(() => {
    if (!props.guildId || permissions()?.has('USE_EXTERNAL_EMOJIS'))
      return api.cache?.guildList ?? []

    return [props.guildId]
  })
  const emojis = createMemo(() => {
    const unicode = gemoji.flatMap(
      ({names, emoji, category}) => names.map(name => ({
        name, emoji, url: getUnicodeEmojiUrl(emoji), category
      }))
    );
    const allowed = externalAllowedFrom()
    const custom = filterMapIterator(
      api.cache!.customEmojis.values(),
      (emoji) => allowed.includes(emoji.guild_id) ? {
        name: emoji.name,
        emoji: `<:${emoji.name}:${emoji.id}>`,
        url: `https://convey.adapt.chat/emojis/${emoji.id}`,
        category: api.cache!.guilds.get(emoji.guild_id)?.name ?? 'Custom',
        data: emoji,
      } : null
    )
    return [...unicode, ...custom]
  })
  const fuseEmojiIndex = createMemo(() => new Fuse(emojis(), { keys: ['name'] }))

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
      case AutocompleteType.Emoji: return fuse(value, fuseEmojiIndex, () => [])
    }
  })
  const executeAutocomplete = (index?: number) => {
    const result = autocompleteResult()
    if (!result?.length) {
      return void setAutocompleteState(null)
    }

    const { type, value, selected } = autocompleteState()!
    const replace = (repl: string) => {
      const { index: wordIndex } = autocompleteState()!.data!

      const text = messageInputRef!.innerText!
      const before = text.slice(0, wordIndex) + repl
      const after = text.slice(wordIndex + value.length + 1)
      messageInputRef!.innerText = before + after

      messageInputRef!.focus()
      setSelectionRange(messageInputRef!, before.length)
    }

    switch (type) {
      case AutocompleteType.UserMention:
      case AutocompleteType.ChannelMention: {
        const target = result[index ?? selected] as User | GuildChannel
        const symbol = MAPPING.find(([_, ty]) => type === ty)![0]
        replace(`<${symbol}${target.id}>`)
        break
      }
      case AutocompleteType.Emoji:
        replace((result[index ?? selected] as { emoji: string }).emoji)
        break
    }
    setAutocompleteState(null)
  }

  const StandardAutocompleteEntry = (props: ParentProps<{ idx: number }>) => (
    <div
      classList={{
        "flex items-center px-1 py-1.5 cursor-pointer transition duration-200 rounded-lg": true,
        "bg-2": props.idx === autocompleteState()?.selected,
      }}
      onClick={() => executeAutocomplete(props.idx)}
      onMouseOver={() => setAutocompleteSelection(props.idx)}
    >
      {props.children}
    </div>
  )

  let [lastAckedId, setLastAckedId] = createSignal<bigint | null>(null)

  const ack = async () => {
    const last = api.cache?.lastMessages.get(props.channelId)
    if (!last || lastAckedId() == last?.id) return

    let { id, author_id: authorId } = last as Message
    if (authorId == api.cache?.clientId) return

    setLastAckedId(id)
    await api.request('PUT', `/channels/${props.channelId}/ack/${id}`)
  }

  const contentProps = () => ({ grouper: grouper(), editing })

  return (
    <div class="flex flex-col justify-end w-full h-0 flex-grow">
      <div
        ref={messageAreaRef!}
        class="overflow-auto flex flex-col-reverse pb-5"
        onScroll={async (event) => {
          if (event.target.scrollTop + event.target.scrollHeight <= event.target.clientHeight + 10) {
            await grouper().fetchMessages()
          }
          if (event.target.scrollTop > -5)
            await ack()
        }}
        onClick={ack}
        onFocus={ack}
      >
        <div class="flex flex-col gap-y-4">
          <Show when={grouper().noMoreMessages() && !loading()} keyed={false}>
            <div class="pl-4 pt-8">
              <h1 class="font-title font-bold text-xl">{props.title}</h1>
              <p class="text-fg/60 text-sm">{props.startMessage}</p>
            </div>
          </Show>
          <Show when={!loading()} fallback={<MessageLoadingSkeleton />}>
            <For each={grouper().groups}>
              {(group: MessageGroup) => {
                if (group.isDivider) return (
                  <div class="divider text-fg/50 mx-4 h-0 text-sm">{group.content}</div>
                )

                const firstMessage = group[0]
                if (!firstMessage) return null

                return (
                  <div class="flex flex-col">
                    <MessagePreview
                      message={firstMessage}
                      guildId={props.guildId}
                      quickActions={<QuickActions message={firstMessage} guildId={props.guildId} grouper={grouper()} />}
                      {...contentProps()}
                    />
                    <For each={group.slice(1)}>
                      {(message: Message) => (
                        <div
                          class="relative group flex items-center py-px transition-all duration-200 rounded-r-lg"
                          classList={{
                            [api.cache?.isMentionedIn(message)
                              ? "bg-accent/10 hover:bg-accent/20 border-l-2 border-l-accent"
                              : "hover:bg-bg-1/60"]: true,
                          }}
                          onContextMenu={contextMenu.getHandler(
                            <MessageContextMenu message={message} guildId={props.guildId} editing={editing} />
                          )}
                        >
                          <QuickActions message={message} offset={9} guildId={props.guildId} grouper={grouper()} />
                          <span
                            class="invisible text-center group-hover:visible text-[0.65rem] text-fg/40"
                            classList={{ [api.cache?.isMentionedIn(message) ? 'w-[60px]' : 'w-[62px]']: true }}
                            use:tooltip={timestampTooltip(snowflakes.timestamp(message.id))}
                          >
                            {humanizeTime(snowflakes.timestamp(message.id))}
                          </span>
                          <MessageContent message={message} largePadding {...contentProps()} />
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
            "absolute inset-x-4 bottom-2 rounded-xl bg-0 p-2 flex flex-col z-[110]": true,
            "hidden": !autocompleteResult()?.length,
          }}
        >
          <Switch>
            <Match when={autocompleteState()?.type === AutocompleteType.UserMention}>
              <For each={autocompleteResult() as User[]}>
                {(user, idx) => (
                  <StandardAutocompleteEntry idx={idx()}>
                    <img src={api.cache!.avatarOf(user.id)} class="w-6 h-6 rounded-full" alt="" />
                    <div class="mx-2 flex-grow text-sm flex justify-between">
                      <span>{displayName(user)}</span>
                      <Show when={user.display_name != null}>
                        <span class="text-fg/60">@{user.username}</span>
                      </Show>
                    </div>
                  </StandardAutocompleteEntry>
                )}
              </For>
            </Match>

            <Match when={autocompleteState()?.type === AutocompleteType.ChannelMention}>
              <For each={autocompleteResult() as GuildChannel[]}>
                {(channel, idx) => (
                  <StandardAutocompleteEntry idx={idx()}>
                    <Icon icon={Hashtag} class="w-5 h-5 fill-fg/60" />
                    <div class="ml-2 text-sm">
                      <span>{channel.name}</span>
                      <Show when={channel.guild_id != props.guildId}>
                        <span class="text-fg/60 text-sm">
                          &nbsp;in <b>{api?.cache?.guilds?.get(channel.guild_id)?.name}</b>
                        </span>
                      </Show>
                    </div>
                  </StandardAutocompleteEntry>
                )}
              </For>
            </Match>

            <Match when={autocompleteState()?.type === AutocompleteType.Emoji}>
              <For each={autocompleteResult() as any[]}>
                {(emoji, idx) => (
                  <StandardAutocompleteEntry idx={idx()}>
                    <img class="ml-1" src={emoji.url} alt="" width={20} height={20} />
                    <div class="ml-2 text-sm flex flex-grow justify-between">
                      <span>:{emoji.name}:</span>
                      <span class="text-fg/60 text-sm mx-2">{emoji.category}</span>
                    </div>
                  </StandardAutocompleteEntry>
                )}
              </For>
            </Match>
          </Switch>
        </div>
      </div>
      <Show when={canSendMessages()} fallback={
        <div class="p-4 mx-2 -mb-3 text-fg/60 rounded-xl bg-bg-0/70">
          You do not have permission to send messages in this channel.
        </div>
      }>
        <div class="relative flex items-center w-full px-4">
          <button
            class="w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-full bg-3 mr-2 transition-all duration-200 hover:bg-accent"
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
            <Icon icon={Plus} title="Upload" class="fill-fg w-[18px] h-[18px]" />
          </button>
          <div
            classList={{
              "w-full bg-3 rounded-lg py-2 max-h-[40vh] overflow-y-auto": true,
              "w-[calc(100%-5.75rem)]": mobile,
              "w-[calc(100%-2.75rem)]": !mobile,
            }}
          >
            <Show when={uploadedAttachments().length > 0} keyed={false}>
              <div class="flex flex-wrap gap-x-2 gap-y-1 px-2">
                <For each={uploadedAttachments()}>
                  {(attachment, idx) => (
                    <div class="flex flex-col rounded-xl bg-2 w-52 h-40 overflow-hidden box-border relative group">
                      <div
                        class="absolute inset-0 flex items-center justify-center gap-x-2 bg-bg-0/70 opacity-0
                          group-hover:opacity-100 transition-all duration-200 group-hover:backdrop-blur-md overflow-hidden
                          box-border rounded-xl"
                      >
                        <button
                          class="rounded-full p-4 bg-transparent hover:bg-danger transition-all duration-200"
                          onClick={() => {
                            setUploadedAttachments(prev => prev.filter((_, i) => i !== idx()))
                            updateSendable()
                          }}
                        >
                          <Icon icon={Trash} class="w-5 h-5 fill-fg" />
                        </button>
                      </div>
                      <div class="overflow-hidden w-52 h-[6.75rem]">
                        {attachment.preview ? (
                          <img src={attachment.preview} alt={attachment.filename} class="w-60 h-[6.75rem] object-contain" />
                        ) : (
                          <span class="w-full h-full flex items-center justify-center text-fg/60 p-2 bg-0 break-words">
                            {attachment.type || attachment.filename}
                          </span>
                        )}
                      </div>
                      <div class="break-words flex-grow p-2 bg-1">
                        <h2 class="text-sm font-title font-medium justify-self-center">{attachment.filename}</h2>
                        <div class="text-xs text-fg/60">
                          {humanizeSize(attachment.file.size)} {attachment.alt && <> - {attachment.alt}</>}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
                <Show when={uploadedAttachments().length > 1} keyed={false}>
                  <div class="self-center justify-self-center text-fg/60">
                    = {humanizeSize(uploadedAttachments().reduce((acc, cur) => acc + cur.file.size, 0))}
                  </div>
                </Show>
              </div>
              <div class="divider m-0 p-0" />
            </Show>
            <div
              ref={messageInputRef!}
              class="mx-2 empty:before:content-[attr(data-placeholder)] text-sm empty:before:text-fg/50 outline-none break-words"
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

                else if (event.key === 'ArrowUp' && !event.currentTarget.innerText.trim()) {
                  event.preventDefault()
                  const lastMessage = grouper().lastMessage
                  if (lastMessage && lastMessage.author_id == api.cache?.clientId)
                    editing.add(lastMessage.id)
                }
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
                void typingKeepAlive.ackTyping()
                updateSendable()
              }}
              onFocus={() => {
                const timeout = messageInputFocusTimeout()
                if (timeout)
                  clearTimeout(timeout)

                setMessageInputFocused(true)
                void ack()
              }}
              onBlur={() => setMessageInputFocusTimeout(
                setTimeout(() => setMessageInputFocused(false), 100) as any
              )}
            />
          </div>
          <button
            classList={{
              [
                "w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-full bg-3 ml-2 transition-all duration-200"
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
            <Icon icon={PaperPlaneTop} title="Send" class="fill-fg w-[18px] h-[18px]" />
          </button>
        </div>
      </Show>
      <div class="mx-4 h-5 text-xs flex-shrink-0">
        <Show when={typing().users.size > 0}>
          <For each={[...typing().users].map(id => api.cache?.users.get(id)?.username).filter((u): u is string => !!u)}>
            {(username, index) => (
              <>
                <span class="font-bold">{username}</span>
                {index() < typing().users.size - 1 && typing().users.size > 2 && (
                  <span class="text-fg/50">, </span>
                )}
                {index() === typing().users.size - 2 && (
                  <span class="text-fg/50"> and </span>
                )}
              </>
            )}
          </For>
          <span class="text-fg/50 font-medium"> {typing().users.size === 1 ? 'is' : 'are'} typing...</span>
        </Show>
      </div>
    </div>
  )
}
