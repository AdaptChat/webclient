import Api from "./Api";
import ApiCache from "./ApiCache";
import Backoff from "./Backoff";
import {
  GuildCreateEvent,
  GuildRemoveEvent,
  MemberJoinEvent,
  MemberRemoveEvent,
  MessageCreateEvent,
  PresenceUpdateEvent,
  ReadyEvent,
  RelationshipCreateEvent,
  RelationshipRemoveEvent,
  TypingStartEvent,
  TypingStopEvent,
  UpdatePresencePayload, UserUpdateEvent,
  WsEvent
} from "../types/ws";
import {User} from "../types/user";
import {toast} from "solid-toast";
import msgpack from "msgpack-lite";

/**
 * WebSocket endpoint
 */
export const WS_CONNECT_URI: string = 'wss://harmony.adapt.chat?format=msgpack'

type WsEventHandler = (ws: WsClient, data: any) => any
type WsEventListener = (data: any, remove: () => void) => any

export const WsEventHandlers: Record<string, WsEventHandler> = {
  hello(ws) {
    ws.sendIdentify()
    console.info('[WS] Connected to harmony')
  },
  ready(ws: WsClient, data: ReadyEvent) {
    ws.readyPromiseResolver?.(true)
    ws.api.cache ??= ApiCache.fromReadyEvent(ws.api, data)
    ws.resetBackoff()
    console.info('[WS] Ready event received from harmony')
  },
  user_update(ws: WsClient, data: UserUpdateEvent) {
    if (data.after.id === ws.api.cache?.clientId)
      ws.api.cache?.updateClientUser(data.after)

    ws.api.cache?.updateUser(data.after)
  },
  guild_create(ws: WsClient, data: GuildCreateEvent) {
    ws.api.cache?.updateGuild(data.guild, { updateUsers: true, updateChannels: true })
  },
  guild_remove(ws: WsClient, data: GuildRemoveEvent) {
    ws.api.cache?.removeGuild(data.guild_id)
  },
  message_create(ws: WsClient, data: MessageCreateEvent) {
    let grouper = ws.api.cache?.messages?.get(data.message.channel_id)
    if (!grouper) return

    if (data.nonce)
      try {
        if (grouper.nonced.has(data.nonce)) {
          return grouper.ackNonce(data.nonce, data.message)
        }
      } catch (ignored) {}

    grouper.pushMessage(data.message)
  },
  member_join(ws: WsClient, data: MemberJoinEvent) {
    ws.api.cache?.updateUser(data.member as User)
    ws.api.cache?.trackMember(data.member.guild_id, data.member.id)
  },
  member_remove(ws: WsClient, data: MemberRemoveEvent) {
    ws.api.cache?.untrackMember(data.guild_id, data.user_id)
  },
  relationship_create(ws: WsClient, data: RelationshipCreateEvent) {
    const prev = ws.api.cache?.relationships.get(data.relationship.user.id)
    ws.api.cache?.updateRelationship(data.relationship)

    const name = data.relationship.user.username
    const now = data.relationship.type

    // TODO: these could be push/native notifications
    if (prev === 'outgoing_request' && now === 'friend')
      return toast(`${name} accepted your friend request!`);

    if (now === 'incoming_request')
      return toast(`${name} sent you a friend request. See friend requests to accept or deny.`);
  },
  relationship_remove(ws: WsClient, data: RelationshipRemoveEvent) {
    ws.api.cache?.relationships.delete(data.user_id)
  },
  presence_update(ws: WsClient, data: PresenceUpdateEvent) {
    ws.api.cache?.updatePresence(data.presence)
  },
  typing_start(ws: WsClient, data: TypingStartEvent) {
    ws.api.cache?.useTyping(data.channel_id).updateTyping(data.user_id, true)
  },
  typing_stop(ws: WsClient, data: TypingStopEvent) {
    ws.api.cache?.useTyping(data.channel_id).updateTyping(data.user_id, false)
  }
}

/**
 * Implements a client for harmony (Adapt's websocket).
 */
export default class WsClient {
  readyPromiseResolver?: (resolver: any) => void
  private connection?: WebSocket
  private listeners: Map<string, WsEventListener[]>
  private pingInterval?: number
  private shouldKeepAlive: boolean
  private backoff: Backoff = new Backoff(1_000, 120_000)

  constructor(public api: Api) {
    this.shouldKeepAlive = false
    this.listeners = new Map()
  }

  async initConnection() {
    this.shouldKeepAlive = true
    this.readyPromiseResolver = undefined
    this.clearPingInterval()

    const connection = new WebSocket(WS_CONNECT_URI)
    connection.onmessage = this.processMessage.bind(this)
    connection.onclose = () => {
      if (this.shouldKeepAlive) this.reconnectWithBackoff()
    }

    this.pingInterval = setInterval(this.sendPing.bind(this), 15000) as unknown as number
    this.connection = connection
  }

  async connect() {
    await this.initConnection()
    await new Promise((resolve) => this.readyPromiseResolver = resolve)
  }

  sendIdentify() {
    console.debug('[WS] Sending identify to harmony')

    this.connection?.send(msgpack.encode({
      op: 'identify',
      token: this.api.token,
      device: '__TAURI__' in window ? 'desktop' : 'web',
    }))
  }

  private sendPing() {
    this.connection?.send(msgpack.encode({ op: 'ping' }))
  }

  private async processMessage(message: MessageEvent) {
    let json: WsEvent
    try {
      let data = message.data
      if (data instanceof Blob)
        data = new Uint8Array(await data.arrayBuffer())

      json = msgpack.decode(data)
    } catch (e) {
      return console.debug('[WS] Received undeserializable message from harmony', e, message.data)
    }

    const debugMessage = `[WS] Received ${json.event} event from harmony`
    if (json.data != null)
      console.debug(debugMessage, json.data)
    else
      console.debug(debugMessage)

    WsEventHandlers[json.event]?.(this, json.data)

    const listeners = this.listeners.get(json.event)
    if (listeners) {
      const sweep: Set<number> = new Set()

      listeners.forEach((handler, index) => {
        handler(json.data, () => sweep.add(index))
      })
      this.listeners.set(json.event, listeners.filter((_, index) => !sweep.has(index)))
    }
  }

  private clearPingInterval() {
    clearInterval(this.pingInterval)
    this.pingInterval = undefined
  }

  private resetConnection() {
    this.connection?.close()
    this.connection = undefined
    this.clearPingInterval()
  }

  async reconnect() {
    this.resetConnection()
    await this.connect()
  }

  updatePresence(presence: UpdatePresencePayload) {
    this.connection?.send(msgpack.encode({
      op: 'update_presence',
      ...presence,
    }))
  }

  reconnectWithBackoff() {
    const delay = this.backoff.delay()
    console.debug(`[WS] Connection closed, attempting reconnect in ${delay / 1000} seconds`)
    setTimeout(this.reconnect.bind(this), delay)
  }

  resetBackoff() {
    this.backoff.reset()
  }

  on(event: string, handler: WsEventListener): () => void {
    if (!this.listeners.has(event))
      this.listeners.set(event, [])

    this.listeners.get(event)!.push(handler)
    return () => this.listeners.get(event)!.splice(this.listeners.get(event)!.indexOf(handler), 1)
  }

  close() {
    this.shouldKeepAlive = false
    this.resetConnection()
  }
}
