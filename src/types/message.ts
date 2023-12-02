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
  embeds: Embed[]
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
  /**
   * The users and roles that this message mentions.
   */
  mentions: number[];
  /**
   * The last time this message was edited, or `None` if it has not been edited.
   */
  edited_at: string | null;

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

  _imageOverride?: string
}

/**
 * The type of message embed.
 */
export type EmbedType = 'rich' | 'image' | 'video' | 'meta'

/**
 * The author information of a message embed.
 */
export interface EmbedAuthor {
  /**
   * The name of the author.
   */
  name: string
  /**
   * The URL of the author, shown as a hyperlink of the author's name.
   */
  url?: string
  /**
   * The URL of the author's icon.
   */
  icon_url?: string
}

/**
 * The footer information of a message embed.
 */
export interface EmbedFooter {
  /**
   * The text of the footer.
   */
  text: string
  /**
   * The URL of the footer's icon.
   */
  icon_url?: string
}

/**
 * The alignment type of amessage embed field.
 */
export type EmbedFieldAlignment = 'left' | 'center' | 'right' | 'inline'

/**
 * Information about an embed field.
 */
export interface EmbedField {
  name: string
  value: string
  align: EmbedFieldAlignment
}

/**
 * Represents a special card shown in the UI for various purposes, embedding extra information to the user in a more
 * visually appealing way. These are known as embeds and are used in messages.
 */
export interface Embed {
  /**
   * The type of this embed.
   */
  type: EmbedType
  /**
   * The title of this embed.
   */
  title?: string
  /**
   * The description or body text of this embed.
   */
  description?: string
  /**
   * The URL of this embed. This is shown as a hyperlink of the title.
   */
  url?: string
  /**
   * The timestamp of this embed.
   */
  timestamp?: string
  /**
   * The color of this embed, shown as a stripe on the left side of the embed.
   */
  color?: number
  /**
   * The hue of the main body of the background. This is only available for rich embeds.
   * Should be a number between `0` and `100`.
   */
  hue?: number
  /**
   * The author of this embed.
   */
  author?: EmbedAuthor
  /**
   * The footer of this embed.
   */
  footer?: EmbedFooter
  /**
   * The image URL of this embed.
   */
  image?: string
  /**
   * The thumbnail URL of this embed.
   */
  thumbnail?: string
  /**
   * An array fields on this embed.
   */
  fields?: EmbedField[]
}

