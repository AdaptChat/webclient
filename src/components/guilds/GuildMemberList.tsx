// Issues:
// Unfortunatenly I had to remove badge and add a custom one, since it ruined the responsiveness completely and I couldn't be bothered fixing it

import {getApi} from "../../api/Api";
import {useNavigate, useParams} from "@solidjs/router";
import {Accessor, createEffect, createMemo, createSignal, For, Show} from "solid-js";
import StatusIndicator from "../users/StatusIndicator";
import SidebarSection from "../ui/SidebarSection";
import {ReactiveSet} from "@solid-primitives/set";
import {displayName, extendedColor, maxIterator, setDifference} from "../../utils";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import UserPlus from "../icons/svg/UserPlus";
import {toast} from "solid-toast";
import Code from "../icons/svg/Code";
import MagnifyingGlass from "../icons/svg/MagnifyingGlass";
import Icon from "../icons/Icon";
import Xmark from "../icons/svg/Xmark";
import Fuse from "fuse.js";
import {User} from "../../types/user";
import {Role} from "../../types/guild";
import {RoleFlags, UserFlags} from "../../api/Bitflags";
import {memberKey} from "../../api/ApiCache";
import EyeSlash from "../icons/svg/EyeSlash";
import Crown from "../icons/svg/Crown";
import Robot from "../icons/svg/Robot";
import UserMinus from "../icons/svg/UserMinus";

export function GuildMemberGroup(props: { members: Iterable<User | bigint>, offline?: boolean }) {
  const api = getApi()!
  const cache = api.cache!
  const params = useParams()
  const navigate = useNavigate()
  const contextMenu = useContextMenu()!

  const guildId = () => BigInt(params.guildId)
  const ownerId = createMemo(() => cache.guilds.get(guildId())?.owner_id)
  const channelId = createMemo(() => params.channelId ? BigInt(params.channelId) : undefined)
  const permissions = createMemo(() => cache.getClientPermissions(guildId()))

  const kickMember = async (id: bigint) => {
    const response = await api.request('DELETE', `/guilds/${guildId()}/members/${id}`)
    if (!response.ok) throw new Error(response.errorJsonOrThrow().message)
  }

  return (
    <For each={[...props.members]}>
      {(userOrId) => {
        const user_id = typeof userOrId === "bigint" ? userOrId : userOrId.id
        const user = typeof userOrId === "bigint" ? cache.users.get(userOrId)! : userOrId
        const color = createMemo(() => cache.getMemberColor(guildId(), user_id))
        const viewable = createMemo(() => cache.getMemberPermissions(guildId(), user_id, channelId()).has('VIEW_CHANNEL'))
        const isBot = () => UserFlags.fromValue(user.flags).has('BOT')
        const presence = () => cache.presences.get(user_id)

        const isSelf = () => cache.clientId === user_id
        const canManage = createMemo(() => cache.clientCanManage(guildId(), user_id))

        return (
          <div
            class="group flex items-center px-2 py-1.5 rounded-lg hover:bg-3 transition duration-200 cursor-pointer"
            onContextMenu={contextMenu.getHandler(
              <ContextMenu>
                <Show when={!isSelf() && !isBot()}>
                  <ContextMenuButton
                    icon={UserPlus}
                    label="Add Friend"
                    onClick={() => toast.promise(
                      (async () => {
                        const response = await api.request('POST', '/relationships/friends', {
                          json: { username: user.username },
                        })
                        if (!response.ok) throw new Error(response.errorJsonOrThrow().message)
                      })(),
                      {
                        loading: 'Sending friend request...',
                        success: 'Friend request sent.',
                        error: (err) => err.message,
                      }
                    )}
                  />
                </Show>
                <Show when={isBot()}>
                  <ContextMenuButton icon={Robot} label="Add Bot" onClick={() => navigate(`/bots/${user_id}`)} />
                </Show>
                <ContextMenuButton
                  icon={Code}
                  label="Copy User ID"
                  onClick={() => window.navigator.clipboard.writeText(user.id.toString())}
                />
                <Show when={!isSelf() && canManage() && permissions().has('KICK_MEMBERS')}>
                  <DangerContextMenuButton
                    icon={UserMinus}
                    label="Kick Member"
                    onClick={() => toast.promise(
                      kickMember(user_id),
                      {
                        loading: 'Kicking user...',
                        success: 'User kicked.',
                        error: (err) => err.message,
                      }
                    )}
                  />
                </Show>
              </ContextMenu>
            )}
          >
            <div class="indicator flex-shrink-0">
              <StatusIndicator status={presence()?.status} tailwind="m-[0.2rem] w-2.5 h-2.5" indicator />
              <img
                src={cache.avatarOf(user_id)}
                alt=""
                classList={{
                  "w-8 h-8 rounded-full": true,
                  "filter grayscale group-hover:grayscale-0 transition duration-1000": props.offline,
                }}
              />
            </div>
            <div class="flex flex-col ml-3 flex-grow min-w-0">
              <span class="flex items-center gap-x-1.5 text-sm">
                <span
                  class="truncate min-w-0"
                  classList={{
                    "text-fg": color() == null,
                    "opacity-60": props.offline,
                    "!opacity-80": !props.offline && !color(),
                  }}
                  style={extendedColor.fg(color())}
                >
                  {displayName(user)}
                </span>
                <Show when={isBot()}>
                  <span class="text-xs rounded px-1 py-[1px] bg-accent">BOT</span>
                </Show>
              </span>
              <Show when={presence()?.custom_status}>
                <span class="text-xs text-fg/60 truncate min-w-0">{presence()?.custom_status}</span>
              </Show>
            </div>
            <Show when={!viewable()}>
              <Icon icon={EyeSlash} class="w-4 h-4 fill-fg/30" tooltip="This user cannot view this channel" />
            </Show>
            <Show when={user_id == ownerId()}>
              <Icon icon={Crown} class="w-4 h-4 fill-yellow-400" tooltip="Owner" />
            </Show>
          </div>
        )
      }}
    </For>
  )
}

