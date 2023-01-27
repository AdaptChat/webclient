import {type Component, lazy, onMount, Show} from 'solid-js';
import { Route, Routes } from "@solidjs/router";
import Api, { getApi, setApi } from "./api/Api";
import Cookies from 'js-cookie'

const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))

const App: Component = () => {
  onMount(() => {
    const token = Cookies.get('token');

    if (token != null) {
      setApi(new Api(token))
    }
  })

  return (
    <main class="font-sans m-0 w-[100vw] h-[100vh] bg-gray-800 text-white">
      <Routes>
        <Show when={getApi() != null} keyed={false} fallback={
          <>
            <Route path={["/", "/login"]} component={Login} />
            <Route path="/register" component={Register} />
          </>
        }>
          <Route path="/" element={<>Hi</>} />
        </Show>
      </Routes>
    </main>
  );
};

export default App;
