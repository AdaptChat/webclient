export default class Backoff {
  private retries: number

  constructor(
    private readonly baseDelay: number,
    private readonly maxDelay: number,
    private readonly factor: number = 2,
    private readonly maxRetries: number = 0,
  ) {
    this.retries = 0
  }

  reset(): number {
    this.retries = 0
    return this.baseDelay
  }

  delay(): number {
    return this.maxRetries && this.retries >= this.maxRetries
      ? this.reset()
      : Math.min(this.baseDelay * this.factor ** this.retries++, this.maxDelay)
  }
}
