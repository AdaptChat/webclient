import {createEffect, createMemo, createSignal, For, JSX, onMount, ParentProps, Show} from "solid-js";
import {useLocation, useNavigate} from "@solidjs/router";
import GuildSideSelect from "../components/guilds/GuildSideSelect";
import tooltip from "../directives/tooltip";
import {noop} from "../utils";
import {createMediaQuery} from "@solid-primitives/media";
import {getApi} from "../api/Api";
import StatusIndicator from "../components/users/StatusIndicator";
import {toast} from "solid-toast";
noop(tooltip)

function BottomNav({ href, icon, alt }: { href: string, icon: string, alt: string }) {
  const route = useLocation()
  const navigate = useNavigate()

  return (
    <a
      class={`bg-gray-900 hover:bg-gray-700 transition text-base-content/30 ${route.pathname === href ? 'active' : ''}`}
      onClick={() => navigate(href)}
      use:tooltip={{ content: alt, placement: 'top' }}
    >
      <img src={icon} alt={alt} class="invert select-none w-5" />
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
  actionButtons?: { icon: string, alt: string, onClick: () => any }[],
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

  return (
    <div class="w-full h-full overflow-hidden">
      <div classList={{
        "flex flex-grow w-full h-full": true,
        "mobile:h-[calc(100%-4rem)]": props.showBottomNav,
      }}>
        <Show when={!props.hideGuildSelect} keyed={false}>
          <GuildSideSelect />
        </Show>
        <Show when={sidebar()} keyed={false}>
          <div classList={{
            "flex flex-col justify-between bg-gray-850 h-full mobile:w-[calc(100%-3rem)]": true,
            "w-[19rem]": props.hideGuildSelect,
            "w-60": !props.hideGuildSelect,
          }}>
            <div class="flex flex-col w-full overflow-y-auto">
              {props.sidebar!()}
            </div>
            <div class="flex items-center bg-gray-900 rounded-lg m-4 pr-2">
              <div class="indicator w-10">
                <StatusIndicator status={api.cache!.presences.get(clientUser().id)!.status} tailwind="m-[0.1rem]" indicator />
                <img src={api.cache!.clientAvatar} alt="" class="w-10 h-10 rounded-lg" />
              </div>
              <span
                class="w-[calc(100%-3rem)] ml-2 text-sm font-medium overflow-ellipsis overflow-hidden cursor-pointer"
                onClick={() => toast.promise(
                  navigator.clipboard.writeText(`${clientUser().username}#${clientUser().discriminator.toString().padStart(4, '0')}`),
                  {
                    loading: "Copying tag...",
                    success: "Copied to your clipboard!",
                    error: "Failed to copy user tag, try again later.",
                  }
                )}
              >
                {clientUser().username}
                <span class="text-base-content/50">#{clientUser().discriminator.toString().padStart(4, '0')}</span>
              </span>
            </div>
          </div>
        </Show>
        <div
          classList={{
            "hidden flex-grow items-center justify-center bg-transparent hover:bg-gray-700 transition-all duration-300 cursor-pointer": true,
            "mobile:flex": sidebar(),
          }}
          onClick={() => setShowSidebar(false)}
        >
          <img src="/icons/chevron-left.svg" alt="Collapse Sidebar" class="invert w-3 opacity-50" />
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
              "flex items-center justify-between w-full bg-gray-900": true,
              "mobile:hidden": sidebar(),
            }}>
              <div class="flex items-center pl-4 h-14 mobile:overflow-x-auto mobile:hide-scrollbar">
                <button onClick={() => setShowSidebar(prev => !prev)}>
                  <img
                    src={showSidebar() ? "/icons/chevron-left.svg" : "/icons/chevron-right.svg"}
                    alt={showSidebar() ? "Collapse Sidebar" : "Show Sidebar"}
                    class="invert select-none w-3 opacity-30 hover:opacity-60 transition-opacity duration-300
                      left-3 top-3 z-[9999] mr-4"
                  />
                </button>
                <span class="font-bold font-title">
                  {props.title}
                </span>
                {props.topNav && (
                  <>
                    <div class="divider divider-horizontal w-2 my-3 rounded-full" />
                    <div class="flex items-center gap-x-4 mobile-xs:gap-x-2">
                      {props.topNav!()}
                    </div>
                  </>
                )}
              </div>
              <div class="flex items-center p-4 gap-x-4">
                {/* TODO: merge the member icon into actionButtons */}
                {props.rightSidebar && (
                  <button onClick={() => setShowRightSidebar(prev => !prev)} class="w-6">
                    <img
                      src="/icons/users.svg"
                      alt="Show or hide Members"
                      class="invert opacity-70 select-none hover:opacity-100 transition duration-200 w-6 h-6"
                      use:tooltip={{content: `${rightSidebar() ? 'Hide' : 'Show'} Member List`, placement: 'bottom'}}
                    />
                  </button>
                )}
                <For each={props.actionButtons ?? []}>
                  {({ icon, alt, onClick }) => (
                    <button onClick={onClick} class="w-6">
                      <img
                        src={icon}
                        alt={alt}
                        class="invert opacity-70 select-none hover:opacity-100 transition duration-200 w-6 h-6"
                        use:tooltip={{ content: alt, placement: 'bottom' }}
                      />
                    </button>
                  )}
                </For>
              </div>
            </div>
          )}
          <div classList={{
            "flex flex-grow w-full h-full mobile:h-[calc(100%-3rem)]": true,
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
                "hidden flex-grow items-center justify-center bg-transparent hover:bg-gray-700 transition-all duration-300 cursor-pointer": true,
                "mobile:flex": rightSidebar(),
              }}
              onClick={() => setShowRightSidebar(false)}
            >
              <img src="/icons/chevron-right.svg" alt="Collapse Members List" class="invert w-3 opacity-50"/>
            </div>
            <Show when={rightSidebar()} keyed={false}>
              <div class="absolute right-0 top-14 inset-y-0 flex flex-col w-60 overflow-y-auto bg-gray-850 mobile:w-[calc(100%-3rem)]">
                {props.rightSidebar!()}
              </div>
            </Show>
          </div>
        </div>
      </div>
      <div classList={{
        "btm-nav md:hidden": true,
        "hidden": !props.showBottomNav && !sidebar(),
      }}>
        <BottomNav href="/" icon="/icons/home.svg" alt="Home" />
        <BottomNav href="/select" icon="/icons/server.svg" alt="Servers" />
        <BottomNav href="/settings" icon="/icons/gear.svg" alt="Settings" />
      </div>
    </div>
  )
}
