import type {ClientUser, Relationship, RelationshipType, User} from "../types/user";
import type {Guild, Invite, Member, Role} from "../types/guild";
import type {ReadyEvent} from "../types/ws";
import type {Channel, GuildChannel} from "../types/channel";
import type {Presence} from "../types/presence";
import type Api from "./Api";
import MessageGrouper from "./MessageGrouper";
import {createSignal, Signal} from "solid-js";
import {ReactiveMap} from "@solid-primitives/map";
import {TypingManager} from "./TypingManager";
import {Permissions} from "./Bitflags";
import {calculatePermissions, snowflakes} from "../utils";
import {Message} from "../types/message";

function sortedIndex<T extends number>(array: T[], value: T) {
  let low = 0, high = array.length

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (array[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Generates a unique hash key for the guild ID and user ID pair using the Cantor pairing function.
 *
 * @param guildId The guild ID.
 * @param userId The user ID.
 * @returns The unique hash key.
 */
export function memberKey(guildId: number, userId: number): bigint {
  const a = BigInt(guildId), b = BigInt(userId)
  return (a + b) * (a + b + 1n) / 2n + a
}

/**
 * Caches data returned from the API.
 */
export default class ApiCache {
  clientUserReactor: Signal<ClientUser>
  users: Map<number, User>
  guilds: Map<number, Guild>
  guildListReactor: Signal<number[]> // TODO this should sort by order
  members: ReactiveMap<bigint, Member>
  memberReactor: ReactiveMap<number, number[]>
  roles: ReactiveMap<number, Role>
  channels: ReactiveMap<number, Channel>
  guildChannelReactor: ReactiveMap<number, number[]>
  dmChannelOrder: Signal<number[]> // TODO this should be stored on the server
  messages: Map<number, MessageGrouper>
  inviteCodes: Map<number, string>
  invites: Map<string, Invite>
  presences: ReactiveMap<number, Presence>
  relationships: ReactiveMap<number, RelationshipType>
  typing: Map<number, TypingManager>
  lastMessages: ReactiveMap<number, [number, number | null]> // message_id, author_id?
  lastAckedMessages: ReactiveMap<number, number | null>
  guildMentions: ReactiveMap<number, ReactiveMap<number, number[]>>
  dmMentions: ReactiveMap<number, number[]>

  constructor(private readonly api: Api) {
    this.clientUserReactor = null as any // lazy
    this.users = new Map()
    this.guilds = new Map()
    this.guildListReactor = createSignal([])
    this.members = new ReactiveMap()
    this.memberReactor = new ReactiveMap()
    this.roles = new ReactiveMap()
    this.channels = new ReactiveMap()
    this.guildChannelReactor = new ReactiveMap()
    this.dmChannelOrder = createSignal([])
    this.messages = new Map()
    this.inviteCodes = new Map()
    this.invites = new Map()
    this.presences = new ReactiveMap()
    this.relationships = new ReactiveMap()
    this.typing = new Map()
    this.lastMessages = new ReactiveMap()
    this.lastAckedMessages = new ReactiveMap()
    this.guildMentions = new ReactiveMap()
    this.dmMentions = new ReactiveMap()
  }

  static fromReadyEvent(api: Api, ready: ReadyEvent): ApiCache {
    let cache = new ApiCache(api)
    cache.clientUserReactor = createSignal(ready.user)
    cache.updateUser(ready.user)

    for (const relationship of ready.relationships)
      cache.updateRelationship(relationship)

    for (const guild of ready.guilds)
      cache.updateGuild(guild)

    for (const presence of ready.presences)
      cache.updatePresence(presence)

    for (const dmChannel of ready.dm_channels)
      cache.updateChannel(dmChannel)

    let order = ready.dm_channels.map(channel => channel.id)
    order.sort((a, b) => {
      const [aId, _aAuthor] = cache.lastMessages.get(a) ?? [a, 0]
      const [bId, _bAuthor] = cache.lastMessages.get(b) ?? [b, 0]
      return bId - aId
    })
    cache.dmChannelOrder[1](order)

    for (const { channel_id, last_message_id, mentions } of ready.unacked) {
      cache.lastAckedMessages.set(channel_id, last_message_id)
      let channel = cache.channels.get(channel_id)
      if (!channel) continue
      if ('guild_id' in channel) {
        if (!cache.guildMentions.has(channel.guild_id))
          cache.guildMentions.set(channel.guild_id, new ReactiveMap())

        cache.guildMentions.get(channel.guild_id)!.set(channel_id, mentions)
      } else {
        cache.dmMentions.set(channel_id, mentions)
      }
    }

    return cache
  }

  get clientUser(): ClientUser | undefined {
    return this.clientUserReactor?.[0]()
  }

  get clientId(): number | undefined {
    return this.clientUser?.id
  }

  updateClientUser(user: User) {
    this.clientUserReactor?.[1](prev => ({ ...prev, ...user }))
  }

  updateGuild(guild: Guild) {
    this.guilds.set(guild.id, guild)

    if (guild.members) {
      this.memberReactor.set(
        guild.id,
        guild.members.map(member => member.id).sort((a, b) => a - b),
      )
      for (const member of guild.members)
        this.updateMember(member)
    }

    if (guild.members)
      for (const member of guild.members)
        if ('username' in member)
          this.updateUser(member as User)

    if (guild.channels) {
      for (const channel of guild.channels)
        this.updateChannel(channel)

      this.guildChannelReactor.set(guild.id, guild.channels.map(channel => channel.id))
    }

    if (guild.roles)
      for (const role of guild.roles)
        this.updateRole(role)

    this.guildListReactor[1](prev => {
      // TODO: sort by true order, this is just creation date
      const index = sortedIndex(prev, guild.id)
      const next = [...prev]
      next.splice(index, 0, guild.id)
      return next
    })
  }

  removeGuild(guildId: number) {
    this.guilds.delete(guildId)
    this.guildListReactor[1](prev => prev.filter(id => id !== guildId))
  }

  updateUser(user: User) {
    if ('username' in user) // Ensure this is not a partial user
      this.users.set(user.id, user)
  }

  updatePresence(presence: Presence) {
    this.presences.set(presence.user_id, presence)
  }

  updateMember(member: Member) {
    const key = memberKey(member.guild_id, member.id)
    const base = this.members.get(key) ?? member
    // This is different from just `Object.assign(base, member)` because we don't want to
    // overwrite with nullish values.
    if (member.nick) base.nick = member.nick
    if (member.roles) base.roles = member.roles
    if (member.joined_at) base.joined_at = member.joined_at

    this.members.set(key, base)
  }

  updateRole(role: Role) {
    this.roles.set(role.id, role)
  }

  updateChannel(channel: Channel) {
    this.channels.set(channel.id, channel)

    if ('last_message_id' in channel)
      channel.last_message_id && this.lastMessages.set(channel.id, [channel.last_message_id, null])
  }

  insertDmChannel(channelId: number) {
    this.dmChannelOrder[1](prev => {
      const index = prev.indexOf(channelId)
      if (index === -1) return [channelId, ...prev]

      const next = [...prev]
      next.splice(index, 1)
      next.unshift(channelId)
      return next
    })
  }

  removeDmChannel(channelId: number) {
    this.dmChannelOrder[1](prev => prev.filter(id => id !== channelId))
  }

  updateRelationship(relationship: Relationship) {
    this.updateUser(relationship.user)
    this.relationships.set(relationship.user.id, relationship.type)
  }

  trackMember(guildId: number, userId: number) {
    const previous = this.memberReactor.get(guildId) ?? []
    if (previous.includes(userId)) return

    const index = sortedIndex(previous, userId)
    const next = [...previous]
    next.splice(index, 0, userId)
    this.memberReactor.set(guildId, next)
  }

  untrackMember(guildId: number, userId: number) {
    const previous = this.memberReactor.get(guildId) ?? []
    if (!previous.includes(userId)) return

    this.memberReactor.set(guildId, previous.filter(id => id !== userId))
  }

  get guildList(): number[] {
    return this.guildListReactor[0]()
  }

  get clientAvatar(): string | undefined {
    return this.clientUser && (this.clientUser.avatar ?? defaultAvatar(this.clientUser.id))
  }

  avatarOf(userId: number): string | undefined {
    return this.users.get(userId)?.avatar ?? defaultAvatar(userId)
  }

  useChannelMessages(channelId: number): { grouper: MessageGrouper, cached: boolean } {
    let grouper = this.messages.get(channelId)
    const cached = !!grouper

    if (!grouper) this.messages.set(channelId, grouper = new MessageGrouper(this.api, channelId))
    return { grouper, cached }
  }

  useTyping(channelId: number): TypingManager {
    let manager = this.typing.get(channelId)
    if (!manager)
      this.typing.set(channelId, manager = new TypingManager(this.api))

    return manager
  }

  getMemberRoles(guildId: number, userId: number): Role[] {
    const member = this.members.get(memberKey(guildId, userId))
    if (!member) return []

    const roles = (member.roles ?? []).map(id => this.roles.get(id)).filter(role => role != null) as Role[]

    const defaultRoleId = Number(snowflakes.withModelType(guildId, snowflakes.ModelType.Role))
    if (!roles.find(role => role.id === defaultRoleId)) roles.push(this.roles.get(defaultRoleId)!)
    return roles
  }

  getMemberPermissions(guildId: number, userId: number, channelId?: number): Permissions {
    if (this.guilds.get(guildId)?.owner_id === userId) return Permissions.all()

    const member = this.members.get(memberKey(guildId, userId))
    if (!member) return Permissions.empty()

    const roles = this.getMemberRoles(guildId, userId)
    const overwrites = channelId && (this.channels.get(channelId) as GuildChannel).permission_overwrites || undefined
    return calculatePermissions(userId, roles, overwrites)
  }

  getClientPermissions(guildId: number, channelId?: number): Permissions {
    return this.getMemberPermissions(guildId, this.clientId!, channelId)
  }

  ack(channelId: number, messageId: number) {
    this.lastAckedMessages.set(channelId, messageId)

    let channel = this.channels.get(channelId)
    if (!channel) return

    if ('guild_id' in channel) {
      let guildMentions = this.guildMentions.get(channel.guild_id)
      if (!guildMentions) return

      let mentions = guildMentions.get(channelId)
      if (!mentions) return

      guildMentions.set(channelId, mentions.filter(id => id > messageId))
    } else {
      let mentions = this.dmMentions.get(channelId)
      if (!mentions) return

      this.dmMentions.set(channelId, mentions.filter(id => id > messageId))
    }
  }

  isChannelUnread(channelId: number) {
    const lastReceived = this.lastMessages.get(channelId)?.[0]
    if (!lastReceived) return false

    const lastAcked = this.lastAckedMessages.get(channelId)
    if (!lastAcked) return true

    return lastReceived > lastAcked
  }

  isMentionedIn(message: Message): boolean {
    // @user
    if (message.mentions.includes(this.clientId!)) return true

    let channel = this.channels.get(message.channel_id)
    if (!channel) return false

    if ('guild_id' in channel) {
      if (message.mentions.includes(channel.guild_id)) return true // @everyone
      // @role
      let roles = this.members.get(memberKey(channel.guild_id, this.clientId!))?.roles ?? []
      return message.mentions.some(id => roles.includes(id))
    }
    return false
  }

  registerMention(channelId: number, messageId: number) {
    function registerIn(map: ReactiveMap<number, number[]>) {
      map.set(
        channelId,
        (map.get(channelId) ?? []).concat(messageId),
      )
    }

    let channel = this.channels.get(channelId)
    if (!channel) return

    if ('guild_id' in channel) {
      if (!this.guildMentions.has(channel.guild_id))
        this.guildMentions.set(channel.guild_id, new ReactiveMap())

      registerIn(this.guildMentions.get(channel.guild_id)!)
    } else {
      registerIn(this.dmMentions)
    }
  }

  countGuildMentionsIn(guildId: number, channelId: number): number | null {
    return this.guildMentions.get(guildId)?.get(channelId)?.length ?? null
  }

  countDmMentionsIn(channelId: number): number | null {
    return this.dmMentions.get(channelId)?.length ?? null
  }
}

function defaultAvatar(userId: number): string {
  return `https://convey.adapt.chat/avatars/${userId}/default.png?theme=dark&width=96`
}
