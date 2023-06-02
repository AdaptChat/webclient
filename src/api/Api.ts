import {createRoot, createSignal} from "solid-js";
import WsClient from "./WsClient";
import ApiCache from "./ApiCache";

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
  params?: Record<string, any>,
  json?: Record<string, any>,
  multipart?: FormData,
}

/**
 * HTTP JSON response that might have errored
 */
export class ApiResponse<T> {
  $json?: T
  $text?: string
  $ensureOk: boolean

  private constructor(
    public readonly method: RequestMethod,
    public readonly endpoint: Endpoint,
    public response: Response,
    json?: T,
    text?: string,
  ) {
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

  ensureOk(): ApiResponse<T> {
    this.$ensureOk = true
    return this
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

  errorJsonOrThrow(): { message: string } {
    return this.jsonOrThrow() as any
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
  ws?: WsClient
  cache?: ApiCache

  constructor(public token: string) {}

  request<T = any>(
    method: RequestMethod,
    endpoint: Endpoint,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    options.headers ??= {}
    options.headers['Authorization'] ??= this.token

    return Api.requestNoAuth(method, endpoint, options)
  }

  static async requestNoAuth<T = any>(
    method: RequestMethod,
    endpoint: Endpoint,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    let headers = options.headers ?? {}
    if (options.json)
      headers['Content-Type'] ??= 'application/json';
    if (options.multipart)
      headers['Content-Type'] ??= 'multipart/form-data';
    if (options.params)
      endpoint += '?' + new URLSearchParams(options.params).toString()

    let response = await fetch(BASE_URL + endpoint, {
      method,
      headers: headers as unknown as Headers,
      body: options.multipart ?? (options.json && JSON.stringify(options.json)),
    })
    return await ApiResponse.fromResponse<T>(method, endpoint, response)
  }
}

export const [getApi, setApi] = createRoot(() => {
  const _globalApi = createSignal<Api>()
  const getApi = _globalApi[0]
  const [confirmedApiAccess, setConfirmedApiAccess] = createSignal(false)

  function setApi(api: Api) {
    // @ts-ignore
    if (window) try {
      Object.defineProperty(window, 'adaptApi', {
        get: () => {
          if (!confirmedApiAccess())
            confirm('Access to the "adaptApi" development/debug variable has been requested. ' +
              'Press "OK" to confirm access, otherwise press "Cancel" to deny access.\n\n' +
              'This is used to access the API from the browser console and can be used to gain access to your account. ' +
              'If you do not know what this is, you should probably press "Cancel".') && setConfirmedApiAccess(true)

          return confirmedApiAccess() ? api : undefined
        },
      })
    } catch (ignored) {}

    _globalApi[1](api)
  }

  return [getApi, setApi] as const
})
export const globalApi = [getApi, setApi] as const
