import Header from "../../components/ui/Header";
import {createMemo, createSignal, For, onMount, ParentProps, Show} from "solid-js";
import Icon, {IconElement} from "../../components/icons/Icon";
import ChevronRight from "../../components/icons/svg/ChevronRight";
import Book from "../../components/icons/svg/Book";
import Code from "../../components/icons/svg/Code";
import {Bot} from "../../types/user";
import {getApi} from "../../api/Api";
import MagnifyingGlass from "../../components/icons/svg/MagnifyingGlass";
import Fuse from "fuse.js";
import Xmark from "../../components/icons/svg/Xmark";
import Plus from "../../components/icons/svg/Plus";
import Robot from "../../components/icons/svg/Robot";
import Modal from "../../components/ui/Modal";
import CreateBotModal from "../../components/settings/CreateBotModal";
import {displayName} from "../../utils";
import {A} from "@solidjs/router";
import {defaultAvatar} from "../../api/ApiCache";

function ResourceCard(props: ParentProps<{ icon: IconElement, href: string }>) {
  return (
    <a
      class="p-4 rounded-xl bg-bg-3/40 hover:bg-bg-3 flex items-center justify-between transition-all"
      href={props.href}
      target="_blank"
    >
      <div class="flex items-center">
        <Icon icon={props.icon} class="w-4 h-4 fill-fg" />
        <div class="ml-2 font-title">{props.children}</div>
      </div>
      <Icon icon={ChevronRight} class="w-4 h-4 fill-fg/60" />
    </a>
  )
}

export default function Bots() {
  const api = getApi()!
  const [bots, setBots] = createSignal<Bot[] | null>(null)
  const [error, setError] = createSignal<string>("")

  const refreshBots = async () => {
    const response = await api.request('GET', '/bots')
    if (response.ok)
      setBots(response.jsonOrThrow())
    else
      setError(response.errorJsonOrThrow().message)
  }
  onMount(refreshBots)

  let searchRef: HTMLInputElement | null = null
  const [searchQuery, setSearchQuery] = createSignal('')

  const index = createMemo(() => new Fuse(bots() ?? [], { keys: ['user.username', 'user.display_name', 'user.id'] }))
  const queryResults = createMemo(() => searchQuery()
    ? index().search(searchQuery()).map(result => result.item)
    : bots()
  )

  const [showCreateBotModal, setShowCreateBotModal] = createSignal(false)

  return (
    <div class="p-4">
      <Header>Bots</Header>
      <Modal get={showCreateBotModal} set={setShowCreateBotModal}>
        <CreateBotModal setBots={setBots} setShow={setShowCreateBotModal} />
      </Modal>
      <p class="text-sm font-light text-fg/60">
        Bots are used to automate tasks and provide additional functionality throughout Adapt.
      </p>
      <h2 class="uppercase text-sm font-bold text-fg/70 mt-4 mb-1">Resources</h2>
      <div class="grid grid-cols-2 mobile:grid-cols-1 gap-2">
        <ResourceCard icon={Code} href="//github.com/AdaptChat/resources/blob/main/README.md">Developer Resources</ResourceCard>
        <ResourceCard icon={Book} href="//api.adapt.chat/docs">Adapt API Reference</ResourceCard>
      </div>
      <h2 class="uppercase text-sm font-bold text-fg/70 mt-4">My Bots</h2>
      <Show when={error()}>
        <div class="rounded-xl bg-danger/20 text-danger p-4 w-full my-2">
          Error: {error()}
        </div>
      </Show>

      <div class="flex gap-x-2 mt-2">
        <div class="flex flex-grow bg-bg-3/60 rounded-xl items-center">
          <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/50 my-3 ml-3"/>
          <input
            ref={searchRef!}
            type="text"
            class="w-full p-2 outline-none font-medium bg-transparent"
            placeholder="Search Bots"
            value={searchQuery()}
            onInput={(event) => setSearchQuery(event.currentTarget.value)}
          />
          <Show when={searchQuery()}>
            <Icon
              icon={Xmark}
              class="w-4 h-4 fill-fg/50 mr-3 cursor-pointer hover:fill-fg/80 transition duration-200"
              onClick={() => {
                setSearchQuery('')
                searchRef!.focus()
              }}
            />
          </Show>
        </div>
        <button class="btn btn-primary btn-sm rounded-xl flex gap-x-1" onClick={() => setShowCreateBotModal(true)}>
          <Icon icon={Plus} class="w-4 h-4 fill-fg"/>
          <span>New Bot</span>
        </button>
      </div>

      <div class="flex flex-col gap-y-2 mt-2">
        <Show when={bots() != null} fallback={
          <For each={['0ms', '200ms', '400ms', '600ms']}>
            {delay => (
              <div class="flex items-center justify-center bg-bg-1/70 h-24 animate-pulse rounded-xl" style={{ "animation-delay": delay }}>
                <Icon icon={Robot} class="w-8 h-8 fill-fg/50" />
              </div>
            )}
          </For>
        }>
          <For each={queryResults()!} fallback={
            <div class="flex flex-col items-center text-fg/70 rounded-xl text-center bg-bg-1/30 p-6">
              <Show when={searchQuery()} fallback={
                <>
                  No bots yet...
                  <button class="btn btn-ghost btn-sm rounded-xl flex gap-x-1" onClick={() => setShowCreateBotModal(true)}>
                    <span>Create one?</span>
                  </button>
                </>
              }>
                No bots found for "{searchQuery()}"
              </Show>
            </div>
          }>
            {bot => (
              <A
                class="flex items-center p-4 rounded-xl bg-bg-0/80 hover:bg-3 transition justify-between"
                href={`/settings/bots/${bot.user.id}`}
              >
                <div class="flex items-center">
                  <img src={bot.user.avatar ?? defaultAvatar(bot.user.id)} alt="" class="w-12 h-12 rounded-full" />
                  <div class="ml-3 group">
                    <div class="font-title font-lg">{displayName(bot.user)}</div>
                    <div class="text-fg/60 text-sm">
                      <span class="group-hover:hidden">
                        @{bot.user.username.replace(api.cache?.clientId?.toString()!, '...')}
                      </span>
                      <span class="hidden group-hover:block">
                        @{bot.user.username}
                      </span>
                    </div>
                  </div>
                </div>
                <Icon icon={ChevronRight} class="w-4 h-4 fill-fg/60" />
              </A>
            )}
          </For>
        </Show>
      </div>
    </div>
  )
}