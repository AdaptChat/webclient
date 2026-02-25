import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { useParams } from "@solidjs/router";
import Fuse from "fuse.js";
import { getApi } from "../../../api/Api";
import { humanizeFullTimestamp, humanizeTimeDelta } from "../../../utils";
import type { GuildBan } from "../../../types/guild";
import Header from "../../../components/ui/Header";
import Icon from "../../../components/icons/Icon";
import MagnifyingGlass from "../../../components/icons/svg/MagnifyingGlass";
import Xmark from "../../../components/icons/svg/Xmark";
import Trash from "../../../components/icons/svg/Trash";
import tooltip from "../../../directives/tooltip";
import { toast } from "solid-toast";
void tooltip;

function formatDate(value: string) {
  return humanizeFullTimestamp(new Date(value));
}

function formatAgo(value: string) {
  return humanizeTimeDelta(Date.now() - new Date(value).getTime()) + " ago";
}

function banDisplayName(ban: GuildBan): string {
  return ban.display_name ?? ban.username ?? ban.id.toString();
}

export default function BanSettings() {
  const api = getApi()!;
  const cache = api.cache!;
  const params = useParams();
  const guildId = createMemo(() => BigInt(params.guildId as any));

  const [loading, setLoading] = createSignal(false);
  const [bans, setBans] = createSignal<GuildBan[]>([]);
  const [query, setQuery] = createSignal("");

  const fetchBans = async () => {
    setLoading(true);
    const resp = await api.request<GuildBan[]>("GET", `/guilds/${guildId()}/bans`);
    if (resp.ok) {
      setBans(resp.jsonOrThrow());
    } else {
      toast.error(resp.errorJsonOrThrow().message ?? "Failed to fetch bans");
    }
    setLoading(false);
  };

  createEffect(() => {
    void guildId();
    void fetchBans();
  });

  const fuseIndex = createMemo(
    () =>
      new Fuse(bans(), {
        keys: ["username", "display_name", "reason"],
        threshold: 0.3,
      })
  );

  const filteredBans = createMemo(() =>
    query() ? fuseIndex().search(query()).map((r) => r.item) : bans()
  );

  const unbanMember = async (userId: bigint) => {
    const resp = await api.request("DELETE", `/guilds/${guildId()}/bans/${userId}`);
    if (!resp.ok) {
      throw new Error(resp.errorJsonOrThrow().message ?? "Failed to unban user");
    }
    setBans((prev) => prev.filter((ban) => BigInt(ban.id) !== userId));
  };

  let searchRef: HTMLInputElement | null = null;

  return (
    <div class="px-4 pt-2 pb-6 text-fg">
      <Header>Bans</Header>
      <p class="mb-4 font-light text-sm text-fg/50">
        View and manage banned members of this server.
      </p>

      <div class="flex gap-3 mb-4">
        <div class="flex flex-grow bg-bg-0 rounded-lg items-center">
          <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg my-2 ml-2.5 opacity-60" />
          <input
            ref={searchRef!}
            type="text"
            class="w-full text-sm p-2 outline-none font-medium bg-transparent"
            placeholder="Search by username or reason..."
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
      </div>

      <div class="flex items-center justify-between mb-2 text-fg/50 uppercase text-xs font-bold">
        <span>{filteredBans().length} ban{filteredBans().length === 1 ? "" : "s"}</span>
        <Show when={loading()}>
          <span>Loading...</span>
        </Show>
      </div>

      <div class="text-fg bg-bg-1/80 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <Show
            when={filteredBans().length > 0}
            fallback={<div class="text-fg/60 text-sm p-3">No bans found.</div>}
          >
            <table class="w-full text-sm">
              <thead class="text-fg/60 bg-bg-0">
                <tr>
                  <th class="text-left font-semibold font-title px-3 py-2 w-48">User</th>
                  <th class="text-left font-semibold font-title px-3 py-2 w-48">Banned by</th>
                  <th class="text-left font-semibold font-title px-3 py-2">Reason</th>
                  <th class="text-left font-semibold font-title px-3 py-2 w-36">Banned</th>
                  <th class="text-right font-semibold font-title px-3 py-2 w-16" />
                </tr>
              </thead>
              <tbody>
                <For each={filteredBans()}>
                  {(ban) => {
                    const userId = BigInt(ban.id);
                    const moderator = createMemo(() => cache.users.get(BigInt(ban.moderator_id)) ?? null);
                    return (
                      <tr class="group hover:bg-fg/10 transition">
                        <td class="px-3 py-2">
                          <div class="flex items-center gap-2">
                            <img
                              src={ban.avatar ?? cache.avatarOf(userId)}
                              alt=""
                              class="w-6 h-6 rounded-full"
                            />
                            <button
                              class="truncate text-left"
                              use:tooltip="Copy User ID"
                              onClick={() =>
                                void navigator.clipboard.writeText(ban.id.toString())
                              }
                            >
                              {banDisplayName(ban)}
                            </button>
                          </div>
                        </td>
                        <td class="px-3 py-2 text-fg/70">
                          <div class="flex items-center gap-2">
                            <Show when={moderator()}>
                              <img
                                src={cache.avatarOf(BigInt(ban.moderator_id))}
                                alt=""
                                class="w-5 h-5 rounded-full"
                              />
                            </Show>
                            <span class="truncate">
                              {moderator()
                                ? (moderator()!.display_name ?? moderator()!.username)
                                : ban.moderator_id.toString()}
                            </span>
                          </div>
                        </td>
                        <td class="px-3 py-2 text-fg/70">
                          <Show when={ban.reason} fallback={<span class="italic opacity-50">No reason</span>}>
                            <span class="truncate">{ban.reason}</span>
                          </Show>
                        </td>
                        <td class="px-3 py-2 text-fg/70">
                          <span use:tooltip={formatDate(ban.banned_at)}>
                            {formatAgo(ban.banned_at)}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-right">
                          <button
                            class="group/btn"
                            use:tooltip="Unban"
                            onClick={() =>
                              toast.promise(unbanMember(userId), {
                                loading: "Unbanning user...",
                                success: "User unbanned.",
                                error: (err) => err.message,
                              })
                            }
                          >
                            <Icon icon={Trash} class="w-4 h-4 fill-fg/50 group-hover/btn:fill-danger transition-all" />
                          </button>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </Show>
        </div>
      </div>
    </div>
  );
}
