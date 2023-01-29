import Layout from "./Layout";
import {getApi} from "../api/Api";

export default function Home() {
  const api = getApi()!

  return (
    <Layout>
      <div class="flex flex-col items-center justify-center w-full h-full">
        <h1 class="text-4xl font-title font-bold">
          Welcome,{' '}
          <span class="bg-gradient-to-r bg-clip-text text-transparent from-accent to-secondary">
            {api.cache!.clientUser!.username}
          </span>!
        </h1>
        <p class="my-4 text-white/60">Here are some things you can do:</p>
        <div class="flex justify-center mt-4 gap-x-4 w-full">
          <div class="flex flex-col items-center bg-gray-900 rounded-xl p-6 min-w-[256px] max-w-[360px] w-[30%] gap-2">
            <h2 class="card-title text-2xl font-title text-center">Learn Adapt</h2>
            <a class="flex gap-2 bg-neutral rounded-lg p-4 w-full hover:bg-neutral-focus transition-colors cursor-pointer"> {/* TODO */}
              <div>
                <h3 class="text-left font-medium font-title text-lg">Create a community</h3>
                <p class="text-sm">Create and develop a new server for you, your friends, or whoever you desire.</p>
              </div>
              <img src="/icons/chevron-right.svg" alt="Click to go" class="invert select-none w-4"/>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}
