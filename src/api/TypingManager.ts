import Api from "./Api";
import {ReactiveSet} from "@solid-primitives/set";

export class TypingManager {
  users: ReactiveSet<number>
  private timeouts: Map<number, NodeJS.Timeout>

  constructor(private readonly api: Api) {
    this.users = new ReactiveSet()
    this.timeouts = new Map()
  }

  updateTyping(userId: number, typing: boolean) {
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
