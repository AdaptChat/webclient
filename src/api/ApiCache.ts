import {ClientUser, User} from "../types/user";
import {Guild, Member} from "../types/guild";
import {ReadyEvent} from "../types/ws";

/**
 * Options when updating guild cache.
 */
export interface UpdateGuildOptions {
  updateUsers?: boolean
}

/**
 * Caches data returned from the API.
 */
export default class ApiCache {
  clientUser?: ClientUser
  users: Map<number, User>
  guilds: Map<number, Guild>

  constructor() {
    this.users = new Map()
    this.guilds = new Map()
  }

  static fromReadyEvent(ready: ReadyEvent): ApiCache {
    let cache = new ApiCache()
    cache.clientUser = ready.user
    for (const guild of ready.guilds)
      cache.updateGuild(guild, { updateUsers: true })

    cache.updateUser(ready.user)
    return cache
  }

  updateGuild(guild: Guild, { updateUsers }: UpdateGuildOptions = {}) {
    this.guilds.set(guild.id, guild)

    if (updateUsers && guild.members)
      for (const member of guild.members)
        this.updateUser(member as User)
  }

  updateUser(user: User) {
    this.users.set(user.id, user)
  }

  get clientAvatar(): string | undefined {
    return this.clientUser && (this.clientUser.avatar ?? defaultAvatar(this.clientUser.id))
  }

  avatarOf(userId: number): string | undefined {
    return this.users.get(userId)?.avatar ?? defaultAvatar(userId)
  }
}

function defaultAvatar(userId: number): string {
  return `https://convey.adapt.chat/avatars/${userId}/default.png?theme=dark&width=96`
}
