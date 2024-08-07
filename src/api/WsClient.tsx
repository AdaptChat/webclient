import Api, {sanitizeSnowflakes} from "./Api";
import ApiCache, {memberKey} from "./ApiCache";
import Backoff from "./Backoff";
import {
  ChannelAckEvent,
  ChannelCreateEvent, ChannelDeleteEvent, ChannelUpdateEvent,
  GuildCreateEvent,
  GuildRemoveEvent, GuildUpdateEvent,
  MemberJoinEvent,
  MemberRemoveEvent, MemberUpdateEvent,
  MessageCreateEvent,
  MessageDeleteEvent, MessageUpdateEvent,
  PresenceUpdateEvent,
  ReadyEvent,
  RelationshipCreateEvent,
  RelationshipRemoveEvent, RoleCreateEvent, RoleDeleteEvent, RolePositionsUpdateEvent, RoleUpdateEvent,
  TypingStartEvent,
  TypingStopEvent,
  UpdatePresencePayload,
  UserUpdateEvent,
  WsEvent
} from "../types/ws";
import {User} from "../types/user";
import {toast} from "solid-toast";
import msgpack from "tiny-msgpack";

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
    ws.api.cache ??= ApiCache.fromReadyEvent(ws.api, data)
    ws.readyPromiseResolver?.(true)
    ws.resetBackoff()
    console.info('[WS] Ready event received from harmony')
    ws.loadPersistedPresence()
  },
  user_update(ws: WsClient, data: UserUpdateEvent) {
    if (data.after.id === ws.api.cache?.clientId)
      ws.api.cache?.updateClientUser(data.after)

    ws.api.cache?.updateUser(data.after)
  },
  guild_create(ws: WsClient, data: GuildCreateEvent) {
    ws.api.cache?.updateGuild(data.guild)
  },
  guild_update(ws: WsClient, data: GuildUpdateEvent) {
    ws.api.cache?.patchGuild(data.after)
  },
  guild_remove(ws: WsClient, data: GuildRemoveEvent) {
    ws.api.cache?.removeGuild(data.guild_id)
  },
  channel_create(ws: WsClient, data: ChannelCreateEvent) {
    ws.api.cache?.updateChannel(data.channel)
    if ('guild_id' in data.channel) {
      const guildId = data.channel.guild_id
      ws.api.cache?.guildChannelReactor.set(
        guildId,
        ws.api.cache?.guildChannelReactor.get(guildId)?.concat(data.channel.id) ?? [data.channel.id]
      )
    } else {
      ws.api.cache?.insertDmChannel(data.channel.id)
    }
  },
  channel_update(ws: WsClient, data: ChannelUpdateEvent) {
    ws.api.cache?.updateChannel(data.after)
  },
  channel_delete(ws: WsClient, data: ChannelDeleteEvent) {
    ws.api.cache?.channels.delete(data.channel_id)
    if (data.guild_id) {
      const guildId = data.guild_id
      ws.api.cache?.guildChannelReactor.set(
        guildId,
        ws.api.cache?.guildChannelReactor.get(guildId)?.filter(id => id != data.channel_id) ?? []
      )
    } else {
      ws.api.cache?.removeDmChannel(data.channel_id)
    }
  },
  channel_ack(ws: WsClient, data: ChannelAckEvent) {
    ws.api.cache?.ack(data.channel_id, data.last_message_id)
  },
  message_create(ws: WsClient, data: MessageCreateEvent) {
    let cache = ws.api.cache
    if (!cache) return

    if (data.message.author_id === cache.clientId)
      cache.ack(data.message.channel_id, data.message.id)
    else if (cache.isMentionedIn(data.message))
      cache.registerMention(data.message.channel_id, data.message.id)

    cache.lastMessages.set(data.message.channel_id, data.message)

    let [dmChannels, _] = cache.dmChannelOrder
    if (dmChannels().includes(data.message.channel_id))
      cache.insertDmChannel(data.message.channel_id)

    let grouper = cache.messages.get(data.message.channel_id)
    if (!grouper) return

    if (data.nonce)
      try {
        if (grouper.nonced.has(data.nonce)) {
          return grouper.ackNonce(data.nonce, data.message)
        }
      } catch (ignored) {}

    grouper.pushMessage(data.message)
  },
  message_update(ws: WsClient, data: MessageUpdateEvent) {
    ws.api.cache?.messages?.get(data.after.channel_id)?.editMessage(data.after.id, data.after)
  },
  message_delete(ws: WsClient, data: MessageDeleteEvent) {
    ws.api.cache?.messages?.get(data.channel_id)?.removeMessage(data.message_id)
  },
  member_join(ws: WsClient, data: MemberJoinEvent) {
    ws.api.cache?.updateMember(data.member)
    ws.api.cache?.updateUser(data.member as User)
    ws.api.cache?.trackMember(data.member.guild_id, data.member.id)
  },
  member_update(ws: WsClient, data: MemberUpdateEvent) {
    ws.api.cache?.updateMember(data.after)
  },
  member_remove(ws: WsClient, data: MemberRemoveEvent) {
    ws.api.cache?.members.delete(memberKey(data.guild_id, data.user_id))
    ws.api.cache?.untrackMember(data.guild_id, data.user_id)
  },
  role_create(ws: WsClient, data: RoleCreateEvent) {
    ws.api.cache?.updateRole(data.role)
  },
  role_update(ws: WsClient, data: RoleUpdateEvent) {
    ws.api.cache?.updateRole(data.after)
  },
  role_positions_update(ws: WsClient, data: RolePositionsUpdateEvent) {
    for (const [i, id] of data.role_ids.entries()) {
      const role = ws.api.cache?.roles.get(id)
      if (role)
        ws.api.cache?.roles.set(id, { ...role, position: i + 1 })
    }

    const guild = ws.api.cache?.guilds.get(data.guild_id)
    if (guild) {
      ws.api.cache?.guilds.set(data.guild_id, {
        ...guild,
        roles: guild.roles?.sort((a, b) => data.role_ids.indexOf(a.id) - data.role_ids.indexOf(b.id))
      })
    }
  },
  role_delete(ws: WsClient, data: RoleDeleteEvent) {
    ws.api.cache?.deleteRole(data.role_id)
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

  initConnection() {
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
    this.initConnection()
    await new Promise((resolve) => this.readyPromiseResolver = resolve)
  }

  async forceReady() {
    let [guilds, dmChannels, clientUser, relationships] = await Promise.all([
      this.api.request('GET', '/guilds', {
        params: { channels: true, members: true, roles: true }
      }),
      this.api.request('GET', '/users/me/channels'),
      this.api.request('GET', '/users/me'),
      this.api.request('GET', '/relationships')
    ])

    WsEventHandlers.ready(this, {
      session_id: "",
      guilds: guilds.jsonOrThrow(),
      dm_channels: dmChannels.jsonOrThrow(),
      presences: [{
        user_id: clientUser.jsonOrThrow().id,
        status: "offline",
        devices: 0,
      }],
      user: clientUser.jsonOrThrow(),
      relationships: relationships.jsonOrThrow(),
      unacked: [],
    } satisfies ReadyEvent)
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

      json = sanitizeSnowflakes(msgpack.decode(data))
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
    if (!listeners) return
    const sweep: Set<number> = new Set()

    listeners.forEach((handler, index) => {
      handler(json.data, () => sweep.add(index))
    })
    this.listeners.set(json.event, listeners.filter((_, index) => !sweep.has(index)))
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

  loadPersistedPresence() {
    const presence = localStorage.getItem('presence')
    if (!presence) return
    this.updatePresence(JSON.parse(presence))
  }

  updatePresence(presence: UpdatePresencePayload) {
    // For responsiveness, synthesise the presence update locally
    // TODO: remove this when harmony's presence fanout is made faster
    this.api.cache?.updatePresence({
      ...this.api.cache?.presences.get(this.api.cache?.clientId!)!,
      ...presence,
    })
    this.connection?.send(msgpack.encode({
      op: 'update_presence',
      ...presence,
    }))
    // TODO: presence should persist via the backend
    localStorage.setItem('presence', JSON.stringify(presence))
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
