import SidebarButton from "../ui/SidebarButton";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import SidebarSection from "../ui/SidebarSection";
noop(tooltip)

export function SettingsSidebar() {
  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="flex flex-col w-full p-2">
        <SidebarSection>User Settings</SidebarSection>
        <SidebarButton href={["/settings/account", "/settings"]} svg="/icons/user.svg">Account</SidebarButton>
        <SidebarButton
          svg="/icons/right-from-bracket.svg"
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
