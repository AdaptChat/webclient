// TODO use backoff
export default class Backoff {
  private retries: number

  constructor(
    private readonly baseDelay: number,
    private readonly maxDelay: number,
    private readonly maxRetries: number = 0,
  ) {
    this.retries = 0
  }

  reset(): undefined {
    this.retries = 0
    return
  }

  delay(): number | undefined {
    return this.maxRetries && ++this.retries > this.maxRetries
      ? this.reset()
      : Math.min(this.baseDelay * 2 ** this.retries, this.maxDelay)
  }
}
