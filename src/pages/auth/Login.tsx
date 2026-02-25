import Layout, {FormInput, FormSubmit} from "./Layout";
import Api, {setApi} from "../../api/Api";
import {LoginResponse} from "../../types/auth";
import {createSignal} from "solid-js";
import {useLocation, useNavigate} from "@solidjs/router";
import {t} from "../../i18n";

export default function Login() {
  let emailRef: HTMLInputElement | null = null
  let passwordRef: HTMLInputElement | null = null
  let rememberMeRef: HTMLInputElement | null = null

  let [error, setError] = createSignal<string>()
  let [isSubmitting, setIsSubmitting] = createSignal(false)

  const redirectTo = useLocation<{ redirectTo: string }>().state?.redirectTo ?? "/"
  const navigate = useNavigate()

  return (
    <Layout
      title={t('auth.login.title')}
      error={error()}
      switchScreenCondition={t('auth.login.no_account')}
      switchScreenLabel={t('auth.login.sign_up')}
      switchScreenHref="/register"
      redirectTo={redirectTo}
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
          return
        }
        let { token } = response.ensureOk().jsonOrThrow()
        if (rememberMeRef!.checked) localStorage.setItem("token", token);
        navigate(redirectTo)
        setApi(new Api(token))
      }}
    >
      <div class="flex flex-col -space-y-px rounded-md shadow-sm box-border overflow-hidden gap-[3px]">
        <FormInput
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          label={t('auth.login.email')}
          ref={emailRef!}
          required
        />
        <FormInput
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          label={t('auth.login.password')}
          ref={passwordRef!}
          required
        />
      </div>

      <div class="flex items-center justify-between mobile-xs:flex-col mobile-xs:gap-y-2 mt-4">
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
            {t('auth.login.remember_me')}
          </label>
        </div>

        <div class="text-sm">
          <a href="#" class="font-medium text-link text-opacity-80 hover:text-opacity-100 transition-all">
            {t('auth.login.forgot_password')}
          </a>
        </div>
      </div>

      <FormSubmit disabled={isSubmitting()}>
        {t(isSubmitting() ? "auth.login.submitting" : "auth.login.submit")}
      </FormSubmit>
    </Layout>
  )
}