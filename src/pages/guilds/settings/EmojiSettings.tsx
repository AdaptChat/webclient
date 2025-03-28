import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { getApi } from "../../../api/Api";
import { useParams } from "@solidjs/router";
import { toast } from "solid-toast";
import Icon from "../../../components/icons/Icon";
import Trash from "../../../components/icons/svg/Trash";
import PenToSquare from "../../../components/icons/svg/PenToSquare";
import Check from "../../../components/icons/svg/Check";
import Xmark from "../../../components/icons/svg/Xmark";
import { CustomEmoji } from "../../../types/emoji";
import { snowflakes } from "../../../utils";
import Header from "../../../components/ui/Header";
import Search from "../../../components/icons/svg/MagnifyingGlass";
import ArrowUpFromBracket from "../../../components/icons/svg/ArrowUpFromBracket";
import { ModalId, useModal } from "../../../components/ui/Modal";
import EmojiUploadModal from "../../../components/guilds/EmojiUploadModal";
import tooltip from "../../../directives/tooltip";
void tooltip;

export default function EmojiSettings() {
  const api = getApi()!;
  const params = useParams();
  const guildId = BigInt(params.guildId!);
  const { showModal } = useModal();

  const [loading, setLoading] = createSignal(true);
  const [uploading, setUploading] = createSignal(false);
  const [editingEmoji, setEditingEmoji] = createSignal<CustomEmoji | null>(null);
  const [searchQuery, setSearchQuery] = createSignal("");

  const permissions = createMemo(() => api.cache?.getClientPermissions(guildId));
  const canManageEmojis = createMemo(() => permissions()?.has('MANAGE_EMOJIS'));
  const emojis = createMemo(() => api.cache?.getEmojisForGuild(guildId) ?? []);
  
  const filteredEmojis = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return emojis();
    return emojis().filter(emoji => 
      emoji.name.toLowerCase().includes(query)
    );
  });

  createEffect(() => {
    if (api.cache) {
      setLoading(false);
    }
  });

  const handleDelete = async (emojiId: bigint) => {
    try {
      const response = await api.request('DELETE', `/guilds/${guildId}/emojis/${emojiId}`);
      if (!response.ok) {
        toast.error("Failed to delete emoji");
        return;
      }

      api.cache?.removeEmoji(emojiId);
      toast.success("Emoji deleted successfully");
    } catch (error) {
      toast.error("Failed to delete emoji");
    }
  };

  const handleRename = async (emojiId: bigint, newName: string) => {
    try {
      const response = await api.request('PATCH', `/guilds/${guildId}/emojis/${emojiId}`, {
        json: { name: newName }
      });

      if (!response.ok) {
        toast.error("Failed to rename emoji");
        return;
      }

      const updatedEmoji = response.jsonOrThrow();
      api.cache?.updateEmoji(updatedEmoji);
      toast.success("Emoji renamed successfully");
      setEditingEmoji(null);
    } catch (error) {
      toast.error("Failed to rename emoji");
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (files.length === 1) {
      // Single file - show modal for name input
      showModal(ModalId.EmojiUpload, { file: files[0] });
      return;
    }

    // Multiple files - upload all with normalized names
    setUploading(true);
    try {
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const dataUri = reader.result as string;
              const normalizedName = normalizeFileName(file.name);
              
              const response = await api.request('POST', `/guilds/${guildId}/emojis`, {
                json: {
                  image: dataUri,
                  name: normalizedName
                }
              });

              if (!response.ok) {
                toast.error(`Failed to upload emoji: ${file.name}`);
                return;
              }

              const newEmoji = response.jsonOrThrow();
              api.cache?.updateEmoji(newEmoji);
              toast.success(`Uploaded: ${file.name}`);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      toast.error("Failed to upload some emojis");
    } finally {
      setUploading(false);
    }
  };

  function normalizeFileName(fileName: string): string {
    const trimmed = 
      fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
        
    return !trimmed || trimmed === "_" ? "emoji" : trimmed;
  }

  return (
    <div class="px-4 mobile:px-2 py-6">
      <Header>Emojis</Header>
      
      <Show when={canManageEmojis()}>
        <div class="mb-4 flex mobile:flex-col justify-between md:items-center">
          <div>
            <h2 class="text-md font-title font-semibold text-fg mb-1">Upload Emojis</h2>
            <p class="mb-4 font-light text-sm text-fg/50">
                Add up to 50 custom emojis to your server.
            </p>
          </div>
          <div class="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              id="emoji-upload"
              onChange={(e) => handleFileSelect(e.currentTarget.files)}
              disabled={uploading()}
            />
            <label
              for="emoji-upload"
              class="btn btn-primary cursor-pointer"
            >
              <Icon icon={ArrowUpFromBracket} class="w-5 h-5 mr-2 fill-fg transition-colors group-hover:fill-fg" />
              Upload
            </label>
          </div>
        </div>
      </Show>

      <div class="bg-bg-0 rounded-lg overflow-hidden">
        <div class="p-4 border-b border-bg-2">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold font-title">
                {searchQuery() ? "Search Results" : "Emojis"} ({filteredEmojis().length})
            </h2>
            <div class="relative">
              <Icon icon={Search} class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 fill-fg/40" />
              <input
                type="text"
                placeholder="Search emojis..."
                class="bg-bg-1 rounded-lg pl-9 pr-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-accent"
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
              />
            </div>
          </div>
        </div>

        <div class="divide-y divide-bg-2">
          <For each={filteredEmojis()}>
            {(emoji) => (
              <div class="p-4 flex items-center gap-4">
                <img
                  src={`https://convey.adapt.chat/emojis/${emoji.id}`}
                  alt={emoji.name}
                  class="w-8 h-8"
                />
                <div class="flex-grow">
                  <Show when={editingEmoji()?.id === emoji.id} fallback={
                    <div class="flex items-center gap-2">
                      <span class="font-medium">:{emoji.name}:</span>
                      <Show when={canManageEmojis()}>
                        <button
                          class="p-1 rounded hover:bg-bg-2 transition-colors"
                          onClick={() => setEditingEmoji(emoji)}
                        >
                          <Icon icon={PenToSquare} class="w-4 h-4 fill-fg/40" />
                        </button>
                      </Show>
                    </div>
                  }>
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        class="bg-bg-1 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        value={editingEmoji()!.name}
                        onInput={(e) => setEditingEmoji({ ...editingEmoji()!, name: e.currentTarget.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(emoji.id, editingEmoji()!.name);
                          } else if (e.key === 'Escape') {
                            setEditingEmoji(null);
                          }
                        }}
                      />
                      <button
                        class="p-1 rounded hover:bg-bg-2 transition-colors"
                        onClick={() => handleRename(emoji.id, editingEmoji()!.name)}
                        use:tooltip="Save"
                      >
                        <Icon icon={Check} class="w-4 h-4 fill-fg/40" />
                      </button>
                      <button
                        class="p-1 rounded hover:bg-bg-2 transition-colors"
                        onClick={() => setEditingEmoji(null)}
                        use:tooltip="Cancel"
                      >
                        <Icon icon={Xmark} class="w-4 h-4 fill-fg/40" />
                      </button>
                    </div>
                  </Show>
                  <div class="text-sm text-fg/60">
                    Created by {api.cache?.users.get(emoji.created_by!)?.username ?? "Unknown"}
                    <br />
                    {new Date(snowflakes.timestampMillis(emoji.id)).toLocaleDateString()}
                  </div>
                </div>
                <Show when={canManageEmojis()}>
                  <button
                    class="p-2 rounded-lg transition-colors"
                    onClick={() => handleDelete(emoji.id)}
                    use:tooltip="Delete"
                  >
                    <Icon icon={Trash} class="w-5 h-5 fill-fg transition-colors hover:fill-danger" />
                  </button>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>

      <Show when={!canManageEmojis()}>
        <div class="bg-bg-0 rounded-lg p-4 text-center text-fg/60">
          You need the Manage Emojis permission to modify emojis.
        </div>
      </Show>
    </div>
  );
}
