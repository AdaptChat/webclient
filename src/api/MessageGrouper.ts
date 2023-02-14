import type {Message} from "../types/message";
import {createSignal, type Signal} from "solid-js";
import {humanizeDate, isSameDay, snowflakes} from "../utils";
import type Api from "./Api";

/**
 * A divider between messages.
 */
export interface MessageDivider {
  isDivider: true
  /**
   * The content of the divider.
   */
  content: string
}

export type MessageGroup = Message[] & { isDivider?: false } | MessageDivider
/**
 * Difference in snowflakes within 15 minutes.
 */
export const SNOWFLAKE_BOUNDARY: number = 235_929_600_000

/**
 * Groups messages by their author and timestamp.
 */
export default class MessageGrouper {
  private readonly groupsSignal: Signal<MessageGroup[]>
  private currentGroup?: Message[]

  private offset: number = 0
  private fetchLock: boolean = false
  nonced: Set<number>
  noMoreMessages: boolean = false

  constructor(
    private readonly api: Api,
    private readonly channelId: number,
  ) {
    this.groupsSignal = createSignal([])
    this.nonced = new Set()
  }

  /**
   * Pushes a message into the timestamp.
   */
  pushMessage(message: Message) {
    if (this.currentGroup == null) this.finishGroup()
    const behavior = this.nextMessageBehavior({ message })

    if (behavior)
      this.finishGroup(behavior === true ? undefined : behavior)

    this.setGroups(prev => {
      let groups = [...prev]
      groups[groups.length - 1] = this.currentGroup = [...this.currentGroup!, message]
      return groups
    })
  }

  /**
   * Finds the indices of the message with the highest ID but still at most the given message ID.
   */
  findCloseMessageIndex(id: number): [number, number] {
    let groupIndex = this.groups.length - 1
    let messageIndex = 0

    const updateGroupIndex = () => {
      const lastGroup = this.groups[groupIndex]
      messageIndex = lastGroup.isDivider ? 0 : lastGroup.length - 1
    }
    updateGroupIndex()

    while (groupIndex >= 0 && messageIndex >= 0) {
      const group = this.groups[groupIndex]
      if (group.isDivider) {
        groupIndex--
        updateGroupIndex()
        continue
      }

      const message = group[messageIndex]
      if (message.id <= id) break

      if (--messageIndex < 0) {
        if (--groupIndex < 0)
          return [-1, -1]

        updateGroupIndex()
      }
    }
    return [groupIndex, messageIndex]
  }

  /**
   * Inserts messages from the API into the grouper.
   *
   * This assumes that messages are ordered by timestamp, oldest to newest. It also assumes that the messages do not
   * overlap.
   */
  insertMessages(messages: Message[]) {
    if (messages.length === 0) return
    if (this.currentGroup == null) this.finishGroup()

    let [groupIndex, messageIndex] = this.findCloseMessageIndex(messages[0].id)
    let lastMessage: Message

    let groups = this.groups
    if (groupIndex <= 0) {
      let firstMessageGroup = groups[0]
      if (firstMessageGroup.isDivider)
        groups = [firstMessageGroup = [], ...groups]

      lastMessage = (<Message[]> firstMessageGroup)[0]
      groupIndex = 0
    } else {
      lastMessage = (<Message[]> groups[groupIndex])[messageIndex]
    }

    for (const message of messages) {
      const behavior = this.nextMessageBehavior({ lastMessage, message })
      if (behavior) {
        if (behavior !== true) groups.splice(++groupIndex, 0, behavior)
        groups.splice(++groupIndex, 0, [])
        messageIndex = -1
      }

      const target = <Message[]> groups[groupIndex]
      target.splice(++messageIndex, 0, message)
      lastMessage = message
    }

    if (this.groups.at(-1)?.isDivider)
      this.finishGroup()

    this.setGroups(groups)
    this.currentGroup = groups.at(-1) as any
  }

  /**
   * Fetches messages from the API and inserts into the grouper.
   */
  async fetchMessages() {
    if (this.noMoreMessages || this.fetchLock) return

    this.fetchLock = true
    const response = await this.api.request<Message[]>('GET', `/channels/${this.channelId}/messages`, {
      params: { limit: 200, offset: this.offset },
    })
    const messages = response.jsonOrThrow()
    this.offset += messages.length
    if (messages.length < 200) this.noMoreMessages = true

    this.insertMessages(messages.reverse())
    this.fetchLock = false
  }

  private nextMessageBehavior(
    { lastMessage, message }: {
      lastMessage?: Message,
      message: Message,
    }
  ): MessageDivider | boolean {
    lastMessage ??= this.lastMessage
    if (!lastMessage) return false

    let timestamp
    if (!isSameDay(timestamp = snowflakes.timestamp(message.id), snowflakes.timestamp(lastMessage.id)))
      return { isDivider: true, content: humanizeDate(timestamp) }

    return message.author_id !== lastMessage.author_id
      || message.id - lastMessage.id > SNOWFLAKE_BOUNDARY
  }

  private get lastMessage() {
    const group = <Message[]> this.groups.at(-1)
    return group.at(-1)
  }

  get groups() {
    return this.groupsSignal[0]()
  }

  private get setGroups() {
    return this.groupsSignal[1]
  }

  get nonceDefault(): Partial<Message> {
    return {
      channel_id: this.channelId,
      embeds: [],
      attachments: [],
      flags: 0,
      stars: 0,
    }
  }

  /**
   * Acks the nonce of a message.
   */
  ackNonce(messageId: number) {
    this.nonced.delete(messageId)
    let [groupIndex, messageIndex] = this.findCloseMessageIndex(messageId)

    this.setGroups(prev => {
      let groups = [...prev]
      let group = [...<Message[]> groups[groupIndex]]
      group[messageIndex]._nonceState = 'success'
      groups[groupIndex] = group
      return groups
    })
  }

  private finishGroup(divider?: MessageDivider) {
    this.setGroups(prev => {
      if (divider) prev.push(divider)
      return [...prev, this.currentGroup = []]
    })
  }
}
