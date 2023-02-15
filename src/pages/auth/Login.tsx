import Layout, {FormInput} from "./Layout";
import Api, {setApi} from "../../api/Api";
import {LoginResponse} from "../../types/auth";
import {createSignal} from "solid-js";
import Cookies from "js-cookie";
import {useNavigate} from "@solidjs/router";

export default function Login() {
  let emailRef: HTMLInputElement | null = null
  let passwordRef: HTMLInputElement | null = null
  let rememberMeRef: HTMLInputElement | null = null

  let [error, setError] = createSignal<string>()
  let [isSubmitting, setIsSubmitting] = createSignal(false)
  const navigate = useNavigate()

  return (
    <Layout
      title="Sign in to your account"
      error={error()}
      switchScreenCondition="Don't have an account?"
      switchScreenLabel="Sign up"
      switchScreenHref="/register"
      submitLabel="Sign in"
      submitLabelProgressive="Signing in..."
      isSubmitting={isSubmitting()}
      onSubmit={async () => {
        setIsSubmitting(true)
        const email = emailRef!.value
        const password = passwordRef!.value

        let response = await Api.requestNoAuth<LoginResponse>('POST', '/login', {
          json: { email, password },
        })

        if (!response.ok) {
          setIsSubmitting(false)
          setError(response.errorJsonOrThrow().message)
        }
        let { token } = response.ensureOk().jsonOrThrow()
        if (rememberMeRef!.checked) Cookies.set("token", token);
        setApi(new Api(token))
        navigate("/")
      }}
    >
      <div class="flex flex-col -space-y-px rounded-md shadow-sm box-border overflow-hidden gap-[3px]">
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
          autocomplete="current-password"
          label="Password"
          ref={passwordRef!}
          required
        />
      </div>

      <div class="flex items-center justify-between mobile-xs:flex-col mobile-xs:gap-y-2">
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

        <div class="text-sm">
          <a href="#" class="font-medium text-link text-opacity-80 hover:text-opacity-100 transition-all">
            Forgot your password?
          </a>
        </div>
      </div>
    </Layout>
  )
}