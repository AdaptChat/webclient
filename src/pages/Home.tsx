import Layout, {setShowSidebar} from "./Layout";
import {getApi} from "../api/Api";
import StatusIndicator, {StatusIndicatorProps} from "../components/StatusIndicator";
import {toast} from "solid-toast";
import {ParentProps} from "solid-js";
import {A} from "@solidjs/router";

function StatusSelect(props: StatusIndicatorProps & { label: string }) {
  return (
    <li>
      <button
        onClick={() => toast.error('Status is a work in progress')}
        class="font-medium p-2"
      >
        <StatusIndicator status={props.status} />
        {props.label}
      </button>
    </li>
  )
}

export function Card(props: ParentProps<{ title: string }>) {
  return (
    <div
      class="flex flex-col items-center bg-gray-900 rounded-xl p-6 gap-2 flex-grow h-full"
    >
      <h2 class="card-title text-2xl font-title text-center">{props.title}</h2>
      {props.children}
    </div>
  )
}

function LearnAdaptSubcard(props: ParentProps<{ title: string }>) {
  return (
    <a
      class="flex justify-between gap-2 bg-neutral rounded-lg p-4 w-full hover:bg-neutral-focus transition-colors
        cursor-pointer"
    > {/* TODO */}
      <div>
        <h3 class="text-left font-medium font-title text-lg">{props.title}</h3>
        <p class="text-sm">{props.children}</p>
      </div>
      <img src="/icons/chevron-right.svg" alt="Click to go" class="invert select-none w-4"/>
    </a>
  )
}

export function SidebarButton(props: ParentProps<{ href: string, svg?: string, icon?: string, active?: boolean }>) {
  return (
    <A
      href={props.href}
      class="w-full group flex items-center gap-x-3 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
      onClick={() => {
        if (window.innerWidth < 768) setShowSidebar(false)
      }}
    >
      {props.svg && (
        <img
          src={props.svg}
          alt=""
          classList={{
            "w-5 h-5 invert opacity-50 group-hover:opacity-80 select-none transition-all duration-200": true,
            "opacity-100": props.active,
          }}
        />
      )}
      {props.icon && <img src={props.icon} alt="" class="w-5 h-5" />}
      <span classList={{
        "font-medium text-base-content text-opacity-60 group-hover:text-opacity-80 transition-all duration-200": true,
        "text-opacity-100": props.active,
      }}>
        {props.children}
      </span>
    </A>
  )
}

export function Sidebar() {
  const api = getApi()!

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="flex flex-col w-full p-2">
        <SidebarButton href="/" svg="/icons/home.svg">Home</SidebarButton>
      </div>
    </div>
  )
}

export default function Home() {
  const api = getApi()!
  const clientUser = api.cache!.clientUser!

  return (
    <Layout sidebar={Sidebar} title="Home">
      <div class="flex flex-col items-center w-full h-full p-8 mobile-xs:p-4 xl:p-12 2xl:p-16 overflow-auto">
        <div class="flex items-center mobile:justify-center px-8 bg-gray-900 rounded-xl py-12 w-full mobile:flex-col">
          <img src={api.cache?.clientAvatar} alt="" class="w-24 rounded-lg mr-4" />
          <div class="flex flex-col mobile:items-center">
            <h1 class="text-4xl mobile:text-3xl text-center font-title font-bold">
              Welcome,{' '}
              <span class="bg-gradient-to-r bg-clip-text overflow-ellipsis text-transparent from-accent to-secondary">
                {clientUser.username}
              </span>!
            </h1>
            <div class="dropdown mt-2">
              <label tabIndex="0" class="btn btn-sm text-[1rem]">
                <StatusIndicator status="online" />
                <span class="ml-2">Online</span>
              </label>
              <ul tabIndex="0" class="mt-2 dropdown-content menu p-2 shadow-xl bg-neutral-focus rounded-box w-52">
                <StatusSelect label="Online" status="online" />
                <StatusSelect label="Idle" status="idle" />
                <StatusSelect label="Do Not Disturb" status="dnd" />
                <StatusSelect label="Invisible" status="offline" />
              </ul>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center mt-4 gap-4 w-full mobile:flex-col">
          <Card title="Learn Adapt">
            <LearnAdaptSubcard title="Connect with friends">
              Find, connect, and chat with your friends, as long as they share with you their tag.
              <span class="block text-base-content/60 mt-1">
                Your tag is <code>{clientUser.username}#{clientUser.discriminator}!</code>
              </span>
            </LearnAdaptSubcard>
            <LearnAdaptSubcard title="Create a community">
              Create and develop a new server for you, your friends, or whoever you desire.
            </LearnAdaptSubcard>
            <LearnAdaptSubcard title="Discover communities">
              Find new servers to join that suit your interests. You can also join our{' '}
              <a class="link">official server</a>. {/* TODO */}
            </LearnAdaptSubcard>
          </Card>
          <Card title="Recent Activity">
            <div class="w-full h-full flex items-center justify-center">
              <p class="text-center">This card is a <b>Work in Progress.</b></p> {/* TODO */}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
