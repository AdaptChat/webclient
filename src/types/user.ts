/**
 * Represents a user account.
 *
 * A lot of information is stored in the user's flags, including whether the user is a bot
 * account.
 */
export interface User {
  /**
   * The snowflake ID of the user.
   */
  id: number;
  /**
   * The username of the user.
   */
  username: string;
  /**
   * The discriminator of the user, between 0 and 9999.
   */
  discriminator: number;
  /**
   * The URL of the user's avatar. This is `None` if the user has no avatar.
   */
  avatar?: string;
  /**
   * The URL of the user's banner. This is `None` if the user has no banner.
   */
  banner?: string;
  /**
   * The user's bio. This is `None` if the user has no bio.
   */
  bio?: string;
  /**
   * A bitmask of extra information associated with this user.
   */
  flags: number;
}

/**
 * Represents the type of relationship a user has with another user.
 */
export type RelationshipType = 'friend' | 'blocked' | 'incoming_request' | 'outgoing_request'

/**
 * Represents a relationship that a user has with another user.
 */
export interface Relationship {
  /**
   * The user that this relationship is with.
   */
  user: User;
  /**
   * The type of relationship this is.
   */
  type: RelationshipType;
}

/**
 * Represents user info about the client. This has other information that is not available to the
 * public, such as emails, guilds, and relationships (friends and blocked users).
 */
export interface ClientUser extends User {
  /**
   * The associated email of the client's account.
   */
  email?: string;
  /**
   * A list of relationships that the client has with other users.
   */
  relationships: Relationship[];
}
