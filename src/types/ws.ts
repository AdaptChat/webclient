import {ClientUser, Relationship} from "./user";
import {Guild, Invite, Member} from "./guild";
import {Message} from "./message";
import {Presence} from "./presence";

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
  | WsEventMapping<'message_create', MessageCreateEvent>
  | WsEventMapping<'guild_create', GuildCreateEvent>
  | WsEventMapping<'guild_remove', GuildRemoveEvent>
  | WsEventMapping<'member_join', MemberJoinEvent>
  | WsEventMapping<'member_remove', MemberRemoveEvent>
  | WsEventMapping<'presence_update', PresenceUpdateEvent>
  | WsEventMapping<'relationship_create', RelationshipCreateEvent>

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
   * A list of presences observed by the session's user.
   */
  presences: Presence[];
  /**
   * A list of relationships associated with the session's user.
   */
  relationships: Relationship[];
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

interface MemberRemoveInfo {
  /**
   * The type of removal.
   */
  type: 'delete' | 'leave' | 'kick' | 'ban',
  /**
   * The ID of the user that kicked or banned the client user.
   * Only present if the type is 'kick' or 'ban'.
   */
  moderator_id?: number,
}

/**
 * Sent by harmony when a guild is removed.
 */
export interface GuildRemoveEvent extends MemberRemoveInfo {
  /**
   * The ID of the guild that was removed.
   */
  guild_id: number;
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
  guild_id: number;
  /**
   * The ID of the user that left.
   */
  user_id: number;
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
 * Sent by harmony when a user's presence is updated.
 */
export interface PresenceUpdateEvent {
  /**
   * The new presence of the user.
   */
  presence: Presence;
}
