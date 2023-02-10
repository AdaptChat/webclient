import {User} from "./user";
import {GuildChannel} from "./channel";

/**
 * Represents a guild with partial information, sometimes referred to as a server.
 */
export interface PartialGuild {
  /**
   * The snowflake ID of the guild.
   */
  id: number;
  /**
   * The name of the guild.
   */
  name: string;
  /**
   * The description of the guild.
   */
  description?: string;
  /**
   * The URL of the icon of the guild.
   */
  icon?: string;
  /**
   * The URL of the banner of the guild.
   */
  banner?: string;
  /**
   * The ID of the owner of the guild.
   */
  owner_id: number;
  /**
   * Extra information about the guild represented through bitflags.
   */
  flags: number;
  /**
   * The amount of members in the guild. This could be `None` at times. For partial guilds, the
   * `online` field of this will also be `None`.
   */
  member_count?: {
    /**
     * The total number of members in the guild.
     */
    total: number;
    /**
     * The number of members that are online. If this was part of a partial guild object, then
     * this will be `None`.
     */
    online?: number;
  };
  /**
   * The vanity URL code of the guild. This solely includes the code, not the full URL.
   * This is `None` if the guild does not have a vanity URL.
   *
   * Guilds have the ability to set vanity URLs once they surpass 100 non-bot members *and* have
   * their visibility set to public. The vanity URL code can be between 3 and 32 characters long.
   */
  vanity_url?: string;
}

/**
 * Represents a guild with all information.
 */
export interface Guild extends PartialGuild {
  /**
   * A list of resolved members in the guild.
   */
  members?: Member[];
  /**
   * A list of resolved roles in the guild.
   */
  roles?: any // TODO Role[];
  /**
   * A list of resolved channels in the guild.
   */
  channels?: GuildChannel[]
}

type MaybePartialUser = User | {
  /**
   * The snowflake ID of the user.
   */
  id: number;
}

/**
 * Represents a member of a guild. Members are users that are associated with a guild.
 */
export type Member = MaybePartialUser & {
  /**
   * The ID of the guild this member is in.
   */
  guild_id: number;
  /**
   * The nickname of the member. `None` if the member has no nickname.
   */
  nick?: string;
  /**
   * A list of IDs of the roles that the member has. This could be `None` in some cases.
   */
  roles?: number[];
  /**
   * The time that the member joined the guild.
   */
  joined_at: string;
}
