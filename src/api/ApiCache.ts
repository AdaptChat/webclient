import type {ClientUser, User} from "../types/user";
import type {Guild, Member} from "../types/guild";
import type {ReadyEvent} from "../types/ws";
import {Channel} from "../types/channel";
import MessageGrouper from "./MessageGrouper";
import type Api from "./Api";
import {createSignal, Signal} from "solid-js";

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
  channels: Map<number, Channel>
  messages: Map<number, MessageGrouper>
  inviteCodes: Map<number, string>

  constructor(private readonly api: Api) {
    this.users = new Map()
    this.guilds = new Map()
    this.guildListReactor = createSignal([])
    this.channels = new Map()
    this.messages = new Map()
    this.inviteCodes = new Map()
  }

  static fromReadyEvent(api: Api, ready: ReadyEvent): ApiCache {
    let cache = new ApiCache(api)
    cache.clientUser = ready.user
    for (const guild of ready.guilds)
      cache.updateGuild(guild, { updateUsers: true, updateChannels: true })

    cache.updateUser(ready.user)
    return cache
  }

  updateGuild(guild: Guild, options: UpdateGuildOptions = {}) {
    this.guilds.set(guild.id, guild)

    if (options.updateUsers && guild.members)
      for (const member of guild.members)
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

  updateUser(user: User) {
    this.users.set(user.id, user)
  }

  updateChannel(channel: Channel) {
    this.channels.set(channel.id, channel)
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
