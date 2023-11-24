import Layout from "../Layout";
import {Sidebar} from "../Home";
import {A, Route, Routes, useLocation} from "@solidjs/router";
import {createSignal, lazy} from "solid-js";
import Modal from "../../components/ui/Modal";
import AddFriendModal from "../../components/friends/AddFriendModal";
import UserPlus from "../../components/icons/svg/UserPlus";

const FriendsList = lazy(() => import("./FriendsList"))
const Requests = lazy(() => import("./Requests"))

export interface NavEntryProps {
  href: string,
  label: string,
}

export function NavEntry({ href, label }: NavEntryProps) {
  return (
    <A
      href={href}
      classList={{
        "text-sm py-1 px-2 rounded-lg transition": true,
        "bg-accent": useLocation().pathname == href,
        "hover:bg-3": useLocation().pathname != href,
      }}
    >
      {label}
    </A>
  )
}

function FriendsNav() {
  return (
    <>
      <NavEntry href="/friends" label="Friends" />
      <NavEntry href="/friends/requests" label="Requests" />
      {/*
        <NavEntry href="/friends/blocked" label="Blocked" /> TODO
      */}
    </>
  )
}

export default function Friends() {
  const [showAddFriendModal, setShowAddFriendModal] = createSignal(false)

  return (
    <Layout title="Friends" sidebar={Sidebar} topNav={FriendsNav} showBottomNav actionButtons={[
      {
        icon: UserPlus,
        alt: "Add Friend",
        onClick: () => setShowAddFriendModal(true),
      }
    ]}>
      <Modal get={showAddFriendModal} set={setShowAddFriendModal}>
        <AddFriendModal />
      </Modal>
      <Routes>
        <Route path="requests" component={Requests} />
        <Route path="*" component={FriendsList} data={() => ({ setShowAddFriendModal })} />
      </Routes>
    </Layout>
  )
}
