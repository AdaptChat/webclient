import {createEffect, createSignal, JSX, onCleanup, onMount, ParentProps, Show, useContext} from "solid-js";
import Xmark from "../../components/icons/svg/Xmark";
import Icon from "../../components/icons/Icon";
import User from "../../components/icons/svg/User";
import Palette from "../../components/icons/svg/Palette";
import RightFromBracket from "../../components/icons/svg/RightFromBracket";
import SidebarButton from "../../components/ui/SidebarButton";
import tooltip from "../../directives/tooltip";
import {HeaderContext} from "../../components/ui/Header";
import {A, useNavigate} from "@solidjs/router";
import {previousPage} from "../../App";
import {createMediaQuery} from "@solid-primitives/media";
import ChevronRight from "../../components/icons/svg/ChevronRight";
void tooltip

export interface Breadcrumb {
  name: string,
  root: string,
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

export function generateSettingsRoot(breadcrumb: Breadcrumb, sidebar: JSX.Element) {
  const isMobile = createMediaQuery("(max-width: 767px)")
  const navigate = useNavigate()

  createEffect(() => {
    if (!isMobile()) navigate(breadcrumb.root + breadcrumb.init)
  })

  return (
    <div class="flex flex-col w-full h-full overflow-auto p-4">
      <h1 class="flex justify-between font-bold font-title text-xl m-2">
        <span>{breadcrumb.name}</span>
        <Exit />
      </h1>
      {sidebar}
    </div>
  )
}

export function generateSettingsLayout(breadcrumb: Breadcrumb, sidebar: JSX.Element, children: JSX.Element) {
  const navigate = useNavigate()

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate(previousPage())
  }
  onMount(() => document.addEventListener('keydown', handleKeyDown))
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

  const isMobile = createMediaQuery("(max-width: 767px)")
  const [header] = useContext(HeaderContext)!

  return (
    <div class="w-full h-full flex">
      <div classList={{
        "flex justify-end bg-bg-0/70 backdrop-blur": true,
        "mobile:transition-all mobile:duration-300": true,
        "w-[max(14rem,calc(50vw-23rem))] mobile:w-full": !isMobile(),
        "overflow-hidden w-0": isMobile(),
      }}>
        <div class="flex flex-col px-2 pt-4 xl:pt-[clamp(1rem,3vh,4rem)] w-56 overflow-auto">
          {sidebar}
        </div>
      </div>
      <div class="h-full flex-grow max-w-[60rem] pt-4 xl:pt-[clamp(1rem,3vh,4rem)] px-2 overflow-auto hide-scrollbar">
        <h1 class="flex items-center justify-between pt-2 px-4">
          <span class="font-bold font-title text-xl flex items-center">
            <A href={breadcrumb.root} class="select-none opacity-50 md:hidden flex hover:underline hover:underline-offset-2 items-center">
              <span>{breadcrumb.name}</span>
              <Icon icon={ChevronRight} class="fill-fg w-5 h-5 mr-1.5" />
            </A>
            {header()[header().length - 1]}
          </span>
          <Exit />
        </h1>
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
    () => generateSettingsRoot(breadcrumb, sidebar()),
    (props: ParentProps) => generateSettingsLayout(breadcrumb, sidebar(), props.children),
  ]
}

export const [SettingsRoot, Settings] = generateSettingsComponents(
  { name: "Settings", root: "/settings", init: "/account" },
  () => (
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
      <p class="text-fg/30 text-sm font-light p-2">
        <a href="//github.com/adaptchat/webclient" class="cursor-pointer underline underline-offset-2">
          AdaptChat/webclient
        </a> v{APP_VERSION}
      </p>
    </>
  )
)
