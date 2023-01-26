import {type Component, lazy, onMount} from 'solid-js';
import { Route, Routes } from "@solidjs/router";
import Api, { getApi, setApi } from "./api/Api";
import Cookies from 'js-cookie'

const Layout = lazy(() => import('./pages/auth/Layout'))

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
        {getApi() == null ? (
          <Route path="/" component={Layout} />
        ) : (
          <Route path="/" element={<>logged in</>} />
        )}
      </Routes>
    </main>
  );
};

export default App;
