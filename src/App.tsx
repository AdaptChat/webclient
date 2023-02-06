import {type Component, createEffect, createSignal, lazy, onMount, onCleanup, Show} from 'solid-js';
import { Route, Routes } from "@solidjs/router";
import Api, { getApi, setApi } from "./api/Api";
import Cookies from 'js-cookie'
import WsClient from "./api/WsClient";
import {Toaster} from "solid-toast";

import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Loading = lazy(() => import('./pages/Loading'))
const Home = lazy(() => import('./pages/Home'))
const GuildSelect = lazy(() => import('./pages/GuildSelect'))
const GuildHome = lazy(() => import('./pages/guilds/GuildHome'))

const App: Component = () => {
  const [ws, setWs] = createSignal<WsClient>()

  onMount(() => {
    const token = Cookies.get('token');

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

  return (
    <main class="font-sans m-0 w-[100vw] h-[100vh] bg-gray-800 text-base-content">
      <Show when={getApi()} keyed={false} fallback={
        <Routes>
          <Route path={["/", "/login"]} component={Login} />
          <Route path="/register" component={Register} />
        </Routes>
      }>
        <Toaster toastOptions={{
          className: "_toast",
          style: {
            background: "#000000",
          },
        }} />
        <Show when={ws()} keyed={false} fallback={Loading}>
          <Routes>
            <Route path="/" component={Home} />
            <Route path="/select" component={GuildSelect} />
            <Route path="/guilds/:guildId" component={GuildHome} />
          </Routes>
        </Show>
      </Show>
    </main>
  );
};

export default App;
