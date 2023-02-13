import type {Message} from "../types/message";
import {createSignal, Signal} from "solid-js";
import {isSameDay, snowflakes} from "../utils";

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

export type MessageGroup = Signal<Message[]> & { isDivider?: false } | MessageDivider
/**
 * Difference in snowflakes within 15 minutes.
 */
export const SNOWFLAKE_BOUNDARY: number = 235_929_600_000

/**
 * Groups messages by their author and timestamp.
 */
export default class MessageGrouper {
  private readonly groupsSignal: Signal<MessageGroup[]>
  private currentGroupSignal?: Signal<Message[]>

  constructor() {
    this.groupsSignal = createSignal([])
  }

  /**
   * Pushes a message into the timestamp.
   */
  pushMessage(message: Message) {
    if (!this.currentGroup) this.finishGroup()
    const behavior = this.nextMessageBehavior({ message })

    if (behavior)
      this.finishGroup(behavior === true ? undefined : behavior)
    this.setCurrentGroup!(prev => [...prev, message])
  }

  /**
   * Finds the indices of the message with the highest ID but still at most the given message ID.
   */
  findCloseMessageIndex(id: number): [number, number] {
    let groupIndex = this.groups.length - 1
    let messageIndex = 0

    const updateGroupIndex = () => {
      const lastGroup = this.groups[groupIndex]
      messageIndex = lastGroup.isDivider ? 0 : lastGroup[0].length - 1
    }
    updateGroupIndex()

    while (groupIndex >= 0 && messageIndex >= 0) {
      const group = this.groups[groupIndex]
      if (group.isDivider) {
        groupIndex--
        updateGroupIndex()
        continue
      }

      const message = group[0]()[messageIndex]
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
    if (!this.currentGroup) this.finishGroup()

    let [groupIndex, messageIndex] = this.findCloseMessageIndex(messages[0].id)
    let lastMessage: Message

    if (groupIndex === -1) {
      let firstMessageGroup = this.groups[0]
      if (firstMessageGroup.isDivider)
        this.setGroups(prev => [firstMessageGroup = createSignal([]), ...prev])

      lastMessage = (<Signal<Message[]>> firstMessageGroup)[0]()[0]
    } else {
      lastMessage = (<Signal<Message[]>> this.groups[groupIndex])[0]()[messageIndex]
    }

    for (const message of messages) {
      const behavior = this.nextMessageBehavior({ lastMessage, message })
      if (behavior) {
        this.setGroups(prev => {
          prev.splice(++groupIndex, 0, this.currentGroupSignal = createSignal([]))
          if (behavior !== true) prev.splice(++groupIndex, 0, behavior)
          messageIndex = -1
          return prev
        })
      }

      // this part was rushed, may be the cause of bugs
      if (groupIndex >= this.groups.length - 1)
        this.finishGroup()

      const target = (<Signal<Message[]>> this.groups[groupIndex + 1])
      target[1](prev => {
        prev.splice(++messageIndex, 0, message)
        return prev
      })
    }
  }

  private nextMessageBehavior(
    { lastMessage, message }: {
      lastMessage?: Message,
      message: Message,
    }
  ): MessageDivider | boolean {
    lastMessage ??= this.lastMessage
    if (!lastMessage) return false

    if (!isSameDay(snowflakes.timestamp(message.id), snowflakes.timestamp(lastMessage.id)))
      return { isDivider: true, content: 'TODO' } // TODO

    return message.author?.id !== lastMessage.author?.id
      || message.id - lastMessage.id > SNOWFLAKE_BOUNDARY
  }

  private get lastMessage() {
    return this.currentGroup?.[this.currentGroup?.length - 1]
  }

  private get currentGroup() {
    return this.currentGroupSignal?.[0]()
  }

  private get setCurrentGroup() {
    return this.currentGroupSignal?.[1]
  }

  get groups() {
    return this.groupsSignal[0]()
  }

  private get setGroups() {
    return this.groupsSignal[1]
  }

  private finishGroup(divider?: MessageDivider) {
    this.setGroups(prev => {
      if (divider) prev.push(divider)
      return [...prev, this.currentGroupSignal = createSignal([])]
    })
  }
}
