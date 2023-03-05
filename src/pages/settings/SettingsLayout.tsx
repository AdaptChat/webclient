import {useNavigate} from "@solidjs/router";
import Layout, {LayoutProps} from "../Layout";
import {SettingsSidebar} from "../../components/settings/SettingsSidebar";
import {onCleanup, onMount, ParentProps} from "solid-js";

export default function SettingsLayout({ children, ...props }: ParentProps<LayoutProps>) {
  const navigate = useNavigate()

  props.actionButtons ??= []
  props.actionButtons.push({
    icon: '/icons/xmark.svg',
    alt: 'Exit Settings',
    onClick: () => navigate('/'),
  })

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') navigate('/')
  }
  onMount(() => document.addEventListener('keydown', handleKeyDown))
  onCleanup(() => document.removeEventListener('keydown', handleKeyDown))

  return (
    <Layout sidebar={SettingsSidebar} hideGuildSelect {...props}>
      {children}
    </Layout>
  )
}
