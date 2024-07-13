import Layout, {FormInput, FormSubmit} from "./Layout";
import Api, {setApi} from "../../api/Api";
import {LoginResponse} from "../../types/auth";
import {createEffect, createSignal, Show} from "solid-js";
import {useLocation, useNavigate} from "@solidjs/router";
import {Turnstile, TurnstileRef} from "@nerimity/solid-turnstile";

enum UsernameCheckState {
  success,
  error,
  loading,
}

export default function Register() {
  let usernameRef: HTMLInputElement | null = null
  // let displayNameRef: HTMLInputElement | null = null
  let emailRef: HTMLInputElement | null = null
  let passwordRef: HTMLInputElement | null = null
  let rememberMeRef: HTMLInputElement | null = null
  let turnstileRef: TurnstileRef | null = null
  let [turnstileToken, setTurnstileToken] = createSignal<string>()

  let [error, setError] = createSignal<string>()
  let [isSubmitting, setIsSubmitting] = createSignal(false)
  let [_ignored, setUsernameTimeout] = createSignal<NodeJS.Timeout | null>(null)
  let [usernameHint, setUsernameHint] = createSignal<[string, UsernameCheckState] | null>(null)

  const redirectTo = useLocation<{ redirectTo: string }>().state?.redirectTo ?? "/"
  const navigate = useNavigate()

  return (
    <Layout
      title="Create an account"
      error={error()}
      switchScreenCondition="Already have an account?"
      switchScreenLabel="Sign in"
      switchScreenHref="/"
      redirectTo={redirectTo}
      onSubmit={async () => {
        setIsSubmitting(true)
        const username = usernameRef!.value
        const email = emailRef!.value
        const password = passwordRef!.value

        const captcha_token = turnstileToken();
        if (captcha_token == null) {
          setError('No CAPTCHA token yet')
          return
        }
        let response = await Api.requestNoAuth<LoginResponse>('POST', '/users', {
          json: { username, email, password, captcha_token: turnstileToken() },
        })

        if (!response.ok) {
          setIsSubmitting(false)
          setError(response.errorJsonOrThrow().message)
          setTurnstileToken(undefined)
          turnstileRef?.reset()
          return
        }
        let { token } = response.ensureOk().jsonOrThrow()
        if (rememberMeRef!.checked) localStorage.setItem("token", token);
        setApi(new Api(token))
        navigate(redirectTo)
      }}
    >
      <div class="-space-y-px">
        <div class="flex flex-col rounded-md shadow-sm box-border overflow-hidden gap-[3px]">
          <FormInput
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            label="Email"
            ref={emailRef!}
            required
          />
          <FormInput
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            label="Password"
            ref={passwordRef!}
            required
          />
          <FormInput
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            label="Username"
            ref={usernameRef!}
            required
            onInput={() => setUsernameTimeout(prev => {
              if (prev != null) clearTimeout(prev)
              return setTimeout(async () => {
                const username = usernameRef!.value
                if (!username) return setUsernameHint(null)
                setUsernameHint(['Checking availability...', UsernameCheckState.loading])

                const endpoint: `/${string}` = `/users/check/${encodeURIComponent(username)}`
                let response = await Api.requestNoAuth<LoginResponse>('GET', endpoint)

                setUsernameHint(
                  response.ok
                    ? ['Username available!', UsernameCheckState.success]
                    : [response.errorJsonOrThrow().message.replace(/'(?:\\(')|("))'/, "$1$2"), UsernameCheckState.error]
                )
              }, 1000)
            })}
          />
        </div>
        <Show when={usernameHint()} keyed={false} fallback={<div class="h-4" />}>
          <p classList={{
            "text-xs text-right pr-1 pt-1 h-4": true,
            "text-green-500": usernameHint()![1] === UsernameCheckState.success,
            "text-red-500": usernameHint()![1] === UsernameCheckState.error,
            "text-fg/50": usernameHint()![1] === UsernameCheckState.loading,
          }}>
            {usernameHint()![0]}
          </p>
        </Show>
      </div>

      <div class="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          class="checkbox checkbox-accent"
          checked
          ref={rememberMeRef!}
        />
        <label for="remember-me" class="ml-2 block text-sm">
          Remember me
        </label>
      </div>

      <Show when={turnstileToken()} fallback={
        <Turnstile
          ref={turnstileRef!}
          sitekey={process.env.NODE_ENV === "production" ? "0x4AAAAAAACKrfJ6GCEBF1ih" : "1x00000000000000000000AA"}
          onVerify={setTurnstileToken}
          autoResetOnExpire={true}
          class="self-center mt-4"
          theme="dark"
        />
      }>
        <FormSubmit
          disabled={isSubmitting() || usernameHint() == null || usernameHint()![1] !== UsernameCheckState.success}
        >
          {isSubmitting() ? 'Registering...' : 'Register'}
        </FormSubmit>
      </Show>
    </Layout>
  )
}
