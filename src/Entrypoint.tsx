import {
  type Component,
  createEffect,
  createSignal,
  lazy,
  onMount,
  onCleanup,
  Show, createContext, ParentProps, JSX,
} from 'solid-js';
import {Navigate, Route, Router, useLocation} from "@solidjs/router";
import Api, { getApi, setApi } from "./api/Api";
import WsClient from "./api/WsClient";
import useContextMenu from "./hooks/useContextMenu";
import {Toaster} from "solid-toast";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import App from "./App";
import useNewGuildModalComponent, {ModalPage} from "./components/guilds/NewGuildModal";
import ContextMenu, {ContextMenuButton} from "./components/ui/ContextMenu";
import RocketLaunch from "./components/icons/svg/RocketLaunch";
import UserPlus from "./components/icons/svg/UserPlus";

const Loading = lazy(() => import('./pages/Loading'))

// Auth
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// Core
const Home = lazy(() => import('./pages/Home'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Friends
const FriendsList = lazy(() => import('./pages/friends/FriendsList'))
const FriendRequests = lazy(() => import('./pages/friends/Requests'))
// const FriendsNav = lazy(() => import('./pages/friends/Friends').then(m => ({ default: m.FriendsNav })))
// const FriendActions = lazy(() => import('./pages/friends/Friends').then(m => ({ default: m.FriendActions })))

// DMs
const DmChannel = lazy(() => import('./pages/dms/DmChannel'))

// Guilds
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

function contextMenuAdjustment(click: number, element: number, page: number) {
  if (click + element <= page) return click
  if (click < element) return page - element
  return click - element
}

export const NewGuildModalContext = createContext<
  ReturnType<typeof useNewGuildModalComponent> & {NewGuildModalContextMenu: () => JSX.Element}
>()

export function NewGuildModalContextProvider(props: ParentProps) {
  const components = useNewGuildModalComponent()
  const NewGuildModalContextMenu = () => (
    <ContextMenu>
      <ContextMenuButton
        icon={RocketLaunch}
        label="Create Server"
        buttonClass="hover:bg-accent"
        onClick={() => {
          components.setShow(true)
          components.setPage(ModalPage.Create)
        }}
      />
      <ContextMenuButton
        icon={UserPlus}
        label="Join Server"
        onClick={() => {
          components.setShow(true)
          components.setPage(ModalPage.Join)
        }}
      />
    </ContextMenu>
  )

  return (
    <NewGuildModalContext.Provider value={{...components, NewGuildModalContextMenu}}>
      {props.children}
    </NewGuildModalContext.Provider>
  )
}

const Entrypoint: Component = () => {
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
      ws.connect().then(() => {
        setWs(ws)
        api?.pushNotifications.subscribe()
      })
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
      class="relative font-sans m-0 w-[100vw] h-[100vh] text-fg"
      onClick={(event) => contextMenu.setMenu(prev => {
        if (prev != null && contextMenuRef != null) {
          if (contextMenuRef.contains(event.target)) return prev
        }
      })}
    >
      <Show when={getApi()} fallback={
        <Router>
          <Route path={["/", "/login"]} component={Login} />
          <Route path="/register" component={Register} />
          <Route path="*" component={RedirectingLogin} />
        </Router>
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
          <div class="w-full h-full overflow-hidden">
            <NewGuildModalContextProvider>
              <Router>
                <Route component={App}>
                  <Route path="/loading" component={Loading} />
                  <Route path="/friends/requests" component={FriendRequests} />
                  <Route path="/friends/*" component={FriendsList} />
                  <Route path="/dms/:channelId" component={DmChannel} />
                  <Route path="/guilds/:guildId/:channelId" component={GuildChannel} />
                  <Route path="/guilds/:guildId" component={GuildHome} />
                  <Route path="/invite/:code" component={Invite} />
                  <Route path="/settings/appearance" component={AppearanceSettings} />
                  <Route path={["/settings", "/settings/account"]} component={AccountSettings} />
                  <Route path="/" component={Home} />
                  <Route path="*" component={NotFound} />
                </Route>
              </Router>
            </NewGuildModalContextProvider>
          </div>
        </Show>
      </Show>
    </main>
  );
};

export default Entrypoint;