/**
 * Represents the type along with type-specific information of a guild channel.
 */
export type GuildChannelInfo = {
  /**
   * The type of the channel.
   */
  type: 'text' | 'announcement',
  /**
   * The topic of the channel, if any.
   */
  topic?: string,
  /**
   * Whether the channel is NSFW.
   */
  nsfw: boolean,
  /**
   * Whether the channel is locked. Only people with the `MANAGE_CHANNELS` permission can
   * send messages in locked channels.
   */
  locked: boolean,
  /**
   * The slowmode delay of the channel, in **milliseconds**. This should be a value between
   * `0` and `86_400_000` (24 hours). `0` indicates the absence of slowmode.
   */
  slowmode: number,
} | {
  /**
   * The type of the channel.
   */
  type: 'voice',
  /**
   * The user limit of the channel. This should be a value between `0` and `500`. `0` indicates
   * the absence of a user limit.
   */
  user_limit: number,
} | {
  /**
   * The type of the channel.
   */
  type: 'category',
}

/**
 * Represents a channel in a guild.
 */
export type GuildChannel = GuildChannelInfo & {
  /**
   * The ID of the channel.
   */
  id: number,
  /**
   * The ID of the guild that this channel is in.
   */
  guild_id: number,
  /**
   * The name of the channel.
   */
  name: string,
  /**
   * The position of the channel in the channel list. A lower value means appearing "higher" in
   * the UI, basically think of this as a 0-indexed listing of the channels from top-to-bottom.
   *
   * Positions are scoped per category, and categories have their own positions. Channels that
   * lack a category will be shown above all categories. This is because no channels can be
   * displayed in between or after categories - in the UI all non-category channels are displayed
   * above any other category channels.
   */
  position: number,
  /**
   * The permission overwrites for this channel.
   */
  permission_overwrites: any[], /* PermissionOverwrite[] TODO */
  /**
   * The ID of the parent category of the channel. This is `undefined` if the channel is not in a
   * category.
   */
  parent_id?: number,
}
