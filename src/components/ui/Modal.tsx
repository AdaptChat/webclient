import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  Match,
  ParentProps, Setter, Signal,
  Switch,
  useContext
} from "solid-js";
import Icon from "../icons/Icon";
import Xmark from "../icons/svg/Xmark";
import {Portal} from "solid-js/web";
import {ModalPage as NewGuildModalPage, NewGuildModal} from "../guilds/NewGuildModal";
import {GuildChannel} from "../../types/channel";
import {Guild, Role} from "../../types/guild";
import ConfirmGuildLeaveModal from "../guilds/ConfirmGuildLeaveModal";
import ConfirmGuildDeleteModal from "../guilds/ConfirmGuildDeleteModal";
import GuildInviteModal from "../guilds/GuildInviteModal";
import CreateChannelModal from "../channels/CreateChannelModal";
import CreateCategoryModal from "../channels/CreateCategoryModal";
import ConfirmChannelDeleteModal from "../channels/ConfirmChannelDeleteModal";
import CreateRoleModal from "../guilds/CreateRoleModal";
import ConfirmRoleDeleteModal from "../guilds/ConfirmRoleDeleteModal";
import AddFriendModal from "../friends/AddFriendModal";
import SetPresence from "../users/SetPresenceModal";
import CreateBotModal from "../settings/CreateBotModal";
import {Bot} from "../../types/user";
import SetBotPermissionsModal, {SetRequestedBotPermissionsModal} from "../settings/SetBotPermissionsModal";
import {Permissions} from "../../api/Bitflags";
import {Message} from "../../types/message";
import ConfirmMessageDeleteModal from "../channels/ConfirmMessageDeleteModal";
import EmojiUploadModal from "../guilds/EmojiUploadModal";

export enum ModalId {
  NewGuild,
  LeaveGuild,
  DeleteGuild,
  CreateInvite,
  CreateChannel,
  CreateCategory,
  DeleteChannel,
  DeleteMessage,
  CreateRole,
  DeleteRole,
  AddFriend,
  UpdatePresence,
  CreateBot,
  SetBotPermissions,
  SetRequestedBotPermissions,
  EmojiUpload,
}

type ModalMapping = {
  [ModalId.NewGuild]: NewGuildModalPage,
  [ModalId.LeaveGuild]: Guild,
  [ModalId.DeleteGuild]: Guild,
  [ModalId.CreateInvite]: Guild,
  [ModalId.CreateChannel]: { guildId: bigint, parentId?: bigint },
  [ModalId.CreateCategory]: { guildId: bigint, parentId?: bigint },
  [ModalId.DeleteChannel]: GuildChannel,
  [ModalId.DeleteMessage]: Message,
  [ModalId.CreateRole]: bigint,
  [ModalId.DeleteRole]: Role,
  [ModalId.AddFriend]: undefined,
  [ModalId.UpdatePresence]: undefined,
  [ModalId.CreateBot]: Setter<Bot[] | null>,
  [ModalId.SetBotPermissions]: Signal<Permissions>,
  [ModalId.SetRequestedBotPermissions]: {
    permissionsSignal: Signal<Permissions>
    name: string
    allowed: Permissions
  },
  [ModalId.EmojiUpload]: { file: File },
}

type ModalDataPair = {
  [T in ModalId]: [T, ModalMapping[T]]
}[ModalId]

export type ModalContext = {
  getModal(): ModalDataPair | null
  get id(): ModalId | undefined
  get data(): ModalMapping[ModalId] | undefined

  showModal<T extends ModalId>(id: ModalId): void
  showModal<T extends ModalId>(id: T, data: ModalMapping[T]): void
  hideModal(): void
}

export const ModalContext = createContext<ModalContext>()
export const useModal = () => useContext(ModalContext) ?? {} as ModalContext

