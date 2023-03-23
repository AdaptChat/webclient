import {useNavigate} from "@solidjs/router";
import Layout, {LayoutProps} from "../Layout";
import {SettingsSidebar} from "../../components/settings/SettingsSidebar";
import {onCleanup, onMount, ParentProps} from "solid-js";
import Xmark from "../../components/icons/svg/Xmark";

export default function SettingsLayout({ children, ...props }: ParentProps<LayoutProps>) {
  const navigate = useNavigate()

  props.actionButtons ??= []
  props.actionButtons.push({
    icon: Xmark,
    alt: 'Exit Settings',
    onClick: () => navigate('/'),
  })

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate('/')
  }
  onMount(() => document.addEventListener('keydown', handleKeyDown))
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

  return (
    <Layout sidebar={SettingsSidebar} showBottomNav hideGuildSelect {...props}>
      {children}
    </Layout>
  )
}
