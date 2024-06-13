import {
  Accessor,
  createEffect,
  createUniqueId,
  JSX,
  onCleanup,
  onMount,
  ParentProps,
  useContext
} from "solid-js";
import Xmark from "../../components/icons/svg/Xmark";
import Icon from "../../components/icons/Icon";
import User from "../../components/icons/svg/User";
import Palette from "../../components/icons/svg/Palette";
import RightFromBracket from "../../components/icons/svg/RightFromBracket";
import SidebarButton from "../../components/ui/SidebarButton";
import tooltip from "../../directives/tooltip";
import {HeaderContext} from "../../components/ui/Header";
import {A, useBeforeLeave, useNavigate, useParams} from "@solidjs/router";
import {previousPage} from "../../App";
import {createMediaQuery} from "@solid-primitives/media";
import ChevronRight from "../../components/icons/svg/ChevronRight";
import ArrowUpRightFromSquare from "../../components/icons/svg/ArrowUpRightFromSquare";
import {ReactiveMap} from "@solid-primitives/map";
import {mapIterator} from "../../utils";
void tooltip

export interface Breadcrumb {
  name: string,
  root: (params: Record<string, string>) => string,
  init: string,
}

function Exit() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(previousPage())} class="group xl:hidden" use:tooltip="Exit Settings">
      <Icon icon={Xmark} class="fill-fg/70 w-5 h-5 transition group-hover:fill-fg/100"/>
    </button>
  )
}

export function generateSettingsRoot(breadcrumb: Breadcrumb, Sidebar: () => JSX.Element) {
  const isMobile = createMediaQuery("(max-width: 767px)")
  const navigate = useNavigate()
  const params = useParams()

  createEffect(() => {
    if (!isMobile()) navigate(breadcrumb.root(params) + breadcrumb.init)
  })

  return (
    <div class="flex flex-col w-full h-full overflow-auto p-4">
      <h1 class="flex justify-between font-bold font-title text-xl m-2">
        <span>{breadcrumb.name}</span>
        <Exit />
      </h1>
      <Sidebar />
    </div>
  )
}

type SaveTask = () => Promise<void>
interface SettingsContext {
  tasks: ReactiveMap<string, SaveTask>
  createTask: (task: SaveTask, onCancel?: () => any) => readonly [
    (v: boolean) => void,
    Accessor<string | undefined>
  ]
  saveAll: () => Promise<void>
  cancelAll: () => void
}

export function createSettingsContext(): SettingsContext {
  const cached = (window as any).$settingsContext
  if (cached) return cached

  const tasks = new ReactiveMap<string, SaveTask>()
  const errors = new ReactiveMap<string, string>()
  const cancelTasks: (() => any)[] = []

  const createTask = (task: SaveTask, onCancel?: () => any) => {
    const id = createUniqueId()
    if (onCancel) cancelTasks.push(onCancel)

    return [
      (v: boolean) => { v ? tasks.set(id, task) : tasks.delete(id) },
      () => errors.get(id)
    ] as const
  }
  const saveAll = async () => {
    await Promise.all(mapIterator(tasks.entries(), ([id, task]) => (
      task()
        .then(() => errors.delete(id))
        .catch((e) => errors.set(id, e.message))
        .finally(() => tasks.delete(id))
    )))
    cancelTasks.length = 0
  }
  const cancelAll = () => {
    tasks.clear()
    for (const cancel of cancelTasks) cancel()
  }

  return { tasks, createTask, saveAll, cancelAll }
}

export const settingsContext = createSettingsContext();
(window as any).$settingsContext = settingsContext

export function useSaveTask(task: SaveTask, onCancel?: () => any) {
  return settingsContext?.createTask(task, onCancel)
}

function SaveChanges() {
  const { tasks, saveAll, cancelAll } = settingsContext
  const saveHandler = (event: MouseEvent) => {
    const target = event.target as HTMLButtonElement
    target.disabled = true
    saveAll().finally(() => target.disabled = false)
  }

  let ref: HTMLDivElement | null = null
  useBeforeLeave((e) => {
    if (e.to.toString() == previousPage() && tasks.size > 0) {
      e.preventDefault()
      ref!.style.animation = "alert-unsaved 1s"
      setTimeout(() => ref!.style.animation = "", 1000)
    }
  })

  return (
    <div
      ref={ref!}
      class="flex justify-between items-center bg-bg-0/70 backdrop-blur p-3 bottom-0 absolute
        left-[max(14rem,calc(50vw-23rem))] mobile:left-0 right-0 z-[9999] transition-opacity"
      classList={{
        "opacity-100": tasks.size > 0,
        "opacity-0 pointer-events-none": tasks.size === 0,
      }}
    >
      <span class="font-title text-lg font-bold mx-4">Save Changes?</span>
      <div class="grid grid-cols-2">
        <button class="btn btn-ghost" onClick={cancelAll}>Cancel</button>
        <button class="btn btn-success" onClick={saveHandler}>Save</button>
      </div>
    </div>
  )
}

