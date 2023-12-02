import SidebarButton from "../ui/SidebarButton";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import SidebarSection from "../ui/SidebarSection";
import UserIcon from "../icons/svg/User";
import RightFromBracket from "../icons/svg/RightFromBracket";
import Palette from "../icons/svg/Palette";
noop(tooltip)

export function SettingsSidebar() {
  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="flex flex-col w-full p-2">
        <SidebarSection>User Settings</SidebarSection>
        <SidebarButton href={["/settings/account", "/settings"]} svg={UserIcon}>Account</SidebarButton>
        <SidebarSection>Client Settings</SidebarSection>
        <SidebarButton href="/settings/appearance" svg={Palette}>Appearance</SidebarButton>
        <div class="bg-fg/10 h-0.5 my-2 rounded-full" />
        <SidebarButton
          svg={RightFromBracket}
          danger
          onClick={() => {
            window.localStorage.clear()
            window.location.pathname = '/'
          }}
        >
          Log Out
        </SidebarButton>
      </div>
    </div>
  )
}
