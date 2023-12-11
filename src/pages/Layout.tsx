import {createEffect, createMemo, createSignal, For, JSX, onMount, ParentProps, Show} from "solid-js";
import {useLocation, useNavigate} from "@solidjs/router";
import {createMediaQuery} from "@solid-primitives/media";
import {toast} from "solid-toast";

import {getApi} from "../api/Api";
import tooltip from "../directives/tooltip";
import {displayName, noop} from "../utils";
noop(tooltip)

import GuildSideSelect from "../components/guilds/GuildSideSelect";
import StatusIndicator from "../components/users/StatusIndicator";

import Icon, {IconElement} from "../components/icons/Icon";
import ChevronLeft from "../components/icons/svg/ChevronLeft";
import ChevronRight from "../components/icons/svg/ChevronRight";
import HomeIcon from "../components/icons/svg/Home";
import UsersIcon from "../components/icons/svg/Users";
import ServerIcon from "../components/icons/svg/Server";
import GearIcon from "../components/icons/svg/Gear";

type BottomNavProps = { href: string, icon: IconElement, alt: string, check: (pathname: string) => boolean }

function BottomNav({ href, icon, alt, check }: BottomNavProps) {
  const route = useLocation()
  const navigate = useNavigate()

  return (
    <a
      classList={{
        "flex-grow flex items-center justify-center group bg-0 hover:bg-3 transition text-fg border-box border-t-2 cursor-pointer": true,
        "border-fg": check(route.pathname),
        "border-transparent": !check(route.pathname),
      }}
      onClick={() => navigate(href)}
      use:tooltip={{ content: alt, placement: 'top' }}
    >
      <Icon icon={icon} title={alt} class="select-none w-5 h-5 fill-fg opacity-70 group-hover:opacity-100" />
    </a>
  )
}

export interface LayoutProps {
  sidebar?: () => JSX.Element,
  rightSidebar?: () => JSX.Element,
  title?: string,
  topNav?: () => JSX.Element,
  hideGuildSelect?: boolean,
  showBottomNav?: boolean,
  actionButtons?: { icon: IconElement, alt: string, onClick: () => any }[],
}

export const [showSidebar, setShowSidebar] = createSignal(true)
export const [showRightSidebar, setShowRightSidebar] = createSignal(true)

