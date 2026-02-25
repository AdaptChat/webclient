import {ModalTemplate, useModal} from "../ui/Modal";
import {createSignal, Show} from "solid-js";
import Icon from "../icons/Icon";
import Plus from "../icons/svg/Plus";
import {getApi} from "../../api/Api";
import {useNavigate} from "@solidjs/router";
import {t} from "../../i18n";
import ColorPicker from "../ui/ColorPicker";

interface Props {
  guildId: bigint
}

export default function CreateRoleModal(props: Props) {
  const {hideModal} = useModal()
  const [currentName, setCurrentName] = createSignal<string>("")
  const [currentColor, setCurrentColor] = createSignal<string | null>(null)

  const api = getApi()!
  const [error, setError] = createSignal<string>("")
  const [submitting, setSubmitting] = createSignal(false)

  const navigate = useNavigate()

  const onSubmit = async (e: Event) => {
    e.preventDefault()

    const color = currentColor()
    const name = currentName()!
    const json: Record<string, any> = { name }

    if (color != null)
      json.color = { type: 'solid', color: parseInt(color.slice(1), 16) }

    setSubmitting(true)
    const response = await api.request('POST', `/guilds/${props.guildId}/roles`, { json })
    setSubmitting(false)

    if (response.ok) {
      hideModal()
      navigate(`/guilds/${props.guildId}/settings/roles/${response.jsonOrThrow().id}`)
    } else
      setError(response.errorJsonOrThrow().message)
  }

  return (
    <ModalTemplate title={t("modals.create_role.title")}>
      <form onSubmit={onSubmit} class="flex flex-col gap-y-2 pt-6">
        <div class="flex items-center gap-x-2">
          <ColorPicker
            nullable
            color={currentColor()}
            onChange={setCurrentColor}
            placement="right"
            title={t('settings.guild.roles.role.pick_color')}
            removeLabel={t('settings.guild.roles.role.remove_color')}
          />
          <div class="flex flex-col flex-grow gap-y-1">
            <label class="text-fg/60 text-xs font-bold uppercase">
              {t("modals.create_role.name_label")}
            </label>
            <input
              type="text"
              class="input flex-grow"
              placeholder={t("modals.create_role.name_placeholder")}
              minLength={2}
              maxLength={32}
              required={true}
              value={currentName()}
              onInput={(e) => {
                setCurrentName(e.currentTarget.value)
                setError('')
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          class="btn btn-primary flex-grow disabled:bg-accent/50 disabled:text-opacity-50"
          disabled={!currentName() || submitting()}
        >
          <Icon icon={Plus} class="fill-fg w-4 h-4 mr-2" />
          <span>{t("modals.create_role.title")}</span>
        </button>
      </form>
      <Show when={error()}>
        <div class="text-red-600 mt-2">{error()}</div>
      </Show>
    </ModalTemplate>
  )
}
