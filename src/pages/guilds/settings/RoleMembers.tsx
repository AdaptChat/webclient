import {createMemo, createSignal, For, Show} from "solid-js";
import {User} from "../../../types/user";
import Fuse from "fuse.js";
import {getApi} from "../../../api/Api";
import {useParams} from "@solidjs/router";
import {displayName} from "../../../utils";
import Icon from "../../../components/icons/Icon";
import MagnifyingGlass from "../../../components/icons/svg/MagnifyingGlass";
import Xmark from "../../../components/icons/svg/Xmark";
import {Member} from "../../../types/guild";
import {memberKey} from "../../../api/ApiCache";

export default function RoleMembers() {
  const api = getApi()!
  const cache = api.cache!

  const params = useParams()
  const roleId = createMemo(() => BigInt(params.roleId))
  const [query, setQuery] = createSignal('')

  const sortFn = (a: Member, b: Member, secondary: number) => {
    const aHasRole = a.roles?.includes(roleId())
    const bHasRole = b.roles?.includes(roleId())
    if (aHasRole && !bHasRole) return -1
    if (!aHasRole && bHasRole) return 1
    return secondary
  }
  const members = createMemo(() => {
    const m = cache.memberReactor
      .get(BigInt(params.guildId))
      ?.map(u => ({ ...cache.users.get(u)!, ...cache.members.get(memberKey(BigInt(params.guildId), u)) }))
      ?? []
    return m
      .filter((u): u is Member & User => !!u)
      .sort((a, b) => sortFn(a, b, Number(a.id - b.id)))
  })
  const fuseMemberIndex = createMemo(() => new Fuse(members()!, {
    keys: ['username', 'display_name'], // TODO: nickname
    threshold: 0.2,
  }))
  const memberResults = createMemo(() => {
    let results = query()
      ? fuseMemberIndex().search(query()).map(r => r.item)
      : members()
    return results.length ? results : members()
  })

  let searchRef: HTMLInputElement | null = null

  return (
    <div class="p-2">
      <div class="flex bg-bg-3/80 mb-2 rounded-lg items-center">
        <Icon icon={MagnifyingGlass} class="w-3.5 h-3.5 fill-fg/50 my-2 ml-2.5" />
        <input
          ref={searchRef!}
          type="text"
          class="w-full p-2 outline-none font-medium bg-transparent"
          placeholder="Search Members..."
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
        />
        <Show when={query()}>
          <Icon
            icon={Xmark}
            class="w-5 h-5 fill-fg/50 mr-3.5 cursor-pointer hover:fill-fg/80 transition duration-200"
            onClick={() => {
              setQuery('')
              searchRef!.focus()
            }}
          />
        </Show>
      </div>
      <For each={memberResults()}>
        {member => (
          <div class="flex justify-between items-center py-2 gap-x-2">
            <div class="flex items-center gap-x-2 flex-grow-0">
              <img src={cache.avatarOf(member.id)} alt="" class="w-8 h-8 rounded-full" />
              <div class="flex flex-col">
                <p class="font-title">{displayName(member)}</p>
                <Show when={displayName(member) != member.username}>
                  <p class="text-fg/60 text-sm">@{member.username}</p>
                </Show>
              </div>
            </div>
            <button
              class="btn transition btn-sm flex-shrink-0"
              classList={{ [member.roles?.includes(roleId()) ? "btn-neutral hover:btn-danger" : "btn-primary"]: true }}
              onClick={async () => {
                const json = {
                  roles: member.roles?.includes(roleId())
                    ? member.roles.filter(r => r != roleId())
                    : [...(member.roles ?? []), roleId()]
                }
                await api.request('PATCH', `/guilds/${params.guildId}/members/${member.id}`, { json })
              }}
            >
              {member.roles?.includes(roleId()) ? "Remove Role" : "Add Role"}
            </button>
          </div>
        )}
      </For>
    </div>
  )
}
