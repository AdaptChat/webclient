import {createSignal, For, onMount, Show, useContext} from "solid-js";
import {A} from "@solidjs/router";

import {getApi} from "../../api/Api";
import {Guild} from "../../types/guild";
import GuildIcon from "./GuildIcon";

import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import Icon, {IconElement} from "../icons/Icon";
import PlusIcon from "../icons/svg/Plus";
import HomeIcon from "../icons/svg/Home";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import RightFromBracket from "../icons/svg/RightFromBracket";
import Code from "../icons/svg/Code";
import Modal from "../ui/Modal";
import GuildInviteModal from "./GuildInviteModal";
import ConfirmGuildLeaveModal from "./ConfirmGuildLeaveModal";
import UserPlus from "../icons/svg/UserPlus";
import {NewGuildModalContext} from "../../Entrypoint";

noop(tooltip)

const Separator = () => <hr class="h-[3px] bg-fg/10 border-none rounded-full my-1.5 mx-1" />

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

const [showInviteModal, setShowInviteModal] = createSignal(false)
const [confirmGuildLeaveModal, setConfirmGuildLeaveModal] = createSignal(false)
const [modalSubject, setModalSubject] = createSignal<Guild>()

export function GuildContextMenu(props: { guild: Guild }) {
  const api = getApi()!

  return (
    <ContextMenu>
      <ContextMenuButton
        icon={UserPlus}
        label="Invite People"
        buttonClass="hover:bg-accent"
        onClick={() => {
          setShowInviteModal(true)
          setModalSubject(props.guild)
        }}
      />
      <ContextMenuButton
        icon={Code}
        label="Copy Server ID"
        onClick={() => window.navigator.clipboard.writeText(props.guild.id.toString())}
      />
      <Show when={api.cache!.clientId !== props.guild.owner_id}>
        <DangerContextMenuButton
          icon={RightFromBracket}
          label="Leave Server"
          onClick={() => {
            setConfirmGuildLeaveModal(true)
            setModalSubject(props.guild)
          }}
        />
      </Show>
    </ContextMenu>
  )
}

export default function GuildSideSelect() {
  const api = getApi()!
  const contextMenu = useContextMenu()!
  const { setShow: setShowNewGuildModal, NewGuildModalContextMenu } = useContext(NewGuildModalContext)!

  return (
    <div class="h-full overflow-y-auto hide-scrollbar">
      <div class="flex flex-col p-2 gap-y-2 min-h-full">
        <Modal get={showInviteModal} set={setShowInviteModal}>
          <Show when={modalSubject()}>
            <GuildInviteModal guild={modalSubject()!} show={showInviteModal} />
          </Show>
        </Modal>
        <Modal get={confirmGuildLeaveModal} set={setConfirmGuildLeaveModal}>
          <Show when={modalSubject()}>
            <ConfirmGuildLeaveModal guild={modalSubject()!} setConfirmGuildLeaveModal={setConfirmGuildLeaveModal} />
          </Show>
        </Modal>
        <div class="flex flex-col px-3 pt-3 items-center">
          <BasicButton icon={HomeIcon} alt="Home" href="/" />
        </div>
        <Separator />
        <For each={Array.from(api.cache!.guildList.map(g => api.cache!.guilds.get(g)!))}>
          {(guild: Guild) => (
            <A href={`/guilds/${guild.id}`} class="flex" onContextMenu={contextMenu.getHandler(
              <GuildContextMenu guild={guild} />
            )}>
              <GuildIcon guild={guild} sizeClass="w-12 h-12" tooltip ringIfActive />
            </A>
          )}
        </For>
        <Show when={api.cache!.guildList.length > 0} keyed={false}>
          <Separator />
        </Show>
        <button
          use:tooltip={{ content: "New Server", placement: 'right' }}
          id="adapt_new_guild"
          class="flex group items-center justify-center bg-2 hover:bg-accent rounded-[50%]
            hover:rounded-[25%] transition-all duration-300 w-12 h-12"
          onClick={() => setShowNewGuildModal(true)}
          onContextMenu={contextMenu.getHandler(<NewGuildModalContextMenu />)}
        >
          <Icon
            icon={PlusIcon}
            class="w-5 h-5 fill-accent-light group-hover:fill-fg transition duration-200"
            title="New Server"
          />
        </button>
      </div>
    </div>
  )
}