type SettingsLayoutProps = { breadcrumb: Breadcrumb, Sidebar: () => JSX.Element }
export function SettingsLayout({ breadcrumb, Sidebar, children }: ParentProps<SettingsLayoutProps>) {
  const navigate = useNavigate()
  const params = useParams()

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate(previousPage())
  }
  onMount(() => document.addEventListener('keydown', handleKeyDown))
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

  const isMobile = createMediaQuery("(max-width: 767px)")
  const [header] = useContext(HeaderContext)!
  const { tasks } = settingsContext

  return (
    <div class="w-full h-full flex relative">
      <div classList={{
        "flex justify-end bg-bg-0/60 backdrop-blur": true,
        "mobile:transition-all mobile:duration-300": true,
        "w-[max(14rem,calc(50vw-23rem))] mobile:w-full": !isMobile(),
        "overflow-hidden w-0": isMobile(),
      }}>
        <div class="flex flex-col px-2 pt-4 xl:pt-[clamp(1rem,3vh,4rem)] w-56 overflow-auto">
          <Sidebar />
        </div>
      </div>
      <div
        class="h-full flex-grow max-w-[60rem] pt-4 xl:pt-[clamp(1rem,3vh,4rem)] px-2 overflow-auto hide-scrollbar"
        classList={{ "pb-14": tasks.size > 0 }}
      >
        <h1 class="flex items-center justify-between pt-2 px-4">
          <span class="font-bold font-title text-xl flex items-center">
            <A
              href={breadcrumb.root(params)}
              class="select-none opacity-50 md:hidden flex hover:underline hover:underline-offset-2 items-center"
            >
              <span>{breadcrumb.name}</span>
              <Icon icon={ChevronRight} class="fill-fg w-5 h-5 mr-1.5" />
            </A>
            {header()[header().length - 1]}
          </span>
          <Exit />
        </h1>
        <SaveChanges />
        {children}
      </div>
      <div class="w-[max(0px,calc(50vw-37rem))] relative">
        <div class="hidden xl:flex absolute z-[9999] top-[clamp(1rem,3vh,4rem)] xl:right-4 2xl:left-4 flex-col items-center p-2">
          <button
            onClick={() => navigate(previousPage())}
            class="rounded-full group hover:bg-fg/20 transition border-2 border-fg/20 w-12 h-12 flex items-center justify-center"
            use:tooltip="Exit Settings"
          >
            <Icon icon={Xmark} class="fill-fg/70 w-5 h-5 transition group-hover:fill-fg/100" />
          </button>
          <span class="font-title text-sm text-fg/50 mt-1">ESC</span>
        </div>
      </div>
    </div>
  )
}

export function SettingsSection(props: ParentProps) {
  return (
    <div class="select-none mt-1.5 text-sm font-title px-2 py-2 text-fg/50">
      {props.children}
    </div>
  )
}

export function generateSettingsComponents(breadcrumb: Breadcrumb, sidebar: () => JSX.Element) {
  return [
    function Root() {
      return generateSettingsRoot(breadcrumb, sidebar)
    },
    function Body(props: ParentProps) {
      return (
        <SettingsLayout breadcrumb={breadcrumb} Sidebar={sidebar}>
          {props.children}
        </SettingsLayout>
      )
    },
  ]
}

function SettingsSidebar() {
  return (
    <>
      <SettingsSection>User Settings</SettingsSection>
      <SidebarButton large href="/settings/account" svg={User}>
        Account
      </SidebarButton>

      <SettingsSection>Client</SettingsSection>
      <SidebarButton large href="/settings/appearance" svg={Palette}>
        Themes
      </SidebarButton>

      <div class="bg-fg/10 h-[1px] mx-2 my-2"/>
      <SidebarButton
        large
        svg={RightFromBracket}
        danger
        onClick={() => {
          window.localStorage.clear()
          window.location.pathname = '/'
        }}
      >
        Log Out
      </SidebarButton>

      <div class="h-4" />
      <p class="text-fg/30 flex flex-col text-sm font-light p-2">
        <span>
          <a
            href="//github.com/adaptchat/webclient"
            class="cursor-pointer hover:text-fg/70 underline underline-offset-2"
          >
            AdaptChat/webclient
          </a> v{APP_VERSION}
        </span>
        <a
          class="flex items-center cursor-pointer group hover:text-fg/70 hover:underline underline-offset-2"
          href="//github.com/adaptchat/webclient/issues/new"
        >
          Report an issue
          <Icon icon={ArrowUpRightFromSquare} class="w-3 h-3 fill-fg/30 group-hover:fill-fg/70 ml-1.5" />
        </a>
      </p>
    </>
  )
}

export const [SettingsRoot, Settings] = generateSettingsComponents(
  { name: "Settings", root: () => "/settings", init: "/account" },
  SettingsSidebar,
)
