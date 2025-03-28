import {
  type Component,
  createEffect,
  createSignal,
  lazy,
  onMount,
  onCleanup,
  Show,
} from 'solid-js';
import {Navigate, Route, Router, useLocation} from "@solidjs/router";
import Api, { getApi, setApi } from "./api/Api";
import WsClient from "./api/WsClient";
import useContextMenu from "./hooks/useContextMenu";
import {Toaster} from "solid-toast";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import App from "./App";

import {Settings, SettingsRoot} from "./pages/settings/SettingsLayout";
import {GuildSettings, GuildSettingsRoot} from "./pages/guilds/settings/GuildSettings";
import {GuildChannelSettings, GuildChannelSettingsRoot} from "./pages/channels/settings/GuildChannelSettings";
import {ModalProvider} from "./components/ui/Modal";

const Loading = lazy(() => import('./pages/Loading'))

// Auth
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

// Core
const Home = lazy(() => import('./pages/Home'))
const AddBot = lazy(() => import('./pages/AddBot'))
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
const GuildChannel = lazy(() => import('./pages/channels/GuildChannel'))
const Invite = lazy(() => import('./pages/guilds/Invite'))

// Settings
const AccountSettings = lazy(() => import('./pages/settings/Account'))
const LocaleSettings = lazy(() => import('./pages/settings/Locale'))
const AppearanceSettings = lazy(() => import('./pages/settings/Appearance'))
const PluginsSettings = lazy(() => import('./pages/settings/Plugins'))
const BotsSettings = lazy(() => import('./pages/settings/Bots'))
const BotSettings = lazy(() => import('./pages/settings/Bot'))

// Guild Settings
const GuildSettingsOverview = lazy(() => import('./pages/guilds/settings/Overview'))
const GuildSettingsRoles = lazy(() => import('./pages/guilds/settings/Roles'))
const GuildSettingsRole = lazy(() => import('./pages/guilds/settings/Role'))
const GuildSettingsRoleOverview = lazy(() => import('./pages/guilds/settings/RoleOverview'))
const GuildSettingsRolePermissions = lazy(() => import('./pages/guilds/settings/RolePermissions'))
const GuildSettingsRoleMembers = lazy(() => import('./pages/guilds/settings/RoleMembers'))
const GuildSettingsEmojis = lazy(() => import('./pages/guilds/settings/EmojiSettings'))

// Guild Channel Settings
const GuildChannelSettingsOverview = lazy(() => import('./pages/channels/settings/Overview'))
const GuildChannelSettingsPermissions = lazy(() => import('./pages/channels/settings/Permissions'))

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
        <div class="w-full h-full overflow-hidden">
          <Router>
            <Route component={ModalProvider}>
              <Route path="/bots/:botId" component={AddBot} />
              <Show when={ws()} fallback={<Route path="*" component={Loading} />}>
                <Route path="/settings" component={Settings}>
                  <Route path="/account" component={AccountSettings} />
                  <Route path="/locales" component={LocaleSettings} />
                  <Route path="/appearance" component={AppearanceSettings} />
                  <Route path="/plugins" component={PluginsSettings} />
                  <Route path="/bots/:botId" component={BotSettings} />
                  <Route path="/bots" component={BotsSettings} />
                </Route>
                <Route path="/settings" component={SettingsRoot} />
                <Route path="/guilds/:guildId/settings" component={GuildSettings}>
                  <Route path="/overview" component={GuildSettingsOverview} />
                  <Route path="/roles/:roleId" component={GuildSettingsRole}>
                    <Route path="/permissions" component={GuildSettingsRolePermissions} />
                    <Route path="/members" component={GuildSettingsRoleMembers} />
                    <Route path="/" component={GuildSettingsRoleOverview} />
                  </Route>
                  <Route path="/roles" component={GuildSettingsRoles} />
                  <Route path="/emojis" component={GuildSettingsEmojis} />
                  <Route path="/invites" component={() => 'wip'} />
                </Route>
                <Route path="/guilds/:guildId/settings" component={GuildSettingsRoot} />
                <Route path="/guilds/:guildId/:channelId/settings" component={GuildChannelSettings}>
                  <Route path="/overview" component={GuildChannelSettingsOverview} />
                  <Route path="/permissions" component={GuildChannelSettingsPermissions} />
                </Route>
                <Route path="/guilds/:guildId/:channelId/settings" component={GuildChannelSettingsRoot} />
                <Route component={App}>
                  <Route path="/loading" component={Loading} />
                  <Route path="/friends/requests" component={FriendRequests} />
                  <Route path="/friends/*" component={FriendsList} />
                  <Route path="/dms/:channelId" component={DmChannel} />
                  <Route path="/guilds/:guildId/:channelId" component={GuildChannel} />
                  <Route path="/guilds/:guildId" component={GuildHome} />
                  <Route path="/invite/:code" component={Invite} />
                  <Route path="/" component={Home} />
                  <Route path="*" component={NotFound} />
                </Route>
              </Show>
            </Route>
          </Router>
        </div>
      </Show>
    </main>
  );
};

export default Entrypoint;
