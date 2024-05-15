import {A, useLocation} from "@solidjs/router";
import {createSignal} from "solid-js";
import Modal from "../../components/ui/Modal";
import AddFriendModal from "../../components/friends/AddFriendModal";
import UserPlus from "../../components/icons/svg/UserPlus";
import {ActionButton} from "../../App";
import {createMediaQuery} from "@solid-primitives/media";

export interface NavEntryProps {
  href: string,
  label: string,
}

export function NavEntry(props: NavEntryProps) {
  const href = props.href
  return (
    <A
      href={href}
      classList={{
        "text-sm font-sans font-medium py-1 px-2 rounded-lg transition": true,
        "bg-accent": useLocation().pathname == href,
        "hover:bg-3": useLocation().pathname != href,
      }}
    >
      {props.label}
    </A>
  )
}

export function FriendsNav() {
  const isXs = createMediaQuery("(max-width: 385px)", false)

  return (
    <span class="flex items-center">
      Friends
      <div class="bg-fg/20 w-0.5 h-full mx-4 rounded-full select-none">&nbsp;</div>
      <div class="flex items-center gap-2 max-w-sm overflow-x-auto">
        <NavEntry href="/friends" label="Friends" />
        <NavEntry href="/friends/requests" label={isXs() ? "Req." : "Requests"} />
      </div>
    </span>
  )
}

export function FriendActions() {
  const [showAddFriendModal, setShowAddFriendModal] = createSignal(false)

  return (
    <>
      <Modal get={showAddFriendModal} set={setShowAddFriendModal}>
        <AddFriendModal />
      </Modal>
      <ActionButton
        id="add-friend"
        onClick={() => setShowAddFriendModal(true)} icon={UserPlus} label="Add Friend"
      />
    </>
  )
}