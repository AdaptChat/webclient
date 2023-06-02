import type {Member} from "./guild";
import type {User} from "./user";

/**
 * Represents the type and info of a message.
 */
export type MessageInfo = {
  /**
   * The type of this message.
   */
  type: "default"
} | {
  /**
   * The type of this message.
   */
  type: "join";
  /**
   * The ID of the user who joined.
   */
  user_id: number;
} | {
  /**
   * The type of this message.
   */
  type: "leave";
  /**
   * The ID of the user who left.
   */
  user_id: number;
} | {
  /**
   * The type of this message.
   */
  type: "pin";
  /**
   * The ID of the message that was pinned.
   */
  pinned_message_id: number;
  /**
   * The ID of the user that pinned the message.
   */
  pinned_by: number;
}

/*
 * Represents a text or system message in a channel.
 */
export type Message = MessageInfo & {
  /**
   * The snowflake ID of the message.
   */
  id: number;
  /**
   * The revision ID of the message. This is `None` if this message is the current revision.
   */
  revision_id?: number;
  /**
   * The snowflake ID of the channel this message was sent in.
   */
  channel_id: number;
  /**
   * The snowflake ID of the author of this message, or `None` if this is a system message, or if
   * the user has been deleted.
   */
  author_id?: number;
  /**
   * Resolved data about the user or member that sent this message.
   * This is only present for new messages that are received.
   */
  author?: Member & User | User;
  /**
   * The text content of this message.
   */
  content?: string;
  /**
   * A list of embeds included in this message.
   */
  embeds: any[] // TODO Embed[];
  /**
   * A list of attachments included in this message.
   */
  attachments: Attachment[]
  /**
   * A bitmask of message flags to indicate special properties of the message.
   */
  flags: number;
  /**
   * The amount of stars this message has received.
   */
  stars: number;

  _nonceState?: 'pending' | 'success' | 'error';
  _nonceError?: string;
}

/**
 * Represents a message attachment.
 */
export interface Attachment {
  /**
   * The UUID of the attachment.
   */
  id: string
  /**
   * The filename of the attachment.
   */
  filename: string
  /**
   * The description/alt text of the attachment.
   */
  alt?: string
  /**
   * The size of the attachment, in bytes.
   */
  size: number
}
