import {ClientUser} from "../types/user";
import {Guild} from "../types/guild";
import {ReadyEvent} from "../types/ws";

/**
 * Caches data returned from the API.
 */
export default class ApiCache {
  clientUser?: ClientUser
  guilds: Map<number, Guild>

  constructor() {
    this.guilds = new Map()
  }

  static fromReadyEvent(ready: ReadyEvent): ApiCache {
    let cache = new ApiCache()
    cache.clientUser = ready.user
    for (const guild of ready.guilds)
      cache.addGuild(guild)

    return cache
  }

  addGuild(guild: Guild) {
    this.guilds.set(guild.id, guild)
  }
}
