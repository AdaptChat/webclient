import {ModalTemplate, useModal} from "../ui/Modal";
import Icon from "../icons/Icon";
import Envelope from "../icons/svg/Envelope";
import Check from "../icons/svg/Check";
import {createSignal, Match, Show, Switch} from "solid-js";
import {getApi} from "../../api/Api";
import {UserFlags} from "../../api/Bitflags";
import {t, tJsx} from '../../i18n'

const t_ = (path: string) => t('modals.verify_email.' + path)

const enum Step {
  Confirm,
  NewEmail,
  Sending,
  Code,
}

export default function EmailVerificationModal() {
  const api = getApi()!
  const {hideModal} = useModal()
  const clientUser = () => api.cache!.clientUser!
  const isVerified = () => UserFlags.fromValue(clientUser().flags).has('VERIFIED')

  const [step, setStep] = createSignal<Step>(isVerified() ? Step.NewEmail : Step.Confirm)
  const [error, setError] = createSignal('')
  const [submitting, setSubmitting] = createSignal(false)

  const [newEmail, setNewEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [code, setCode] = createSignal('')
  // the email we actually sent the code to
  const [sentTo, setSentTo] = createSignal<string | null>(null)

  const clearError = () => setError('')

  // setSentTo((clientUser().email) ?? null)
  // setStep(Step.Code)

  const requestVerification = async (overrideEmail?: string) => {
    setSubmitting(true)
    clearError()

    const json: Record<string, string> = {}
    const target = overrideEmail ?? newEmail()
    if (target) {
      json.new_email = target
      if (password()) json.password = password()
    }

    const response = await api.request('POST', '/auth/verify', {
      json: Object.keys(json).length ? json : undefined as any,
    })
    setSubmitting(false)

    if (!response.ok) {
      setError(response.errorJsonOrThrow().message)
      return false
    }

    setSentTo((target || clientUser().email) ?? null)
    setStep(Step.Code)
    return true
  }

  const handleEmailCorrect = () => requestVerification()

  const handleNewEmailSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    await requestVerification(newEmail())
  }

  const handleCodeSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setSubmitting(true)
    clearError()

    const response = await api.request('POST', '/auth/verify/followup', {
      json: { code: code() },
    })
    setSubmitting(false)

    if (!response.ok) {
      setError(response.errorJsonOrThrow().message)
      return
    }

    api.cache?.updateClientUser({
      email: sentTo() ?? undefined,
      flags: Number(UserFlags.fromValue(clientUser().flags).add('VERIFIED').value),
    })
    hideModal()
  }

  return (
    <ModalTemplate title={t_(isVerified() ? 'title.change' : 'title.verify')}>
      <div class="min-w-[320px]">
        <Switch>
          <Match when={step() === Step.Confirm}>
            <p class="text-sm text-center text-fg/60 mt-2 mb-2">
              {t_('confirm.description')}
            </p>
            <div class="bg-bg-0/60 rounded-lg p-4 font-mono text-center font-medium mb-2">
              {clientUser().email}
            </div>
            <Show when={error()}>
              <p class="text-sm text-danger mb-3">{error()}</p>
            </Show>
            <div class="flex gap-x-3">
              <button
                class="btn btn-neutral flex-1"
                onClick={() => { clearError(); setStep(Step.NewEmail) }}
              >
                {t_("confirm.deny")}
              </button>
              <button
                class="btn btn-primary flex-1"
                disabled={submitting()}
                onClick={handleEmailCorrect}
              >
                <Icon icon={Envelope} class="w-4 h-4 fill-fg mr-2" />
                <Show when={submitting()} fallback={t_("confirm.accept")}>
                  {t_("confirm.submitting")}
                </Show>
              </button>
            </div>
          </Match>

          <Match when={step() === Step.NewEmail}>
            <p class="text-sm text-center text-fg/60 mt-2 mb-5">
              {t_(isVerified() ? 'new_email.description_change' : 'new_email.description_verify')}
            </p>
            <form onSubmit={handleNewEmailSubmit} class="flex flex-col gap-y-3">
              <div>
                <label class="text-sm font-bold uppercase text-fg/50 mx-1 mb-1 block">
                  {t_("new_email.label")}
                </label>
                <input
                  type="email"
                  class="w-full bg-0 rounded-lg text-sm font-medium p-3 outline-none focus:ring-2 ring-accent"
                  placeholder="example@adapt.chat"
                  required
                  value={newEmail()}
                  onInput={e => { clearError(); setNewEmail(e.currentTarget.value) }}
                />
              </div>
              <Show when={isVerified()}>
                <div>
                  <label class="text-sm font-bold uppercase text-fg/50 mx-1 mb-1 block">
                    {t_("new_email.current_password")}
                  </label>
                  <input
                    type="password"
                    class="w-full bg-0 rounded-lg text-sm font-medium p-3 outline-none focus:ring-2 ring-accent"
                    autocomplete="current-password"
                    required
                    value={password()}
                    onInput={e => { clearError(); setPassword(e.currentTarget.value) }}
                  />
                </div>
              </Show>
              <Show when={error()}>
                <p class="text-sm text-danger">{error()}</p>
              </Show>
              <div class="flex gap-x-3">
                <Show when={!isVerified()}>
                  <button
                    type="button"
                    class="btn btn-neutral flex-1"
                    onClick={() => { clearError(); setStep(Step.Confirm) }}
                  >
                    {t('generic.back')}
                  </button>
                </Show>
                <button
                  type="submit"
                  class="btn btn-primary flex-1"
                  disabled={submitting()}
                >
                  <Icon icon={Envelope} class="w-4 h-4 fill-fg mr-2" />
                  <Show when={submitting()} fallback={t_("new_email.submit")}>
                    {t_("confirm.submitting")}
                  </Show>
                </button>
              </div>
            </form>
          </Match>

          <Match when={step() === Step.Code}>
            <p class="text-sm text-center text-fg/60 mt-2 mb-2">
              {tJsx('modals.verify_email.code.description', {
                recipient: <span class="text-sm text-center font-medium mb-5">{sentTo()}</span>,
              })}
            </p>
            <form onSubmit={handleCodeSubmit} class="flex flex-col gap-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                class="w-full bg-0 rounded-lg text-2xl font-mono font-bold tracking-[0.5em] text-center p-3 outline-none focus:ring-2 ring-accent"
                placeholder="000000"
                maxLength={6}
                required
                value={code()}
                onInput={e => {
                  const digits = e.currentTarget.value.replace(/\D/g, '')
                  e.currentTarget.value = digits
                  clearError()
                  setCode(digits)
                }}
              />
              <Show when={error()}>
                <p class="text-sm text-danger">{error()}</p>
              </Show>
              <div class="flex gap-x-3">
                <button
                  type="button"
                  class="btn btn-ghost"
                  onClick={() => {
                    clearError()
                    setCode('')
                    setStep(isVerified() ? Step.NewEmail : Step.Confirm)
                  }}
                >
                  {t('generic.back')}
                </button>
                <button
                  type="submit"
                  class="btn btn-primary flex-1"
                  disabled={submitting() || code().length !== 6}
                >
                  <Icon icon={Check} class="w-4 h-4 fill-fg mr-2" />
                  <Show when={submitting()} fallback={t_('code.submit')}>
                    {t_('code.submitting')}
                  </Show>
                </button>
              </div>
            </form>
            {/* 
              Leaving this out for now because of the 60s ratelimit

              <button
                class="text-xs text-fg/40 hover:text-fg/70 transition mt-3 w-full text-center"
                onClick={() => {
                  clearError()
                  // re-send to same address
                  const target = sentTo() !== clientUser().email ? sentTo()! : undefined
                  requestVerification(target ?? undefined)
                }}
              >
                Didn't receive a code? Resend
              </button> 
            */}
          </Match>
        </Switch>
      </div>
    </ModalTemplate>
  )
}
