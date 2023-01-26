import { createSignal } from "solid-js";

/**
 * Adapt REST API endpoint
 */
export const BASE_URL = 'https://api.adapt.chat'

/**
 * HTTP request method to use when making a request
 */
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * HTTP endpoint
 */
export type Endpoint = `/${string}`

/**
 * HTTP request options
 */
export interface RequestOptions {
  headers?: Record<string, string>,
}

/**
 * HTTP JSON response that might have errored
 */
export class ApiResponse<T> {
  method: RequestMethod
  endpoint: Endpoint
  response: Response
  $json?: T
  $text?: string
  $ensureOk: boolean

  private constructor(method: RequestMethod, endpoint: Endpoint, response: Response, json?: T, text?: string) {
    this.method = method;
    this.endpoint = endpoint;
    this.response = response;
    this.$json = json;
    this.$text = text;
    this.$ensureOk = false;
  }

  static async fromResponse<T>(
    method: RequestMethod,
    endpoint: Endpoint,
    response: Response,
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("Content-Type")
    let json, text;

    try {
      if (contentType == "application/json")
        json = await response.json()
      else
        text = await response.text()
    } catch (ignored) {}

    return new this(method, endpoint, response, json, text)
  }

  get status(): number {
    return this.response.status
  }

  get ok(): boolean {
    return this.response.ok
  }

  ensureOk() {
    this.$ensureOk = true
  }

  private throwForError() {
    if (this.ok || !this.$ensureOk)
      return

    let info = this.$json ?? this.$text ?? 'Received non-text response'
    throw new Error(`API Error (${this.status} ${this.response.statusText}): ${info}`)
  }

  jsonOrThrow(): T {
    this.throwForError()

    if (this.$json == null) {
      throw new Error(
        `API Error (${this.status} ${this.response.statusText}): Received non-JSON response when one was expected: `
        + `${this.textOrThrow()}`,
      )
    }
    return this.$json
  }

  textOrThrow(): string {
    this.throwForError()

    if (this.$json != null)
      return JSON.stringify(this.$json)

    if (this.$text == null) {
      throw new Error(`API Error (${this.status} ${this.response.statusText}): Received non-text response`)
    }
    return this.$text
  }
}

/**
 * API client entrypoint
 */
export default class Api {
  token: string;

  constructor(token: string) {
    this.token = token;
  }

  request<T = any>(
    method: RequestMethod,
    endpoint: Endpoint,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    if (options.headers)
      options.headers['Authorization'] ??= this.token;

    return Api.requestNoAuth(method, endpoint, options)
  }

  static async requestNoAuth<T = any>(
    method: RequestMethod,
    endpoint: Endpoint,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    let response = await fetch(BASE_URL + endpoint, {
      method,
      headers: (options.headers ?? {}) as unknown as Headers,
    })
    return await ApiResponse.fromResponse<T>(method, endpoint, response)
  }
}

export const globalApi = createSignal<Api>()
export const [getApi, setApi] = globalApi
