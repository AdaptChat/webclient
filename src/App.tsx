import {
  type Component,
  createEffect,
  createSignal,
  lazy,
  onMount,
  onCleanup,
  Show,
  JSX,
  createContext,
  ParentProps, Accessor, Setter, useContext
} from 'solid-js';
import {Navigate, Route, Routes, useLocation} from "@solidjs/router";
import Api, { getApi, setApi } from "./api/Api";
import WsClient from "./api/WsClient";
import {Toaster} from "solid-toast";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

const NotFound = lazy(() => import('./pages/NotFound'))

// Home
const Home = lazy(() => import('./pages/Home'))
const Loading = lazy(() => import('./pages/Loading'))

// Friends
const Friends = lazy(() => import('./pages/friends/Friends'))

// Auth
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// DMs
const DmChannel = lazy(() => import('./pages/dms/DmChannel'))

// Guilds
const GuildSelect = lazy(() => import('./pages/guilds/GuildSelect'))
const GuildHome = lazy(() => import('./pages/guilds/GuildHome'))
const GuildChannel = lazy(() => import('./pages/guilds/GuildChannel'))
const Invite = lazy(() => import('./pages/guilds/Invite'))

// Settings
const AccountSettings = lazy(() => import('./pages/settings/Account'))
const AppearanceSettings = lazy(() => import('./pages/settings/Appearance'))

const RedirectingLogin = lazy(async () => {
  const redirectTo = useLocation().pathname
  if (localStorage.getItem('token') != null)
    await new Promise(resolve => setTimeout(resolve, 500))

  return {
    default: () => {
      localStorage.removeItem('token')
      return <Navigate href="/login" state={{redirectTo}} />
    }
  }
})

type Position = { x: number, y: number }

interface ContextMenuProps {
  menu: Accessor<JSX.Element | null>
  setMenu: Setter<JSX.Element | null>
  pos: Accessor<Position>
  setPos: Setter<Position>
  getHandler(menu: JSX.Element): (event: MouseEvent) => void
  hide(): void
}

const ContextMenuContext = createContext<ContextMenuProps>()

function contextMenuAdjustment(click: number, element: number, page: number) {
  if (click + element <= page) return click
  if (click < element) return page - element
  return click - element
}

export function ContextMenuProvider(props: ParentProps) {
  const [menu, setMenu] = createSignal<JSX.Element>(null)
  const [pos, setPos] = createSignal({ x: 0, y: 0 })
  const manager: ContextMenuProps = {
    menu,
    setMenu,
    pos,
    setPos,
    getHandler(menu: JSX.Element) {
      return (event: MouseEvent) => {
        event.preventDefault()
        setPos({
          x: event.clientX,
          y: event.clientY,
        })
        setMenu(() => menu)
      }
    },
    hide() {
      setMenu(null)
    },
  }

  return (
    <ContextMenuContext.Provider value={manager}>
      {props.children}
    </ContextMenuContext.Provider>
  )
}

export function useContextMenu() {
  return useContext(ContextMenuContext)
}

const App: Component = () => {
  const [ws, setWs] = createSignal<WsClient>()
  const contextMenu = useContextMenu()!

  onMount(() => {
    const token = localStorage.getItem('token');

    if (token != null) {
      setApi(new Api(token))
    }
  })

  onCleanup(() => {
    if (ws() != null) {
      ws()!.close()
    }
  })

  createEffect(() => {
    let api = getApi()

    if (api != null) {
      const ws = new WsClient(api)
      ws.connect().then(() => setWs(ws))
      api.ws = ws
    }
  })

  let contextMenuRef: HTMLDivElement | null = null

  createEffect(() => {
    if (contextMenu.menu() == null || contextMenuRef == null) return

    contextMenu.setPos(({ x, y }) => ({
      x: contextMenuAdjustment(x, contextMenuRef!.offsetWidth, window.innerWidth),
      y: contextMenuAdjustment(y, contextMenuRef!.offsetHeight, window.innerHeight),
    }))
  })

  return (
    <main
      class="relative font-sans m-0 w-[100vw] h-[100vh] bg-gray-800 text-base-content"
      onClick={(event) => contextMenu.setMenu(prev => {
        if (prev != null && contextMenuRef != null) {
          if (contextMenuRef.contains(event.target)) return prev
        }
      })}
    >
      <Show when={getApi()} keyed={false} fallback={
        <Routes>
          <Route path={["/", "/login"]} component={Login} />
          <Route path="/register" component={Register} />
          <Route path="*" component={RedirectingLogin} />
        </Routes>
      }>
        <Toaster toastOptions={{
          className: "_toast",
          style: {
            background: "#000000",
          },
        }} />
        <Show when={contextMenu.menu()}>
          <div
            ref={contextMenuRef!}
            class="z-[9999] absolute flex context-menu"
            style={{ left: contextMenu.pos().x + 'px', top: contextMenu.pos().y + 'px'}}
          >
            {contextMenu.menu()}
          </div>
        </Show>
        <Show when={ws()} fallback={<Loading />}>
          <Routes>
            <Route path="/" component={Home} />
            <Route path="/select" component={GuildSelect} />
            <Route path="/friends/*" component={Friends} />
            <Route path="/dms/:channelId" component={DmChannel} />
            <Route path="/guilds/:guildId" component={GuildHome} />
            <Route path="/guilds/:guildId/:channelId" component={GuildChannel} />
            <Route path="/invite/:code" component={Invite} />
            <Route path={["/settings", "/settings/account"]} component={AccountSettings} />
            <Route path="/settings/appearance" component={AppearanceSettings} />
            <Route path="/*" component={NotFound} />
          </Routes>
        </Show>
      </Show>
    </main>
  );
};

export default App;
