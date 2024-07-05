import Header from "../../../components/ui/Header";
import EditableAvatar, {promptImageUpload} from "../../../components/settings/EditableAvatar";
import {createEffect, createMemo, createSignal, createUniqueId, on, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {acronym} from "../../../utils";
import {AccountField, EditingState, SaveCancel} from "../../settings/Account";
import {useSaveTask} from "../../settings/SettingsLayout";
import Icon from "../../../components/icons/Icon";
import ArrowUpFromBracket from "../../../components/icons/svg/ArrowUpFromBracket";

export default function Overview() {
  const api = getApi()!
  const params = useParams()
  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)

  const [editing, setEditing] = createSignal(EditingState.NotEditing)

  const formId = createUniqueId()
  let nameInputRef: HTMLInputElement | null = null
  let descriptionInputRef: HTMLInputElement | null = null

  let initial = {
    name: false,
    description: false,
    icon: false,
  }
  const [changed, setChanged] = createSignal(initial)
  const updateChanged = () => setChanged({
    name: nameInputRef!.value !== guild().name,
    description: descriptionInputRef!.value !== guild().description,
    icon: iconData() !== undefined,
  })
  const anyChanged = () => Object.values(changed()).some(Boolean)

  const [iconData, setIconData] = createSignal<string | null | undefined>(undefined)
  const previewIcon = createMemo(() => iconData() === undefined ? guild().icon : iconData() as string)

  createEffect(on(iconData, (data) => {
    if (data === undefined) return
    setEditing(EditingState.Editing)
    updateChanged()
  }))

  const [error, setError] = createSignal<string>("")
  const onSubmit = async (e: Event) => {
    e.preventDefault()
    if (!anyChanged() || editing() !== EditingState.Editing) return

    const diff = changed()
    const json: Record<string, any> = {}

    if (diff.name) json.name = nameInputRef!.value
    if (diff.description) json.description = descriptionInputRef!.value
    if (diff.icon) json.icon = iconData()

    setEditing(EditingState.Saving)
    const response = await api.request('PATCH', `/guilds/${guildId()}`, { json })
    if (!response.ok)
      setError(response.errorJsonOrThrow().message)

    setEditing(EditingState.NotEditing)
  }

  const [bannerData, setBannerData] = createSignal<string | null | undefined>(undefined)
  const previewBanner = createMemo(() => bannerData() === undefined ? guild().banner : bannerData() as string)

  const [setEdited] = useSaveTask(
    async () => {
      const json: Record<string, any> = {}
      if (bannerData() !== undefined) json.banner = bannerData()

      const response = await api.request('PATCH', `/guilds/${guildId()}`, { json })
      if (!response.ok)
        setError(response.errorJsonOrThrow().message)
    },
    () => {
      setBannerData(undefined)
    }
  )
  createEffect(() => setEdited(bannerData() !== undefined))

  return (
    <div class="px-2 py-4">
      <Header>Overview</Header>
      <div class="flex flex-col rounded-xl overflow-hidden">
        <div class="flex items-start gap-x-4 bg-bg-1/80 p-4 relative">
          <div class="inline-flex flex-col">
            <EditableAvatar setImageData={setIconData}>
              <Show when={previewIcon()} fallback={
                <div class="w-16 h-16 rounded-full bg-neutral flex items-center justify-center">
                  {acronym(guild().name)}
                </div>
              }>
                <img src={previewIcon()} alt="" class="rounded-full w-16 h-16" />
              </Show>
            </EditableAvatar>
            <button
              type="button"
              class="text-sm text-fg text-opacity-60 hover:text-opacity-100 transition"
              onClick={() => setIconData(null)}
            >
              {previewIcon() ? 'Remove' : ''}
            </button>
          </div>
          <form onSubmit={onSubmit} id={formId} class="flex-grow">
            <AccountField
              ref={nameInputRef}
              name="name"
              label="Server Name"
              value={guild().name}
              placeholder="Server Name"
              required={true}
              editing={editing()}
              tailwind="mt-1"
              inputTailwind="text-lg font-title"
              onInput={updateChanged}
            />
            <AccountField
              ref={descriptionInputRef}
              name="description"
              label="Brief Description"
              value={guild().description ?? ''}
              placeholder={editing() === EditingState.Editing ? 'Enter description here...' : 'No description yet!'}
              required={false}
              editing={editing()}
              tailwind="mt-3 [input]:text-sm"
              inputTailwind="text-base"
              minLength={0}
              maxLength={1024}
              onInput={updateChanged}
            />
          </form>
          <SaveCancel
            editing={editing}
            setEditing={setEditing}
            anyChanged={anyChanged}
            formId={formId}
            onCancel={() => {
              setChanged({...initial})
              setError("")

              nameInputRef!.value = guild().name
              descriptionInputRef!.value = guild().description ?? ""
              setIconData(undefined)
            }}
          />
        </div>
        <Show when={error()}>
          <p class="p-3 text-sm bg-danger/20 text-danger w-full">{error()}</p>
        </Show>
      </div>

      <div class="flex justify-between mt-6 ml-2 gap-x-4 mobile:flex-col mobile:gap-y-2">
        <div class="flex flex-col items-start mobile:flex-row mobile:items-center mobile:justify-between gap-y-1">
          <div class="flex flex-col gap-y-1">
            <h3 class="font-light font-title text-lg">Banner</h3>
            <p class="font-light text-sm text-fg/70">
              This will be shown at the top of the channel sidebar.
            </p>
          </div>
          <div class="flex mt-2 mobile:flex-col">
            <button class="btn btn-primary" onClick={() => promptImageUpload(setBannerData)}>
              <Icon icon={ArrowUpFromBracket} class="w-4 h-4 fill-current mr-1" />
              Upload Banner
            </button>
            <Show when={previewBanner()}>
              <button class="btn btn-ghost mobile:btn-sm" onClick={() => setBannerData(null)}>
                Remove Banner
              </button>
            </Show>
          </div>
        </div>

        <div
          class="my-1 flex-shrink-0 rounded-xl w-1/3 mobile:w-full min-w-[150px] overflow-hidden cursor-pointer group"
          onClick={() => promptImageUpload(setBannerData)}
        >
          <Show when={previewBanner()} fallback={
            <div
              class="flex flex-col gap-y-2 aspect-video border-2 border-dashed rounded-xl border-fg/50 items-center justify-center"
            >
              <Icon icon={ArrowUpFromBracket} class="w-5 h-5 fill-fg/50 group-hover:fill-fg/100 transition" />
              <span class="text-sm font-medium text-fg text-opacity-50 group-hover:text-opacity-100 transition">
                Upload
              </span>
            </div>
          }>
            <figure
              class="aspect-video"
              style={{
                "background-image": `url(${previewBanner()})`,
                "background-size": "cover",
                "background-position": "center",
              }}
            />
          </Show>
        </div>
      </div>


    </div>
  )
}
