import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  Match,
  ParentProps,
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

export enum ModalId {
  NewGuild,
  LeaveGuild,
  DeleteGuild,
  CreateInvite,
  CreateChannel,
  CreateCategory,
  DeleteChannel,
  CreateRole,
  DeleteRole,
  AddFriend,
  UpdatePresence,
}

type ModalMapping = {
  [ModalId.NewGuild]: NewGuildModalPage,
  [ModalId.LeaveGuild]: Guild,
  [ModalId.DeleteGuild]: Guild,
  [ModalId.CreateInvite]: Guild,
  [ModalId.CreateChannel]: { guildId: bigint, parentId?: bigint },
  [ModalId.CreateCategory]: { guildId: bigint, parentId?: bigint },
  [ModalId.DeleteChannel]: GuildChannel,
  [ModalId.CreateRole]: bigint,
  [ModalId.DeleteRole]: Role,
  [ModalId.AddFriend]: undefined,
  [ModalId.UpdatePresence]: undefined,
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

export default function ModalContainer(
  { isShowing, hide, children }: ParentProps<{ isShowing: Accessor<boolean>, hide: () => void }>
) {
  const [invisible, setInvisible] = createSignal(true)
  createEffect(() => {
    if (isShowing()) setInvisible(false)
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
          "opacity-0 z-[-90]": !isShowing(),
          "opacity-100 z-[9999]": isShowing(),
          "invisible": invisible(),
          "visible": !invisible(),
        }}
        onClick={(event) => event.currentTarget == event.target && hide()}
      >
        <div classList={{
          "relative bg-2 p-6 rounded-lg max-w-xl transition-all duration-200 mx-2": true,
          "scale-50": !isShowing(),
          "scale-100": isShowing(),
        }}>
          <button>
            <Icon
              icon={Xmark}
              title="Close Modal"
              class="w-5 h-5 fill-fg absolute right-4 top-4 select-none opacity-50 hover:opacity-100 transition-all duration-200"
              onClick={() => hide()}
            />
          </button>
          {children}
        </div>
      </div>
    </Portal>
  )
}

export function ModalProvider(props: ParentProps) {
  const [stack, setStack] = createSignal<ModalDataPair[]>([])
  const context = {
    getModal: () => stack()[stack().length - 1] ?? null,
    get id() { return this.getModal()?.[0] },
    get data() { return this.getModal()?.[1] },

    showModal<T extends ModalId>(id: T, data?: ModalMapping[T]) {
      setStack(prev => [...prev, [id, data] as ModalDataPair])
    },
    hideModal() {
      setStack(prev => prev.slice(0, -1))
    },
  }

  return (
    <ModalContext.Provider value={context}>
      {props.children}
      <ModalContainer isShowing={() => context.getModal() != null} hide={() => context.hideModal()}>
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
