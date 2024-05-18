import Api from "./Api";
import {ReactiveSet} from "@solid-primitives/set";

export class TypingManager {
  users: ReactiveSet<bigint>
  private timeouts: Map<bigint, NodeJS.Timeout>

  constructor(private readonly api: Api) {
    this.users = new ReactiveSet()
    this.timeouts = new Map()
  }

  updateTyping(userId: bigint, typing: boolean) {
    if (userId === this.api.cache?.clientUser?.id)
      return // ignore self typing

    if (typing) {
      this.users.add(userId)
      clearTimeout(this.timeouts.get(userId))
      this.timeouts.set(userId, setTimeout(() => this.users.delete(userId), 10_000))
    } else {
      this.users.delete(userId)
    }
  }
}
