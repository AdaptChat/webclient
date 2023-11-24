import {createSignal, For, onMount, Show} from "solid-js";
import {A} from "@solidjs/router";

import {getApi} from "../../api/Api";
import {Guild} from "../../types/guild";
import GuildIcon from "./GuildIcon";
import useNewGuildModalComponent, {ModalPage} from "./NewGuildModal";

import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import Icon, {IconElement} from "../icons/Icon";
import PlusIcon from "../icons/svg/Plus";
import HomeIcon from "../icons/svg/Home";
import Gear from "../icons/svg/Gear";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import RightFromBracket from "../icons/svg/RightFromBracket";
import Code from "../icons/svg/Code";
import Modal from "../ui/Modal";
import GuildInviteModal from "./GuildInviteModal";
import ConfirmGuildLeaveModal from "./ConfirmGuildLeaveModal";
import UserPlus from "../icons/svg/UserPlus";
import RocketLaunch from "../icons/svg/RocketLaunch";

noop(tooltip)

const Separator = () => <hr class="h-[3px] bg-2 border-none rounded-full my-1.5 mx-1" />

function BasicButton({ icon, alt, href }: { icon: IconElement, alt: string, href: string }) {
  let anchor: HTMLAnchorElement | null = null
  onMount(() => {
    tooltip(anchor!, () => ({ content: alt, placement: 'right' }))
  })

  return (
    <A ref={anchor!} href={href} class="group">
      <Icon
        icon={icon}
        title={alt}
        class="select-none w-5 h-5 fill-fg opacity-70 group-hover:opacity-100 transition duration-200"
      />
    </A>
  )
}

export default function GuildSideSelect() {
  const api = getApi()!
  const contextMenu = useContextMenu()!

  const { NewGuildModal, setShow: setShowNewGuildModal, setPage } = useNewGuildModalComponent()
  const [showInviteModal, setShowInviteModal] = createSignal(false)
  const [confirmGuildLeaveModal, setConfirmGuildLeaveModal] = createSignal(false)
  const [modalSubject, setModalSubject] = createSignal<Guild>()

  return (
    <div class="flex flex-col items-center justify-between bg-0 mobile:hidden">
      <div class="h-[calc(100%-1.25rem)] overflow-y-auto hide-scrollbar">
        <div class="flex flex-col p-2 gap-y-2 min-h-full">
          <NewGuildModal />
          <Show when={modalSubject()}>
            <Modal get={showInviteModal} set={setShowInviteModal}>
              <GuildInviteModal guild={modalSubject()!} show={showInviteModal} />
            </Modal>
            <Modal get={confirmGuildLeaveModal} set={setConfirmGuildLeaveModal}>
              <ConfirmGuildLeaveModal guild={modalSubject()!} setConfirmGuildLeaveModal={setConfirmGuildLeaveModal} />
            </Modal>
          </Show>
          <div class="flex flex-col px-3 pt-3 items-center">
            <BasicButton icon={HomeIcon} alt="Home" href="/" />
          </div>
          <Separator />
          <For each={Array.from(api.cache!.guildList.map(g => api.cache!.guilds.get(g)!))}>
            {(guild: Guild) => (
              <A href={`/guilds/${guild.id}`} class="flex" onContextMenu={contextMenu.getHandler(
                <ContextMenu>
                  <ContextMenuButton
                    icon={UserPlus}
                    label="Invite People"
                    buttonClass="hover:bg-accent"
                    onClick={() => {
                      setShowInviteModal(true)
                      setModalSubject(guild)
                    }}
                  />
                  <ContextMenuButton
                    icon={Code}
                    label="Copy Server ID"
                    onClick={() => window.navigator.clipboard.writeText(guild.id.toString())}
                  />
                  <Show when={api.cache!.clientId !== guild.owner_id}>
                    <DangerContextMenuButton
                      icon={RightFromBracket}
                      label="Leave Server"
                      onClick={() => {
                        setConfirmGuildLeaveModal(true)
                        setModalSubject(guild)
                      }}
                    />
                  </Show>
                </ContextMenu>
              )}>
                <GuildIcon
                  guild={guild} unread={false} pings={0} sizeClass="w-12 h-12" tooltip ringIfActive
                />
              </A>
            )}
          </For>
          <Show when={api.cache!.guildList.length > 0} keyed={false}>
            <Separator />
          </Show>
          <button
            use:tooltip={{ content: "New Server", placement: 'right' }}
            class="flex group items-center justify-center bg-2 hover:bg-accent rounded-[50%]
              hover:rounded-[25%] transition-all duration-300 w-12 h-12"
            onClick={() => setShowNewGuildModal(true)}
            onContextMenu={contextMenu.getHandler(
              <ContextMenu>
                <ContextMenuButton
                  icon={RocketLaunch}
                  label="Create Server"
                  buttonClass="hover:bg-accent"
                  onClick={() => {
                    setShowNewGuildModal(true)
                    setPage(ModalPage.Create)
                  }}
                />
                <ContextMenuButton
                  icon={UserPlus}
                  label="Join Server"
                  onClick={() => {
                    setShowNewGuildModal(true)
                    setPage(ModalPage.Join)
                  }}
                />
              </ContextMenu>
            )}
          >
            <Icon
              icon={PlusIcon}
              class="w-5 h-5 fill-accent-light group-hover:fill-fg transition duration-200"
              title="New Server"
            />
          </button>
        </div>
      </div>
      <div class="flex flex-col items-center justify-center pb-5 pt-2 w-full relative">
        <div
          class="absolute left-0 right-0 bottom-full w-full flex-grow bg-gradient-to-t from-bg-0 to-transparent h-5
            pointer-events-none"
        />
        <BasicButton icon={Gear} alt="Settings" href="/settings" />
      </div>
    </div>
  )
}