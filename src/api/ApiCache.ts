import type {ClientUser, Relationship, RelationshipType, User} from "../types/user";
import type {Guild, Member} from "../types/guild";
import type {ReadyEvent} from "../types/ws";
import type {Channel} from "../types/channel";
import type {Presence} from "../types/presence";
import type Api from "./Api";
import MessageGrouper from "./MessageGrouper";
import {createSignal, Signal} from "solid-js";
import {ReactiveMap} from "@solid-primitives/map";

/**
 * Options when updating guild cache.
 */
export interface UpdateGuildOptions {
  updateUsers?: boolean
  updateChannels?: boolean
}

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
 * Caches data returned from the API.
 */
export default class ApiCache {
  clientUser?: ClientUser
  users: Map<number, User>
  guilds: Map<number, Guild>
  guildListReactor: Signal<number[]> // TODO this should sort by order
  memberReactor: ReactiveMap<number, number[]>
  channels: Map<number, Channel>
  messages: Map<number, MessageGrouper>
  inviteCodes: Map<number, string>
  presences: ReactiveMap<number, Presence>
  relationships: ReactiveMap<number, RelationshipType>

  constructor(private readonly api: Api) {
    this.users = new Map()
    this.guilds = new Map()
    this.guildListReactor = createSignal([])
    this.memberReactor = new ReactiveMap<number, number[]>()
    this.channels = new Map()
    this.messages = new Map()
    this.inviteCodes = new Map()
    this.presences = new ReactiveMap<number, Presence>()
    this.relationships = new ReactiveMap<number, RelationshipType>()
  }

  static fromReadyEvent(api: Api, ready: ReadyEvent): ApiCache {
    let cache = new ApiCache(api)
    cache.clientUser = ready.user

    for (const relationship of ready.relationships)
      cache.updateRelationship(relationship)

    for (const guild of ready.guilds)
      cache.updateGuild(guild, { updateUsers: true, updateChannels: true })

    for (const presence of ready.presences)
      cache.updatePresence(presence)

    cache.updateUser(ready.user)
    return cache
  }

  updateGuild(guild: Guild, options: UpdateGuildOptions = {}) {
    this.guilds.set(guild.id, guild)

    if (guild.members)
      this.memberReactor.set(guild.id, guild.members.map(member => member.id).sort((a, b) => a - b))

    if (options.updateUsers && guild.members)
      for (const member of guild.members)
        if ('username' in member)
          this.updateUser(member as User)

    if (options.updateChannels && guild.channels)
      for (const channel of guild.channels)
        this.updateChannel(channel)

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
    this.users.set(user.id, user)
  }

  updatePresence(presence: Presence) {
    this.presences.set(presence.user_id, presence)
  }

  updateChannel(channel: Channel) {
    this.channels.set(channel.id, channel)
  }

  updateRelationship(relationship: Relationship) {
    this.relationships.set(relationship.user.id, relationship.type)
    this.updateUser(relationship.user)
  }

  trackMember(guildId: number, userId: number) {
    const previous = this.memberReactor.get(guildId) ?? []
    if (previous.includes(userId)) return

    this.memberReactor.set(guildId, [...previous, userId].sort((a, b) => a - b))
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
}

function defaultAvatar(userId: number): string {
  return `https://convey.adapt.chat/avatars/${userId}/default.png?theme=dark&width=96`
}
