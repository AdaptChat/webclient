import {SidebarButton} from "../../pages/Home";
import {ParentProps} from "solid-js";

const Section = ({ children }: ParentProps) => (
  <div class="font-bold text-xs px-1 py-2 uppercase text-base-content/50 select-none mt-1">{children}</div>
)

export function SettingsSidebar() {
  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="flex flex-col w-full p-2">
        <Section>User Settings</Section>
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
