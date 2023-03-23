import SidebarButton from "../ui/SidebarButton";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import SidebarSection from "../ui/SidebarSection";
import UserIcon from "../icons/svg/User";
import RightFromBracket from "../icons/svg/RightFromBracket";
noop(tooltip)

export function SettingsSidebar() {
  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="flex flex-col w-full p-2">
        <SidebarSection>User Settings</SidebarSection>
        <SidebarButton href={["/settings/account", "/settings"]} svg={UserIcon}>Account</SidebarButton>
        <SidebarButton
          svg={RightFromBracket}
          danger
          onClick={() => {
            window.localStorage.clear()
            window.location.pathname = '/'
          }}>
          Log Out
        </SidebarButton>
      </div>
    </div>
  )
}
