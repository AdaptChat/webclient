import {User} from "./user";
import {GuildChannel} from "./channel";

/**
 * Represents a guild with partial information, sometimes referred to as a server.
 */
export interface PartialGuild {
  /**
   * The snowflake ID of the guild.
   */
  id: Snowflake;
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
  owner_id: Snowflake;
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
  roles?: Role[];
  /**
   * A list of resolved channels in the guild.
   */
  channels?: GuildChannel[]
}

type MaybePartialUser = User | {
  /**
   * The snowflake ID of the user.
   */
  id: Snowflake;
}

/**
 * Represents a member of a guild. Members are users that are associated with a guild.
 */
export type Member = MaybePartialUser & {
  /**
   * The ID of the guild this member is in.
   */
  guild_id: Snowflake;
  /**
   * The nickname of the member. `None` if the member has no nickname.
   */
  nick?: string;
  /**
   * A list of IDs of the roles that the member has. This could be `None` in some cases.
   */
  roles?: (number | bigint)[];
  /**
   * The time that the member joined the guild.
   */
  joined_at: string;
  /**
   * Base permissions granted to this member.
   */
  permissions: bigint;
}

/**
 * Represents an invitation to a guild. All invites are immutable by design.
 */
export interface Invite {
  /**
   * The code of the invite.
   */
  code: string;
  /**
   * The ID of the user that created this invite.
   */
  inviter_id: Snowflake;
  /**
   * Partial guild information about the guild this invite leads to. This is `None` when this is
   * already fetched from a guild.
   */
  guild?: PartialGuild;
  /**
   * The ID of the guild this invite leads to.
   */
  guild_id: Snowflake;
  /**
   * A timestamp representing when this invite was created.
   */
  created_at: string;
  /**
   * How many times this invite has been used.
   */
  uses: number;
  /**
   * How many times this invite can be used. `0` if unlimited.
   */
  max_uses: number;
  /**
   * How long this invite is valid for, in seconds. `0` if this invite never expires. This
   * counts from the time the invite was created (see `created_at`).
   */
  max_age: number;
}

export type ExtendedColor = {
  type: 'solid',
  color: number
} | {
  type: 'gradient',
  angle: number,
  stops: {
    position: number,
    color: number,
  }[]
}

/**
 * A role in a guild.
 */
export interface Role {
  /**
   * The snowflake ID of the role.
   */
  id: Snowflake;
  /**
   * The ID of the guild this role belongs to.
   */
  guild_id: Snowflake;
  /**
   * The name of the role.
   *
   */
  name: string;
  /**
   * The color of the role.
   */
  color?: ExtendedColor;
  /**
   * The permissions users with this role have.
   */
  permissions: {
    /**
     * Allowed permissions.
     */
    allow: bigint;
    /**
     * Denied permissions.
     */
    deny: bigint;
  };
  /**
   * The position of this role in the role hierarchy. The lower the number, the lower the role.
   * The default role always has a position of 0.
   */
  position: number;
  /**
   * A bitmask of flags representing extra metadata about the role.
   */
  flags: number;
}