function ModalContainer(props: ParentProps<{ isShowing: Accessor<boolean>, hide: () => void }>) {
  const [invisible, setInvisible] = createSignal(true)
  createEffect(() => {
    if (props.isShowing()) setInvisible(false)
    else setTimeout(() => setInvisible(true), 200)
  })

  return (
    <Portal>
      <div
        classList={{
          [
            "flex absolute items-center justify-center bg-black/50 backdrop-blur w-full h-full inset-0"
            + " transition-all duration-200 font-sans text-fg"
          ]: true,
          "opacity-0 z-[-90]": !props.isShowing(),
          "opacity-100 z-[9999]": props.isShowing(),
          "invisible": invisible(),
          "visible": !invisible(),
        }}
        onClick={(event) => event.currentTarget == event.target && props.hide()}
      >
        <div classList={{
          "relative bg-2 p-6 rounded-lg max-w-xl transition-all duration-200 mx-2": true,
          "scale-50": !props.isShowing(),
          "scale-100": props.isShowing(),
        }}>
          <button>
            <Icon
              icon={Xmark}
              title="Close Modal"
              class="w-5 h-5 fill-fg absolute right-4 top-4 select-none opacity-50 hover:opacity-100 transition-all duration-200"
              onClick={() => props.hide()}
            />
          </button>
          {props.children}
        </div>
      </div>
    </Portal>
  )
}

export function ModalProvider(props: ParentProps) {
  const [stack, setStack] = createSignal<ModalDataPair[]>([])
  const [hidden, setHidden] = createSignal(true)
  const context = {
    getModal: () => stack()[stack().length - 1] ?? null,
    get id() { return this.getModal()?.[0] },
    get data() { return this.getModal()?.[1] },

    showModal<T extends ModalId>(id: T, data?: ModalMapping[T]) {
      setHidden(false)
      setStack(prev => [...prev, [id, data] as ModalDataPair])
    },
    hideModal() {
      let timeout = 0
      if (stack().length === 1) {
        setHidden(true)
        timeout = 200
      }
      setTimeout(() => setStack(prev => prev.slice(0, -1)), timeout)
    },
  }

  return (
    <ModalContext.Provider value={context}>
      {props.children}
      <ModalContainer isShowing={() => !hidden()} hide={() => context.hideModal()}>
        <Switch>
          <Match when={context.id === ModalId.NewGuild}>
            <NewGuildModal pageSignal={context.data as NewGuildModalPage} />
          </Match>
          <Match when={context.id === ModalId.LeaveGuild}>
            <ConfirmGuildLeaveModal guild={context.data as Guild} />
          </Match>
          <Match when={context.id === ModalId.DeleteGuild}>
            <ConfirmGuildDeleteModal guild={context.data as Guild} />
          </Match>
          <Match when={context.id === ModalId.CreateInvite}>
            <GuildInviteModal guild={context.data as Guild} />
          </Match>
          <Match when={context.id === ModalId.CreateChannel}>
            <CreateChannelModal {...context.data as any} />
          </Match>
          <Match when={context.id === ModalId.CreateCategory}>
            <CreateCategoryModal {...context.data as any} />
          </Match>
          <Match when={context.id === ModalId.DeleteChannel}>
            <ConfirmChannelDeleteModal channel={context.data as GuildChannel} />
          </Match>
          <Match when={context.id === ModalId.DeleteMessage}>
            <ConfirmMessageDeleteModal message={context.data as Message} />
          </Match>
          <Match when={context.id === ModalId.CreateRole}>
            <CreateRoleModal guildId={context.data as bigint} />
          </Match>
          <Match when={context.id === ModalId.DeleteRole}>
            <ConfirmRoleDeleteModal role={context.data as Role} />
          </Match>
          <Match when={context.id === ModalId.AddFriend}>
            <AddFriendModal />
          </Match>
          <Match when={context.id === ModalId.UpdatePresence}>
            <SetPresence />
          </Match>
          <Match when={context.id === ModalId.CreateBot}>
            <CreateBotModal setBots={context.data as Setter<Bot[] | null>} />
          </Match>
          <Match when={context.id === ModalId.SetBotPermissions}>
            <SetBotPermissionsModal permissionsSignal={context.data as any} />
          </Match>
          <Match when={context.id === ModalId.SetRequestedBotPermissions}>
            <SetRequestedBotPermissionsModal {...context.data as any} />
          </Match>
          <Match when={context.id === ModalId.EmojiUpload}>
            <EmojiUploadModal {...context.data as any} />
          </Match>
        </Switch>
      </ModalContainer>
    </ModalContext.Provider>
  )
}

export function ModalTemplate({ title, children }: ParentProps<{ title: string }>) {
  return (
    <>
      <h1 class="text-2xl font-title font-bold text-center">{title}</h1>
      {children}
    </>
  )
}
