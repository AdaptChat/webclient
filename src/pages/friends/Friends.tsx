import {A, useLocation} from "@solidjs/router";
import {Show} from "solid-js";
import {ModalId, useModal} from "../../components/ui/Modal";
import UserPlus from "../../components/icons/svg/UserPlus";
import {ActionButton} from "../../App";
import {createMediaQuery} from "@solid-primitives/media";
import {relationshipFilterFactory} from "./Requests";
import {getApi} from "../../api/Api";

export interface NavEntryProps {
  href: string,
  label: string,
  ping?: boolean,
}

export function NavEntry(props: NavEntryProps) {
  const href = props.href
  const location = useLocation()
  return (
    <A
      href={href}
      classList={{
        "flex items-center text-sm font-sans font-medium py-1 px-2 rounded-lg transition": true,
        "bg-accent": location.pathname == href,
        "hover:bg-3": location.pathname != href,
      }}
    >
      <Show when={props.ping}>
        <span classList={{
          "w-2 h-2 rounded-full mr-1": true,
          [location.pathname == href ? "bg-fg" : "bg-accent"]: true
        }} />
      </Show>
      {props.label}
    </A>
  )
}

export function FriendsNav() {
  const isXs = createMediaQuery("(max-width: 385px)", false)
  const incoming = relationshipFilterFactory(getApi()!, 'incoming_request')

  return (
    <span class="flex items-center">
      Friends
      <div class="bg-fg/20 w-0.5 h-full mx-4 rounded-full select-none">&nbsp;</div>
      <div class="flex items-center gap-2 max-w-sm overflow-x-auto">
        <NavEntry href="/friends" label="Friends" />
        <NavEntry href="/friends/requests" label={isXs() ? "Req." : "Requests"} ping={!!incoming()?.length} />
      </div>
    </span>
  )
}

export function FriendActions() {
  const {showModal} = useModal()

  return (
    <ActionButton
      id="add-friend"
      onClick={() => showModal(ModalId.AddFriend)} icon={UserPlus} label="Add Friend"
    />
  )
}