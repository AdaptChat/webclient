import {JSX, onCleanup, onMount, ParentProps, useContext} from "solid-js";
import Xmark from "../../components/icons/svg/Xmark";
import Icon from "../../components/icons/Icon";
import User from "../../components/icons/svg/User";
import Palette from "../../components/icons/svg/Palette";
import RightFromBracket from "../../components/icons/svg/RightFromBracket";
import SidebarButton from "../../components/ui/SidebarButton";
import tooltip from "../../directives/tooltip";
import {HeaderContext} from "../../components/ui/Header";
import {useNavigate} from "@solidjs/router";
import {previousPage} from "../../App";
void tooltip

export function generateSettingsLayout(sidebar: JSX.Element, children: JSX.Element) {
  const navigate = useNavigate()

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate(previousPage())
  }
  onMount(() => document.addEventListener('keydown', handleKeyDown))
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

  const [header] = useContext(HeaderContext)!

  return (
    <div class="w-full h-full flex">
      <div class="w-[max(16rem,calc(50vw-24rem))] flex justify-end bg-bg-0/70 backdrop-blur">
        <div class="flex flex-col px-2 pt-[clamp(1rem,3vh,4rem)] w-64 overflow-auto">
          {sidebar}
        </div>
      </div>
      <div class="h-full flex-grow max-w-5xl pt-[clamp(1rem,3vh,4rem)] px-2 overflow-auto">
        <h1 class="font-bold font-title text-xl pt-2 px-4">{header()[header().length - 1]}</h1>
        {children}
      </div>
      <div class="w-[max(0px,calc(50vw-40rem))] relative">
        <div class="absolute z-[9999] top-2 right-2 flex flex-col items-center p-2">
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

export default function Settings(props: ParentProps) {
  return generateSettingsLayout(
    <>
      <SettingsSection>User Settings</SettingsSection>
      <SidebarButton large href={["/settings/account", "/settings"]} svg={User}>
        Account
      </SidebarButton>

      <SettingsSection>Local Settings</SettingsSection>
      <SidebarButton large href="/settings/appearance" svg={Palette}>
        Appearance
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
    </>,
    props.children,
  )
}
