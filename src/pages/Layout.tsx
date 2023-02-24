import {createEffect, createMemo, createSignal, JSX, onMount, ParentProps, Show} from "solid-js";
import tippy from "tippy.js"
import {useLocation, useNavigate} from "@solidjs/router";
import GuildSideSelect from "../components/guilds/GuildSideSelect";
import tooltip from "../directives/tooltip";
import {noop} from "../utils";
import {createMediaQuery} from "@solid-primitives/media";
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

interface LayoutProps {
  sidebar?: () => JSX.Element,
  rightSidebar?: () => JSX.Element,
  title?: string,
  showBottomNav?: boolean,
}

export const [showSidebar, setShowSidebar] = createSignal(true)
export const [showRightSidebar, setShowRightSidebar] = createSignal(true)

export default function Layout(props: ParentProps<LayoutProps>) {
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
        <GuildSideSelect />
        <Show when={sidebar()} keyed={false}>
          <div class="flex flex-col w-60 h-full bg-gray-850 mobile:w-[calc(100%-3rem)]">
            {props.sidebar!()}
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
          "w-[calc(100%-4rem)] mobile:w-full": !sidebar(), // 4rem (guild sidebar)
          "mobile:hidden": sidebar(),
        }}>
          {props.title && (
            <div classList={{
              "flex items-center justify-between w-full bg-gray-900": true,
              "mobile:hidden": sidebar(),
            }}>
              <div class="flex items-center p-4">
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
              </div>
              {props.rightSidebar && (
                <div class="flex items-center p-4">
                  <button onClick={() => setShowRightSidebar(prev => !prev)}>
                    <img
                      src="/icons/user-group.svg"
                      alt="Show or hide Members"
                      class="invert opacity-70 select-none hover:opacity-100 transition duration-200 w-6 h-6"
                      use:tooltip={{content: `${rightSidebar() ? 'Hide' : 'Show'} Member List`, placement: 'bottom'}}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
          <div classList={{
            "flex flex-grow w-full h-full mobile:h-[calc(100%-3rem)]": true,
            "mobile:hidden": sidebar(),
          }}>
            <div classList={{
              "flex flex-col flex-grow": true,
              "mobile:hidden": rightSidebar(),
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
              <div class="flex flex-col w-60 h-full bg-gray-850 mobile:w-[calc(100%-3rem)]">
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
      </div>
    </div>
  )
}
