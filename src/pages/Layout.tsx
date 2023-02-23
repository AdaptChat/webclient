import {createSignal, JSX, onMount, ParentProps, Show} from "solid-js";
import tippy from "tippy.js"
import {useLocation, useNavigate} from "@solidjs/router";
import GuildSideSelect from "../components/guilds/GuildSideSelect";

export const tippyBaseOptions = {
  placement: 'right',
  arrow: true,
  animation: 'shift-away',
} as const

function BottomNav({ href, icon, alt }: { href: string, icon: string, alt: string }) {
  const route = useLocation()
  const navigate = useNavigate()
  let anchor: HTMLAnchorElement | null = null

  onMount(() => {
    tippy(anchor!, {
      content: alt,
      placement: 'top',
      arrow: true,
      animation: 'shift-away',
    })
  })

  return (
    <a
      class={`bg-gray-900 hover:bg-gray-700 transition text-base-content/30 ${route.pathname === href ? 'active' : ''}`}
      onClick={() => navigate(href)}
      ref={anchor!}
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
  onMount(() => {
    if (window.innerWidth < 768) {
      setShowSidebar(false)
      setShowRightSidebar(false)
    }
  })

  return (
    <div class="w-full h-full overflow-hidden">
      <div classList={{
        "flex flex-grow w-full h-full": true,
        "mobile:h-[calc(100%-4rem)]": props.showBottomNav,
      }}>
        <GuildSideSelect />
        <Show when={props.sidebar && showSidebar()} keyed={false}>
          <div class="flex flex-col w-60 h-full bg-gray-850 mobile:w-[calc(100%-3rem)]">
            {props.sidebar!()}
          </div>
        </Show>
        <div
          classList={{
            "hidden flex-grow items-center justify-center bg-transparent hover:bg-gray-700 transition-all duration-300 cursor-pointer": true,
            "mobile:flex": props.sidebar && showSidebar(),
          }}
          onClick={() => setShowSidebar(false)}
        >
          <img src="/icons/chevron-left.svg" alt="Collapse Sidebar" class="invert w-3 opacity-50" />
        </div>
        <div classList={{
          "flex flex-col items-center": true,
          "w-[calc(100%-304px)] mobile:hidden": props.sidebar && showSidebar(),
          "w-[calc(100%-64px)] mobile:w-full": !props.sidebar || !showSidebar(),
        }}>
          {props.title && (
            <div class="flex items-center w-full p-4 bg-gray-900">
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
          )}
          {props.children}
        </div>
        <Show when={props.rightSidebar && showRightSidebar()} keyed={false}>
          <div class="flex flex-col w-60 h-full bg-gray-850 mobile:w-[calc(100%-3rem)]">
            {props.rightSidebar!()}
          </div>
        </Show>
      </div>
      <div classList={{
        "btm-nav md:hidden": true,
        "hidden": !props.showBottomNav && (!props.sidebar || !showSidebar()),
      }}>
        <BottomNav href="/" icon="/icons/home.svg" alt="Home" />
        <BottomNav href="/select" icon="/icons/server.svg" alt="Servers" />
      </div>
    </div>
  )
}