const fuse = function<T>(value: string, index: Accessor<Fuse<T>>, fallback: Accessor<T[]>) {
  return value
    ? index()?.search(value).map(result => result.item)
    : fallback()
}

export default function GuildMemberList() {
  const api = getApi()!;
  const params = useParams();
  const guildId = () => BigInt(params.guildId);
  const guildMemo = createMemo(() => api.cache!.guilds.get(guildId()));
  if (!guildMemo()) return null;

  const online = new ReactiveSet<bigint>();
  const offline = new ReactiveSet<bigint>();

  const membersMemo = createMemo(() => api.cache!.memberReactor.get(guildMemo()!.id));
  createEffect<Set<bigint> | undefined>((tracked) => {
    const members = membersMemo();
    if (members == null) return;

    for (const member of members) {
      if (tracked?.has(member)) continue;

      createEffect((prev) => {
        const status = api.cache!.presences.get(member)?.status;
        if (prev != null && (prev === 'offline') === (status === 'offline')) return status;

        if (status === 'offline' || !status) {
          online.delete(member);
          offline.add(member);
        } else {
          offline.delete(member);
          online.add(member);
        }
        return status;
      });
    }
    const updated = new Set(members);
    if (tracked) {
      for (const removed of setDifference(tracked, updated)) {
        online.delete(removed);
        offline.delete(removed);
      }
    }
    return updated;
  }, new Set<bigint>());

  const roleGroups = createMemo(() => {
    const roles = api.cache!.roles;
    const groups = new Map<bigint, { name: string, position: number, members: bigint[], icon?: string }>();
    const noRoles = [] as bigint[];

    for (const member of online) {
      const memberRoles = api.cache!.members.get(memberKey(guildId(), member))?.roles?.map(BigInt) ?? [];
      const resolved = memberRoles
        .map(r => roles.get(r))
        .filter((r): r is Role => r! && RoleFlags.fromValue(r.flags).has('HOISTED'));

      if (!resolved.length) {
        noRoles.push(member);
        continue;
      }

      const topHoistedRole = maxIterator(resolved, r => r.position)!;
      let group = groups.get(topHoistedRole.id);
      if (!group) {
        group = { name: topHoistedRole.name, position: topHoistedRole.position, members: [], icon: topHoistedRole.icon };
        groups.set(topHoistedRole.id, group);
      }
      group.members.push(member);
    }
    return [noRoles, [...groups.values()].sort((a, b) => b.position - a.position)] as const;
  });
  const noRoles = () => roleGroups()[0];
  const groups = () => roleGroups()[1];

  let searchRef: HTMLInputElement | null = null;
  const [searchQuery, setSearchQuery] = createSignal('');

  const members = createMemo(() => {
    const cache = api.cache;
    if (!cache) return [];

    const m = cache.memberReactor.get(BigInt(params.guildId))?.map(u => cache.users.get(u)) ?? [];
    return m.filter((u): u is User => !!u);
  });
  const fuseMemberIndex = createMemo(() => new Fuse(members()!, {
    keys: ['username', 'display_name'], // TODO: nickname
  }));
  const memberResults = createMemo(() => searchQuery() ? fuse(searchQuery(), fuseMemberIndex, members) : null);

  return (
    <div class="flex flex-col w-full">
      <div class="flex bg-bg-2/80 rounded-lg items-center">
        <Icon icon={MagnifyingGlass} class="w-3.5 h-3.5 fill-fg/50 my-2 ml-2.5" />
        <input
          ref={searchRef!}
          type="text"
          class="w-full text-sm p-2 outline-none font-medium bg-transparent"
          placeholder="Search this Server..."
          value={searchQuery()}
          onInput={(event) => setSearchQuery(event.currentTarget.value)}
        />
        <Show when={searchQuery()}>
          <Icon
            icon={Xmark}
            class="w-4 h-4 fill-fg/50 mr-3 cursor-pointer hover:fill-fg/80 transition duration-200"
            onClick={() => {
              setSearchQuery('');
              searchRef!.focus();
            }}
          />
        </Show>
      </div>
      <Show when={searchQuery()} fallback={
        <>
          <For each={groups()}>
            {(group) => (
              <Show when={group.members.length}>
                <SidebarSection>
                  <div class="flex items-center w-full">
                    {group.icon && (
                      <img
                        src={group.icon}
                        alt="Role Icon"
                        class="inline-block mr-2 rounded"
                        style={{ width: '20px', height: '20px' }}
                      />
                    )}
                    <span class="flex-grow">{group.name}</span>
                    <span class="ml-1"> — {group.members.length}</span>
                  </div>
                </SidebarSection>
                <GuildMemberGroup members={group.members} />
              </Show>
            )}
          </For>
          <Show when={noRoles().length} keyed={false}>
            <SidebarSection>
              <div class="flex items-center w-full">
                <span class="flex-grow">Online</span>
                <span class="ml-1"> — {noRoles().length}</span>
              </div>
            </SidebarSection>
            <GuildMemberGroup members={noRoles()} />
          </Show>
          <Show when={offline.size} keyed={false}>
            <SidebarSection>
              <div class="flex items-center w-full">
                <span class="flex-grow">Offline</span>
                <span class="ml-1"> — {offline.size}</span>
              </div>
            </SidebarSection>
            <GuildMemberGroup members={offline} offline />
          </Show>
        </>
      }>
        <Show when={memberResults()}>
          <SidebarSection>
            <div class="flex items-center w-full">
              <span class="flex-grow">Members</span>
              <span class="ml-2 rounded-[25%] bg-0 text-white rounded px-2 py-1 text-s">{memberResults()!.length}</span>
            </div>
          </SidebarSection>
          <GuildMemberGroup members={memberResults()!} />
        </Show>
      </Show>
    </div>
  );
}