import {ClientUser} from "./user";
import {Guild} from "./guild";

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
}
