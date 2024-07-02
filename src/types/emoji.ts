export interface EmojiData {
  emoji: string
  description: string
  category: string
  aliases: string[]
  tags?: string[] | null
  unicode_version: string
  ios_version: string
  skin_tones?: boolean | null
}

/**
 * Represents a custom emoji.
 */
export interface CustomEmoji {
  /**
   * The ID of the emoji.
   */
  id: bigint
  /**
   * The ID of the guild the emoji is in.
   */
  guild_id: bigint
  /**
   * The name of the emoji.
   */
  name: string
  /**
   * The ID of the user that created the emoji. This is `null` if the user has been deleted.
   */
  created_by: bigint | null
}

/**
 * Represents partial information about a custom emoji or a unicode emoji.
 */
export interface PartialEmoji {
  /**
   * The ID of the custom emoji. This is `null` if the emoji is a unicode emoji.
   */
  id: bigint | null
  /**
   * The name of the custom emoji, or the emoji itself if this is a unicode emoji.
   */
  name: string
}

/**
 * Represents a reaction on a message.
 */
export interface Reaction {
  /**
   * The ID of the message the reaction is on.
   */
  message_id: bigint
  /**
   * The emoji this reaction represents.
   */
  emoji: PartialEmoji
  /**
   * A list of user IDs that have reacted with this emoji.
   */
  user_ids: bigint[]
  /**
   * A list of timestamps representing when the users reacted with this emoji. The index of the
   * timestamp corresponds to the index of the user ID in `user_ids`.
   *
   * This is **only** provided when explicitly fetching reactions for a message. Otherwise, this
   * is `null`.
   */
  created_at: string[] | null
}
