import { For, Show, createMemo, createSignal } from "solid-js";
import { getApi } from "../../api/Api";
import { ModalTemplate, useModal } from "../ui/Modal";
import { extendedColor } from "../../utils";
import { memberKey } from "../../api/ApiCache";
import { t, tJsx } from "../../i18n";

export default function EditMemberRolesModal(props: { guildId: bigint, memberId: bigint }) {
  const api = getApi()!;
  const cache = api.cache!;
  const { hideModal } = useModal();

  const guild = createMemo(() => cache.guilds.get(props.guildId)!);
  const allRoles = createMemo(() => [...(guild()?.roles ?? [])].sort((a, b) => b.position - a.position));
  const defaultRoleId = createMemo(() => allRoles().find(r => r.position === 0)?.id);
  const clientTop = createMemo(() => cache.getMemberTopRole(props.guildId, cache.clientId!));
  const isOwner = createMemo(() => cache.clientId === guild()?.owner_id);

  const currentRoles = createMemo(() => (cache.members.get(memberKey(props.guildId, props.memberId))?.roles ?? []).map(BigInt));
  const [selected, setSelected] = createSignal<bigint[]>(currentRoles());

  const toggle = (id: bigint) => setSelected(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const unaddable = (position: number) => (clientTop()?.position ?? Infinity) <= position; // cannot manage equal-or-higher

  const save = async () => {
    const resp = await api.request('PATCH', `/guilds/${props.guildId}/members/${props.memberId}`, { json: { roles: selected() } });
    if (!resp.ok) throw new Error(resp.errorJsonOrThrow().message);
    hideModal();
  }

  const username = createMemo(() => cache.users.get(props.memberId)?.username ?? 'Unknown User');
  const guildName = createMemo(() => guild()?.name ?? 'Unknown Guild');

  return (
    <ModalTemplate title={t('modals.edit_roles.title')}>
      <p class="text-sm mt-2 text-fg/60 text-center font-light">
        {tJsx('modals.edit_roles.description', {
          username: <b>{username()}</b>,
          guild: <b>{guildName()}</b>
        })}
        <br />
        {t('modals.edit_roles.save_note')}
      </p>
      <div class="mt-4 max-h-80 sm:min-w-[320px] w-full overflow-auto pr-1">
        <For each={allRoles()}>
          {(role) => (
            <label class="flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition hover:bg-fg/10">
              <div class="flex items-center gap-3">
                <span class="w-3 h-3 rounded-full inline-block" style={extendedColor.roleBg(role.color)} />
                <span
                  class="text-fg font-title font-light"
                  classList={{ 'opacity-50': role.id === defaultRoleId() || unaddable(role.position) && !isOwner() }}
                >
                  {role.name}
                </span>
              </div>
              <input
                type="checkbox"
                class="checkbox"
                disabled={role.id === defaultRoleId() || unaddable(role.position) && !isOwner()}
                checked={selected().includes(BigInt(role.id)) || role.id === defaultRoleId()}
                onInput={() => toggle(BigInt(role.id))}
              />
            </label>
          )}
        </For>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <button type="button" class="btn btn-ghost" onClick={() => hideModal()}>
          {t('generic.cancel')}
        </button>
        <button type="button" class="btn btn-primary" onClick={() => void save()}>
          {t('generic.save')}
        </button>
      </div>
    </ModalTemplate>
  )
}
