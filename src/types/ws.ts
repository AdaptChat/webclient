import {ClientUser, Relationship, User} from "./user";
import {Guild, Invite, Member, PartialGuild} from "./guild";
import {Message} from "./message";
import {Presence} from "./presence";
import {Channel, DmChannel} from "./channel";

/**
 * Payload sent to harmony to update the client user's presence.
 */
export interface UpdatePresencePayload {
  /**
   * The new status.
   */
  status?: 'online' | 'idle' | 'dnd' | 'offline',
}

type WsEventMapping<Event extends string, Data = null> = {
  event: Event,
  data: Data,
}

/**
 * An outbound message (inbound from our perspective) from harmony.
 */
export type WsEvent = WsEventMapping<'hello'>
  | WsEventMapping<'ping'>
  | WsEventMapping<'pong'>
  | WsEventMapping<'ready', ReadyEvent>
  | WsEventMapping<'user_update', UserUpdateEvent>
  | WsEventMapping<'message_create', MessageCreateEvent>
  | WsEventMapping<'message_delete', MessageDeleteEvent>
  | WsEventMapping<'channel_create', ChannelCreateEvent>
  | WsEventMapping<'channel_delete', ChannelDeleteEvent>
  | WsEventMapping<'channel_ack', ChannelAckEvent>
  | WsEventMapping<'guild_create', GuildCreateEvent>
  | WsEventMapping<'guild_remove', GuildRemoveEvent>
  | WsEventMapping<'member_join', MemberJoinEvent>
  | WsEventMapping<'member_remove', MemberRemoveEvent>
  | WsEventMapping<'presence_update', PresenceUpdateEvent>
  | WsEventMapping<'relationship_create', RelationshipCreateEvent>
  | WsEventMapping<'relationship_remove', RelationshipRemoveEvent>
  | WsEventMapping<'typing_start', TypingStartEvent>
  | WsEventMapping<'typing_stop', TypingStopEvent>

/**
 * Ready, sent by harmony when it is ready to send and receive events.
 */
export interface ReadyEvent {
  /**
   * The ID of the current session.
   */
  session_id: string;
  /**
   * The client user of the current session.
   */
  user: ClientUser;
  /**
   * A list of guilds that the session's user is a member of.
   */
  guilds: Guild[];
  /**
   * A list of DM channels that the session's user is a recipient of.
   */
  dm_channels: DmChannel[];
  /**
   * A list of presences observed by the session's user.
   */
  presences: Presence[];
  /**
   * A list of relationships associated with the session's user.
   */
  relationships: Relationship[];
  /**
   * Information regarding unacknowledged messages and mentions.
   */
  unacked: {
    channel_id: Snowflake,
    last_message_id: Snowflake | null,
    mentions: Snowflake[],
  }[];
}

/**
 * Sent by harmony when a observable user is updated.
 */
export interface UserUpdateEvent {
  /**
   * The user before it was updated.
   */
  before: User;
  /**
   * The user after it was updated.
   */
  after: User;
}

/**
 * Sent by harmony when a message is sent.
 */
export interface MessageCreateEvent {
  /**
   * The message that was sent.
   */
  message: Message;
  /**
   * The nonce of the message, if any.
   */
  nonce?: string;
}

/**
 * Sent by harmony when a message is deleted.
 */
export interface MessageDeleteEvent {
  /**
   * The ID of the channel that the message was deleted from.
   */
  channel_id: Snowflake;
  /**
   * The ID of the message that was deleted.
   */
  message_id: Snowflake;
}

/**
 * Sent by harmony when a channel is created.
 */
export interface ChannelCreateEvent {
  /**
   * The channel that was created.
   */
  channel: Channel;
  /**
   * The nonce of the channel, if any.
   */
  nonce?: string;
}

/**
 * Sent by harmony when a channel is removed.
 */
export interface ChannelDeleteEvent {
  /**
   * The ID of the channel that was removed.
   */
  channel_id: Snowflake;
  /**
   * The ID of the guild that the channel was removed from, if any.
   */
  guild_id: Snowflake | null;
}

/**
 * Sent by harmony when updating acknowledged messages.
 */
export interface ChannelAckEvent {
  /**
   * The ID of the channel that was acknowledged.
   */
  channel_id: Snowflake;
  /**
   * Consider all messages up to this ID as acknowledged.
   */
  last_message_id: Snowflake;
}

/**
 * Sent by harmony when a guild is created or joined.
 */
export interface GuildCreateEvent {
  /**
   * The guild that was created or joined.
   */
  guild: Guild;
  /**
   * The nonce of the guild, if any.
   */
  nonce?: string;
}

/**
 * Sent by harmony when a guild is updated.
 */
export interface GuildUpdateEvent {
  /**
   * The guild before it was updated.
   */
  before: PartialGuild;
  /**
   * The guild after it was updated.
   */
  after: PartialGuild;
}

interface MemberRemoveInfo {
  /**
   * The type of removal.
   */
  type: 'delete' | 'leave' | 'kick' | 'ban',
  /**
   * The ID of the user that kicked or banned the client user.
   * Only present if the type is 'kick' or 'ban'.
   */
  moderator_id?: Snowflake,
}

/**
 * Sent by harmony when a guild is removed.
 */
export interface GuildRemoveEvent extends MemberRemoveInfo {
  /**
   * The ID of the guild that was removed.
   */
  guild_id: Snowflake;
}

/**
 * Sent by harmony when a user joins a guild.
 */
export interface MemberJoinEvent {
  /**
   * The member that joined.
   */
  member: Member;
  /**
   * The invite used to join the guild, if any.
   */
  invite?: Invite,
}

/**
 * Sent by harmony when a user is removed from a guild.
 */
export interface MemberRemoveEvent extends MemberRemoveInfo {
  /**
   * The ID of the guild that the user left.
   */
  guild_id: Snowflake;
  /**
   * The ID of the user that left.
   */
  user_id: Snowflake;
}

/**
 * Sent by harmony when a relationship is created or updated.
 */
export interface RelationshipCreateEvent {
  /**
   * The relationship that was created or updated.
   */
  relationship: Relationship;
}

/**
 * Sent by harmony when a relationship is removed.
 */
export interface RelationshipRemoveEvent {
  /**
   * The ID of the user that the relationship was removed for.
   */
  user_id: Snowflake;
}

/**
 * Sent by harmony when a user's presence is updated.
 */
export interface PresenceUpdateEvent {
  /**
   * The new presence of the user.
   */
  presence: Presence;
}

/**
 * Sent by harmony when a user starts typing.
 */
export interface TypingStartEvent {
  /**
   * The ID of the channel that the user started typing in.
   */
  channel_id: Snowflake;
  /**
   * The ID of the user that started typing.
   */
  user_id: Snowflake;
}

/**
 * Sent by harmony when a user stops typing.
 */
export type TypingStopEvent = TypingStartEvent
