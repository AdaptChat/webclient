import { ModalTemplate, useModal } from "../ui/Modal";
import { createSignal } from "solid-js";
import { getApi } from "../../api/Api";
import { useParams } from "@solidjs/router";
import { toast } from "solid-toast";
import ArrowUpFromBracket from "../icons/svg/ArrowUpFromBracket";
import Icon from "../icons/Icon";

type Props = {
  file: File;
}

export default function EmojiUploadModal(props: Props) {
  const api = getApi()!;
  const params = useParams();
  const guildId = BigInt(params.guildId!);
  const { hideModal } = useModal();

  const [name, setName] = createSignal(normalizeFileName(props.file.name));
  const [uploading, setUploading] = createSignal(false);
  const [previewUrl, setPreviewUrl] = createSignal<string>("");

  // Create preview URL when component mounts
  const reader = new FileReader();
  reader.onload = () => {
    setPreviewUrl(reader.result as string);
  };
  reader.readAsDataURL(props.file);

  function normalizeFileName(fileName: string): string {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const normalized = nameWithoutExt.replace(/[^a-zA-Z0-9_]/g, "_");
    const deduplicated = normalized.replace(/_+/g, "_");
    const trimmed = deduplicated.replace(/^_+|_+$/g, "");
    return !trimmed || trimmed === "_" ? "emoji" : trimmed;
  }

  const handleUpload = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!name()) return;

    setUploading(true);
    try {
      const response = await api.request('POST', `/guilds/${guildId}/emojis`, {
        json: {
          image: previewUrl(),
          name: name()!
        }
      });

      if (!response.ok) {
        toast.error("Failed to upload emoji");
        return;
      }

      const newEmoji = response.jsonOrThrow();
      api.cache?.updateEmoji(newEmoji);
      toast.success("Emoji uploaded successfully");
      hideModal();
    } catch (error) {
      toast.error("Failed to upload emoji");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalTemplate title="Upload Emoji">
      <form onSubmit={handleUpload} class="mt-4 w-[300px] flex flex-col">
        <div class="flex flex-col items-center gap-4">
          <div class="w-32 h-32 bg-bg-1 rounded-lg flex items-center justify-center">
            <img
              src={previewUrl()}
              alt="Emoji preview"
              class="max-w-full max-h-full object-contain"
            />
          </div>
          <div class="w-full">
            <label for="emoji-name" class="px-1 block text-sm font-bold uppercase text-fg/70 mb-2">
              Emoji Name
            </label>
            <input
              id="emoji-name"
              type="text"
              class="w-full bg-bg-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="Enter emoji name"
            />
          </div>
        </div>
        <div class="mt-2 flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-ghost"
            onClick={() => hideModal()}
            disabled={uploading()}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!name() || uploading()}
          >
            <Icon icon={ArrowUpFromBracket} class="w-4 h-4 fill-fg mr-2" />
            {uploading() ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </ModalTemplate>
  );
} 