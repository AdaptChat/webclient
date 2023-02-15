import Layout, {FormInput} from "./Layout";
import Api, {setApi} from "../../api/Api";
import {LoginResponse} from "../../types/auth";
import {createSignal} from "solid-js";
import Cookies from "js-cookie";
import {useLocation, useNavigate} from "@solidjs/router";
import {Turnstile, TurnstileRef} from "@nerimity/solid-turnstile";

export default function Register() {
  let usernameRef: HTMLInputElement | null = null
  let emailRef: HTMLInputElement | null = null
  let passwordRef: HTMLInputElement | null = null
  let rememberMeRef: HTMLInputElement | null = null
  let turnstileRef: TurnstileRef | null = null

  let [error, setError] = createSignal<string>()
  let [isSubmitting, setIsSubmitting] = createSignal(false)

  const redirectTo = useLocation<{ redirectTo: string }>().state?.redirectTo ?? "/"
  const navigate = useNavigate()

  return (
    <Layout
      title="Create an account"
      error={error()}
      switchScreenCondition="Already have an account?"
      switchScreenLabel="Sign in"
      switchScreenHref="/"
      submitLabel="Register"
      submitLabelProgressive="Registering..."
      isSubmitting={isSubmitting()}
      redirectTo={redirectTo}
      onSubmit={async () => {
        setIsSubmitting(true)
        const username = usernameRef!.value
        const email = emailRef!.value
        const password = passwordRef!.value

        let response = await Api.requestNoAuth<LoginResponse>('POST', '/users', {
          json: { username, email, password },
        })

        if (!response.ok) {
          setIsSubmitting(false)
          turnstileRef?.reset()
          setError(response.errorJsonOrThrow().message)
        }
        let { token } = response.ensureOk().jsonOrThrow()
        if (rememberMeRef!.checked) Cookies.set("token", token);
        setApi(new Api(token))
        navigate(redirectTo)
      }}
    >
      <div class="flex flex-col -space-y-px rounded-md shadow-sm box-border overflow-hidden gap-[3px]">
        <FormInput
          id="username"
          name="username"
          type="text"
          autocomplete="username"
          label="Username"
          ref={usernameRef!}
          required
        />
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
      </div>

      <div class="flex items-center">
        <input
          id="remember-me"
          name="remember-me"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-400 text-accent focus:ring-accent"
          checked
          ref={rememberMeRef!}
        />
        <label for="remember-me" class="ml-2 block text-sm">
          Remember me
        </label>
      </div>

      <Turnstile
        ref={turnstileRef!}
        sitekey={process.env.NODE_ENV === "production" ? "0x4AAAAAAACKrfJ6GCEBF1ih" : "1x00000000000000000000AA"}
        onVerify={token => console.debug(token)}
        autoResetOnExpire={true}
        class="self-center"
      />
    </Layout>
  )
}
