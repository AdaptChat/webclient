import { For, Show, createMemo, createEffect, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import Fuse from "fuse.js";
import { getApi } from "../../../api/Api";
import { memberKey } from "../../../api/ApiCache";
import { displayName, extendedColor, humanizeTimeDelta, snowflakes } from "../../../utils";
import { Member, Role } from "../../../types/guild";
import { User } from "../../../types/user";
import Icon from "../../../components/icons/Icon";
import MagnifyingGlass from "../../../components/icons/svg/MagnifyingGlass";
import Xmark from "../../../components/icons/svg/Xmark";
import UserMinus from "../../../components/icons/svg/UserMinus";
import Crown from "../../../components/icons/svg/Crown";
import Header from "../../../components/ui/Header";
import { toast } from "solid-toast";
import { useModal, ModalId } from "../../../components/ui/Modal";
import { UserFlags } from "../../../api/Bitflags";
import PenToSquare from "../../../components/icons/svg/PenToSquare";
import useContextMenu from "../../../hooks/useContextMenu";
import ContextMenu, { ContextMenuButton } from "../../../components/ui/ContextMenu";
import Code from "../../../components/icons/svg/Code";
import EllipsisVertical from "../../../components/icons/svg/EllipsisVertical";
import Funnel from "../../../components/icons/svg/Funnel";
import ChevronDown from "../../../components/icons/svg/ChevronDown";
import tooltip from "../../../directives/tooltip";
import Plus from "../../../components/icons/svg/Plus";
import UserTag from "../../../components/icons/svg/UserTag";
import Gavel from "../../../components/icons/svg/Gavel";
void tooltip;

// Helpers
function createdAgo(id: bigint) {
  const created = snowflakes.timestampMillis(id)
  return humanizeTimeDelta(Date.now() - created) + ' ago'
}

function createdDt(id: bigint) {
  const created = new Date(snowflakes.timestampMillis(id))
  return created.toLocaleString()
}

function joinedAgo(joined_at: string) {
  const joined = new Date(joined_at).getTime()
  return humanizeTimeDelta(Date.now() - joined) + ' ago'
}

function joinedDt(joined_at: string) {
  const joined = new Date(joined_at)
  return joined.toLocaleString()
}

export default function MemberSettings() {
  const api = getApi()!;
  const cache = api.cache!;
  const params = useParams();
  const guildId = createMemo(() => BigInt(params.guildId as any));

  const permissions = createMemo(() => cache.getClientPermissions(guildId()));

  const allRoles = createMemo(() => {
    const guild = cache.guilds.get(guildId());
    const roles = guild?.roles ?? [];
    return [...roles].sort((a, b) => b.position - a.position);
  });

  const members = createMemo(() => {
    const ids = cache.memberReactor.get(guildId()) ?? [];
    const list = ids.map((u) => ({
      ...(cache.users.get(u) || {}),
      ...(cache.members.get(memberKey(guildId(), u)) || {}),
    })) as (Member & Partial<User>)[];
    return list.filter((m): m is Member & User => !!m && (m as any).username != null);
  });

  const [query, setQuery] = createSignal("");
  const [roleFilter, setRoleFilter] = createSignal<string>("all");

  const fuseIndex = createMemo(
    () =>
      new Fuse(members(), {
        keys: ["username", "display_name", "nick"],
        threshold: 0.2,
      })
  );
  const filteredMembers = createMemo(() => {
    let base = query() ? fuseIndex().search(query()).map((r) => r.item) : members();
    // Also support searching by numeric ID substring
    const q = query().trim();
    if (q) {
      const digits = q.replace(/[^0-9]/g, '');
      if (digits.length) {
        const byId = members().filter(m => m.id.toString().includes(digits));
        const ids = new Set(base.map(m => m.id.toString()));
        for (const m of byId) if (!ids.has(m.id.toString())) base.push(m);
      }
    }
    const roleIdStr = roleFilter();
    if (roleIdStr === "all") return base;
    const roleId = BigInt(roleIdStr);
    return base.filter((m) => (m.roles ?? []).map(BigInt).includes(roleId));
  });

  type SortKey = 'name' | 'created' | 'joined'
  const [sortKey, setSortKey] = createSignal<SortKey>('name')
  const [sortDir, setSortDir] = createSignal<'asc' | 'desc'>('asc')
  const sortFn = (a: Member & User, b: Member & User) => {
    let va: number | string, vb: number | string
    switch (sortKey()) {
      case 'created':
        va = snowflakes.timestampMillis(a.id)
        vb = snowflakes.timestampMillis(b.id)
        break
      case 'joined':
        va = new Date(a.joined_at).getTime()
        vb = new Date(b.joined_at).getTime()
        break
      default:
        va = displayName(a).toLowerCase()
        vb = displayName(b).toLowerCase()
    }
    const dir = sortDir() === 'asc' ? 1 : -1
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  }
  const visibleMembers = createMemo(() => [...filteredMembers()].sort(sortFn))

  const canManageRoles = createMemo(() => permissions().has("MANAGE_ROLES"));
  const canManageNicks = createMemo(() => permissions().has("MANAGE_NICKNAMES"));
  const canKick = createMemo(() => permissions().has("KICK_MEMBERS"));
  const canBan = createMemo(() => permissions().has("BAN_MEMBERS"));

  const defaultRoleId = createMemo(() => (cache.guilds.get(guildId())?.roles ?? []).find(r => r.position === 0)?.id);

  const updateMember = async (userId: bigint, data: any) => {
    const resp = await api.request("PATCH", `/guilds/${guildId()}/members/${userId}`, { json: data });
    if (!resp.ok) throw new Error(resp.errorJsonOrThrow().message);
    const updated = await resp.jsonOrThrow();
    cache.updateMember(updated);
    return { ...(cache.users.get(userId) || {}), ...updated } as Member & User;
  }

  const kickMember = async (userId: bigint) => {
    const resp = await api.request("DELETE", `/guilds/${guildId()}/members/${userId}`);
    if (!resp.ok) throw new Error(resp.errorJsonOrThrow().message);
  };

  const banMember = async (userId: bigint) => {
    const resp = await api.request("PUT", `/guilds/${guildId()}/bans/${userId}`);
    if (!resp.ok) throw new Error(resp.errorJsonOrThrow().message);
  };

  const { showModal } = useModal();

  let searchRef: HTMLInputElement | null = null;

  // Consolidated permission checks
  const isSelf = (id: bigint) => cache.clientId === id
  const isOwner = createMemo(() => cache.clientId === cache.guilds.get(guildId())?.owner_id)
  const canManageMember = (id: bigint) => isOwner() || cache.clientCanManage(guildId(), id)
  const canEditNick = (id: bigint) => isOwner() || (
    (canManageNicks() && canManageMember(id) && !isSelf(id))
  ) || (
    isSelf(id) && permissions().has('CHANGE_NICKNAME')
  )
  const canEditRolesFor = (id: bigint) => isOwner() || (
    (canManageRoles() && canManageMember(id) && !isSelf(id))
  ) || (
    isSelf(id) && canManageRoles()
  )
  const canKickMember = (id: bigint) => canKick() && canManageMember(id) && !isSelf(id)
  const canBanMember = (id: bigint) => canBan() && canManageMember(id) && !isSelf(id)
  const clientTopRole = createMemo(() => cache.getMemberTopRole(guildId(), cache.clientId!))
  const canRemoveRole = (memberId: bigint, role: Role) => isOwner()
    || canManageRoles() 
    && (canManageMember(memberId) || isSelf(memberId)) 
    && role.position < (clientTopRole()?.position ?? Infinity)

  // Small components
  function RoleBadge(props: {
    role: Role,
    member: Member & User,
    removable: boolean,
    onRemove: () => void,
  }) {
    return (
      <button
        class="px-2 py-0.5 cursor-pointer rounded-full text-xs font-medium whitespace-nowrap bg-fg/10 text-fg flex items-center group/role"
        classList={{ 'hover:bg-danger transition': props.removable }}
        use:tooltip={props.removable ? 'Remove role' : undefined}
        onClick={(e) => { 
          if (props.removable) { e.stopPropagation(); props.onRemove() }
        }}
      >
        <span
          class="inline-flex items-center justify-center mr-1 w-2 h-2 rounded-full"
          classList={{ 'group-hover/role:!bg-none group-hover/role:!bg-transparent': props.removable }}
          style={extendedColor.roleBg(props.role.color)}
        >
          <Show when={props.removable}>
            <span class="w-2 h-2 rounded-none text-[10px] leading-none text-fg hidden group-hover/role:inline">
              &#10007;
            </span>
          </Show>
        </span>
        {props.role.name}
      </button>
    )
  }

  // Dropdowns
  function FilterDropdown() {
    const [open, setOpen] = createSignal(false)
    const [search, setSearch] = createSignal("")
    let ddRef: HTMLInputElement | null = null
    const roleIndex = createMemo(() => new Fuse(allRoles(), { keys: ['name'] }))
    const results = createMemo(() => {
      const base = [{ id: 'all', name: 'All roles', position: Infinity } as any, ...allRoles()]
      if (!search()) return base
      const r = roleIndex().search(search()).map(r => r.item)
      return [{ id: 'all', name: 'All roles', position: Infinity } as any, ...r]
    })
    const listener = (event: MouseEvent) => { if (open() && !(event.target as Element).classList.contains('_ignore')) setOpen(false) }
    createEffect(() => {
      if (open()) { 
        (ddRef as any)?.focus(); 
        document.addEventListener('click', listener)
      } else {
        document.removeEventListener('click', listener) 
      }
    })
    const currentName = createMemo(() => {
      if (roleFilter() === 'all') return 'All roles'
      const r = allRoles().find(r => r.id.toString() === roleFilter())
      return r?.name ?? 'All roles'
    })
    const colorStyle = createMemo(() => roleFilter() === 'all'
      ? undefined
      : extendedColor.fg(allRoles().find(r => r.id.toString() === roleFilter())?.color)
    )

    return (
      <div class="relative _ignore">
        <button class="btn btn-ghost btn-sm text-fg _ignore flex items-center gap-2" onClick={() => setOpen(v => !v)} style={colorStyle()}>
          <Icon icon={Funnel} class="w-4 h-4 fill-fg/80" />
          {currentName()}
          <Icon icon={ChevronDown} class="w-3.5 h-3.5 fill-fg/60 transition-transform" classList={{ 'rotate-180': open(), 'rotate-0': !open() }} />
        </button>
        <div
          class="absolute right-0 w-56 rounded-xl overflow-hidden z-[100] transition-all _ignore" 
          classList={{ "opacity-100 top-10 pointer-events-auto": open(), "opacity-0 top-8 pointer-events-none": !open() }}
        >
          <div class="flex flex-col bg-bg-1/80 backdrop-blur _ignore">
            <div class="flex items-center _ignore bg-bg-0">
              <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/60 my-2 ml-2.5 _ignore" />
              <input
                ref={ddRef!}
                type="text" 
                class="w-full py-2 px-2 outline-none font-medium bg-bg-0 text-sm _ignore"
                placeholder="Search roles..." value={search()} onInput={(e) => setSearch(e.currentTarget.value)} 
              />
              <Show when={search()}>
                <Icon icon={Xmark} class="w-4 h-4 fill-fg/60 mr-2 cursor-pointer _ignore" onClick={() => setSearch('')} />
              </Show>
            </div>
            <div class="max-h-64 overflow-auto">
              <For each={results()}>{(entry: any) => (
                <button 
                  class="flex items-center p-2 gap-x-2 hover:bg-fg/10 transition text-sm truncate _ignore text-fg w-full text-left" 
                  onClick={() => { setRoleFilter(entry.id.toString()); setOpen(false); setSearch('') }}
                >
                  {entry.id !== 'all' && <span class="w-2 h-2 rounded-full inline-block" style={extendedColor.roleBg(entry.color)} />}
                  {entry.name}
                </button>
              )}</For>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function SortDropdown() {
    const [open, setOpen] = createSignal(false)
    const options: { key: SortKey, dir: 'asc' | 'desc', label: string }[] = [
      { key: 'name', dir: 'asc', label: 'Name' },
      { key: 'created', dir: 'asc', label: 'Account age (asc)' },
      { key: 'created', dir: 'desc', label: 'Account age (desc)' },
      { key: 'joined', dir: 'asc', label: 'Join date (asc)' },
      { key: 'joined', dir: 'desc', label: 'Join date (desc)' },
    ]
    const current = createMemo(() => options.find(o => o.key === sortKey())!.label)
    const listener = (event: MouseEvent) => { 
      if (open() && !(event.target as Element).classList.contains('_ignore')) 
        setOpen(false) 
    }
    createEffect(() => { 
      if (open()) 
        document.addEventListener('click', listener);
      else 
        document.removeEventListener('click', listener);
    })

    return (
      <div class="relative _ignore">
        <button class="btn btn-ghost btn-sm text-fg _ignore flex items-center gap-2" onClick={() => setOpen(v => !v)}>
          Sort: {current()}
          <Icon icon={ChevronDown} class="w-3.5 h-3.5 fill-fg/60 transition-transform" classList={{ 'rotate-180': open(), 'rotate-0': !open() }} />
        </button>
        <div 
          class="absolute right-0 w-40 rounded-xl overflow-hidden z-[100] transition-all _ignore" 
          classList={{ "opacity-100 top-10 pointer-events-auto": open(), "opacity-0 top-8 pointer-events-none": !open() }}
        >
          <div class="flex flex-col bg-bg-0/90 backdrop-blur _ignore">
            <For each={options}>{(opt) => (
              <button 
                class="flex items-center p-2 gap-x-2 hover:bg-fg/10 transition text-sm truncate _ignore text-fg"
                onClick={() => { setSortKey(opt.key); setOpen(false); setSortDir(opt.dir) }}
              >
                {opt.label}
              </button>
            )}</For>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div class="px-4 pt-2 pb-6 text-fg">
      <Header>Members</Header>
        <p class="mb-4 font-light text-sm text-fg/50">
          View and manage members in your server.
        </p>

      <div class="flex gap-3 mb-4 mobile:flex-col">
        <div class="flex flex-grow bg-bg-0 rounded-lg items-center">
          <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg my-2 ml-2.5 opacity-60" />
          <input
            ref={searchRef!}
            type="text"
            class="w-full text-sm p-2 outline-none font-medium bg-transparent"
            placeholder="Search Members..."
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
          <Show when={query()}>
            <Icon
              icon={Xmark}
              class="w-4 h-4 fill-fg mr-3 cursor-pointer opacity-60 hover:opacity-100 transition duration-200"
              onClick={() => {
                setQuery("");
                searchRef!.focus();
              }}
            />
          </Show>
        </div>
        <div class="flex gap-1 self-end">
          <FilterDropdown />
          <SortDropdown />
        </div>
      </div>

      <div class="flex items-center justify-between mb-2 text-fg/50 uppercase text-xs font-bold">
        <Show when={query() || roleFilter() !== 'all'} fallback={
          <span>Showing all {members().length} members</span>
        }>
          <span>Showing {filteredMembers().length} out of {members().length} members</span>
        </Show>
      </div>

      <div class="text-fg bg-bg-1/80 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="text-fg/60 bg-bg-0">
              <tr>
                <th class="text-left font-semibold px-3 py-2 w-12"> </th>
                <th class="text-left font-semibold font-title px-3 py-2 w-32">Member</th>
                <th class="text-left font-semibold font-title px-3 py-2 mobile:hidden">Roles</th>
                <th class="text-left font-semibold font-title px-3 py-2 w-32 lg:table-cell hidden">Created</th>
                <th class="text-left font-semibold font-title px-3 py-2 w-32 xl:table-cell hidden">Joined</th>
                <th class="text-left font-semibold font-title px-3 py-2 w-32" />
              </tr>
            </thead>
            <tbody>
              <For each={visibleMembers()}>{(m) => (
                <tr class="group hover:bg-fg/10 transition" onContextMenu={useContextMenu()!.getHandler(
                  <ContextMenu>
                    <ContextMenuButton icon={Code} label="Copy User ID" onClick={() => window.navigator.clipboard.writeText(m.id.toString())} />
                  </ContextMenu>
                )}>
                  <td class="py-2 align-middle">
                    <img src={cache.avatarOf(m.id)} alt="" class="w-8 h-8 ml-4 rounded-full" />
                  </td>
                  <td class="px-3 py-2 align-middle min-w-[12rem]">
                    <div class="flex items-center gap-2">
                      <span class="font-title truncate" style={extendedColor.fg(cache.getMemberColor(guildId(), m.id))}>{displayName(m)}</span>
                      <Show when={UserFlags.fromValue(m.flags).has('BOT')}>
                        <span class="text-[10px] rounded-lg px-1 bg-accent">BOT</span>
                      </Show>
                      <Show when={m.id === cache.guilds.get(guildId())?.owner_id}>
                        <Icon icon={Crown} class="w-4 h-4 fill-yellow-400" />
                      </Show>
                    </div>
                    <Show when={displayName(m) !== m.username}>
                      <div class="text-xs text-fg/60 truncate">@{m.username}</div>
                    </Show>
                  </td>
                  <td class="px-3 py-2 align-middle mobile:hidden">
                    <div class="flex flex-wrap gap-1 items-center">
                      <For each={cache.getMemberRoles(guildId(), m.id).filter(r => r.id !== defaultRoleId())}>
                        {(role) => (
                          <RoleBadge
                            role={role}
                            member={m as any}
                            removable={canRemoveRole(m.id, role)}
                            onRemove={async () => {
                              const roles = (m.roles ?? []).map(BigInt).filter(id => id !== role.id)
                              await toast.promise(updateMember(m.id, { roles }), {
                                loading: 'Updating roles...', success: 'Role removed', error: (e) => (e as Error).message,
                              })
                            }}
                          />
                        )}
                      </For>
                      <Show when={canEditRolesFor(m.id)}>
                        <button class="group p-1" onClick={() => showModal(ModalId.EditMemberRoles, { guildId: guildId(), memberId: m.id })}>
                          <Icon icon={Plus} class="w-3.5 h-3.5 fill-fg/70 group-hover:fill-fg/100 transition" tooltip="Add/Edit Roles" />
                        </button>
                      </Show>
                    </div>
                  </td>
                  <td class="px-3 py-2 align-middle hidden lg:table-cell font-light text-fg/70">
                    <span use:tooltip={createdDt(m.id)}>{createdAgo(m.id)}</span>
                  </td>
                  <td class="px-3 py-2 align-middle hidden xl:table-cell font-light text-fg/70">
                    <span use:tooltip={joinedDt(m.joined_at)}>{joinedAgo(m.joined_at)}</span>
                  </td>
                  <td class="px-3 py-2 text-right">
                    <div class="flex items-center gap-2">
                      <Show when={canEditNick(m.id)}>
                        <button class="group p-1" onClick={() => showModal(
                          ModalId.EditNickname, 
                          { guildId: guildId(), memberId: m.id, current: (cache.members.get(memberKey(guildId(), m.id)) as any)?.nick ?? '' }
                        )}>
                          <Icon icon={PenToSquare} class="w-4 h-4 fill-fg/70 group-hover:fill-fg/100 transition" tooltip="Edit Nickname" />
                        </button>
                      </Show>
                      <Show when={canEditRolesFor(m.id)}>
                        <button class="group p-1 hidden mobile:block" onClick={() => showModal(ModalId.EditMemberRoles, { guildId: guildId(), memberId: m.id })}>
                          <Icon icon={UserTag} class="w-4 h-4 fill-fg/70 group-hover:fill-fg/100 transition" tooltip="Edit Roles" />
                        </button>
                      </Show>
                      <Show when={canKickMember(m.id)}>
                        <button class="group/inner p-1" onClick={() => toast.promise(kickMember(m.id), { loading: 'Kicking...', success: 'User kicked.', error: (e) => (e as Error).message })}>
                          <Icon icon={UserMinus} class="w-4 h-4 fill-fg/70 group-hover:fill-fg/100 group-hover/inner:!fill-danger" tooltip="Kick Member" />
                        </button>
                      </Show>
                      <Show when={canBanMember(m.id)}>
                        <button class="group/inner p-1" onClick={() => toast.promise(banMember(m.id), { loading: 'Banning...', success: 'User banned.', error: (e) => (e as Error).message })}>
                          <Icon icon={Gavel} class="w-4 h-4 fill-fg/70 group-hover:fill-fg/100 group-hover/inner:!fill-danger" tooltip="Ban Member" />
                        </button>
                      </Show>
                      <button class="group p-1 mobile:flex hidden" onClick={useContextMenu()!.getHandler(
                        <ContextMenu>
                          <ContextMenuButton icon={Code} label="Copy User ID" onClick={() => window.navigator.clipboard.writeText(m.id.toString())} />
                        </ContextMenu>
                      )}>
                        <Icon icon={EllipsisVertical} class="w-4 h-4 fill-fg/70 group-hover:fill-fg/100 transition" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