export default function Layout(props: ParentProps<LayoutProps>) {
  const api = getApi()!
  const clientUser = () => api.cache!.clientUser!
  const isMobile = createMediaQuery("(max-width: 768px)")

  onMount(() => {
    if (isMobile()) {
      setShowSidebar(false)
      setShowRightSidebar(false)
    }
  })

  createEffect(() => {
    if (isMobile()) {
      if (showSidebar()) setShowRightSidebar(false)
      if (showRightSidebar()) setShowSidebar(false)
    }
  })

  const sidebar = createMemo(() => props.sidebar && showSidebar())
  const rightSidebar = createMemo(() => props.rightSidebar && showRightSidebar())
  const showBottomNav = createMemo(() => props.showBottomNav || sidebar())

  return (
    <div class="w-full h-full overflow-hidden">
      <div classList={{
        "flex flex-grow w-full h-full": true,
        "mobile:h-[calc(100%-4rem)]": showBottomNav(),
      }}>
        <Show when={!props.hideGuildSelect} keyed={false}>
          <GuildSideSelect />
        </Show>
        <Show when={sidebar()} keyed={false}>
          <div classList={{
            "flex flex-col justify-between bg-1 h-full mobile:w-[calc(100%-3rem)]": true,
            "w-[19rem]": props.hideGuildSelect,
            "w-60": !props.hideGuildSelect,
          }}>
            <div class="flex flex-col w-full h-full overflow-y-auto">
              {props.sidebar!()}
            </div>
            <div class="flex items-center bg-0 rounded-lg m-4 pr-2">
              <div class="indicator w-10 h-10">
                <StatusIndicator status={api.cache!.presences.get(clientUser().id)!.status} tailwind="m-[0.1rem]" indicator />
                <img src={api.cache!.clientAvatar} alt="" class="w-10 h-10 rounded-lg" />
              </div>
              <div
                class="w-[calc(100%-3rem)] flex flex-col ml-2 font-medium overflow-ellipsis overflow-hidden cursor-pointer"
                onClick={() => toast.promise(
                  navigator.clipboard.writeText(clientUser().username),
                  {
                    loading: "Copying username...",
                    success: "Copied to your clipboard!",
                    error: "Failed to copy username, try again later.",
                  }
                )}
              >
                <div class="text-sm">{displayName(clientUser())}</div>
                <Show when={clientUser().display_name}>
                  <span class="text-fg/50 text-xs">{clientUser().username}</span>
                </Show>
              </div>
            </div>
          </div>
        </Show>
        <div
          classList={{
            "hidden flex-grow items-center justify-center bg-transparent hover:bg-3 transition-all duration-300 cursor-pointer": true,
            "mobile:flex": sidebar(),
          }}
          onClick={() => setShowSidebar(false)}
        >
          <Icon icon={ChevronLeft} class="fa-xs opacity-50 fill-fg w-5 h-5" title="Collapse Sidebar" />
        </div>
        <div classList={{
          "flex flex-col items-center": true,
          "w-[calc(100%-19rem)]": sidebar() || rightSidebar(), // 4rem (guild sidebar) + 15rem (large sidebar)
          "w-[calc(100%-4rem)] mobile:w-full": !sidebar() && !props.hideGuildSelect, // 4rem (guild sidebar)
          "w-full": !sidebar() && props.hideGuildSelect,
          "mobile:hidden": sidebar(),
        }}>
          {props.title && (
            <div classList={{
              "flex items-center justify-between w-full bg-0": true,
              "mobile:hidden": sidebar(),
            }}>
              <div class="flex items-center pl-4 h-14 mobile:overflow-x-auto mobile:hide-scrollbar">
                <button onClick={() => setShowSidebar(prev => !prev)}>
                  <Icon
                    icon={showSidebar() ? ChevronLeft : ChevronRight}
                    title={showSidebar() ? "Collapse Sidebar" : "Show Sidebar"}
                    class={
                      "fill-fg select-none w-5 h-5 opacity-30 hover:opacity-60 transition-opacity"
                        + " duration-300 z-[9999] mr-3"
                    }
                  />
                </button>
                <span class="font-bold font-title">
                  {props.title}
                </span>
                {props.topNav && (
                  <>
                    <div class="bg-fg/10 w-0.5 h-[60%] mx-4 rounded-full" />
                    <div class="flex items-center gap-x-4 mobile-xs:gap-x-2">
                      {props.topNav!()}
                    </div>
                  </>
                )}
              </div>
              <div class="flex items-center p-4 gap-x-4">
                {/* TODO: merge the member icon into actionButtons */}
                {props.rightSidebar && (
                  <button onClick={() => setShowRightSidebar(prev => !prev)}>
                    <Icon
                      icon={UsersIcon}
                      class="fill-fg opacity-70 hover:opacity-100 select-none w-6 h-6 transition duration-200"
                      title="Show or Hide Members"
                      tooltip={{ content: `${rightSidebar() ? 'Hide' : 'Show'} Member List`, placement: 'bottom' }}
                    />
                  </button>
                )}
                <For each={props.actionButtons ?? []}>
                  {({ icon, alt, onClick }) => (
                    <button onClick={onClick}>
                      <Icon
                        icon={icon}
                        title={alt}
                        class="fill-fg opacity-70 hover:opacity-100 select-none w-6 h-6 transition duration-200"
                        tooltip={{ content: alt, placement: 'bottom' }}
                      />
                    </button>
                  )}
                </For>
              </div>
            </div>
          )}
          <div classList={{
            "flex flex-grow w-full h-full": true,
            "mobile:hidden": sidebar(),
          }}>
            <div classList={{
              "flex flex-col": true,
              "w-full": !rightSidebar(),
              "w-[calc(100%-15rem)] mobile:hidden": rightSidebar(),
            }}>
              {props.children}
            </div>
            <div
              classList={{
                [
                  "hidden flex-grow items-center justify-center bg-transparent hover:bg-3 transition-all "
                  + "duration-300 cursor-pointer"
                ]: true,
                "mobile:flex": rightSidebar(),
              }}
              onClick={() => setShowRightSidebar(false)}
            >
              <Icon icon={ChevronRight} class="w-5 h-5 opacity-50 fill-fg" title="Collapse Members List" />
            </div>
            <Show when={rightSidebar()} keyed={false}>
              <div
                class="absolute right-0 top-14 inset-y-0 mobile:relative mobile:top-0 flex flex-col w-60
                  overflow-y-auto bg-1 mobile:w-[calc(100%-3rem)]"
              >
                {props.rightSidebar!()}
              </div>
            </Show>
          </div>
        </div>
      </div>
      <div classList={{
        "flex h-16 md:hidden": true,
        "hidden": !showBottomNav() && !sidebar(),
      }}>
        <BottomNav href="/" icon={HomeIcon} alt="Home" check={(p) => p === '/' || p.startsWith('/friends')} />
        <BottomNav href="/select" icon={ServerIcon} alt="Servers" check={(p) => p === '/select'} />
        <BottomNav href="/settings" icon={GearIcon} alt="Settings" check={(p) => p.startsWith('/settings')} />
      </div>
    </div>
  )
}
