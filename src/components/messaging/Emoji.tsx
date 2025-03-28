import {gemoji, type Gemoji} from "gemoji";
import {createMemo} from "solid-js";
import {getApi} from "../../api/Api";

const unicodeLookup = new Map<string, Gemoji>(gemoji.map((emoji) => [emoji.emoji, emoji]))

export function getUnicodeEmojiUrl(emoji: string) {
  return `https://emojicdn.elk.sh/${emoji}?style=twitter`
}

export function getCustomEmojiUrl(emojiId: bigint): string {
  return `https://convey.adapt.chat/emojis/${emojiId}`;
}

const skintoneMap: Record<string, string> = {
  '\u{1f3fb}': 'skin tone 2',
  '\u{1f3fc}': 'skin tone 3',
  '\u{1f3fd}': 'skin tone 4',
  '\u{1f3fe}': 'skin tone 5',
  '\u{1f3ff}': 'skin tone 6',
}
const skintoneRegex = new RegExp(Object.keys(skintoneMap).join('|'), 'g');

function stripSkintone(emoji: string) {
  const genericEmoji = emoji.replace(skintoneRegex, '');
  let skintone = emoji.match(skintoneRegex)?.[0]
  return { skintone, genericEmoji };
}

export function lookupUnicodeEmoji(emoji: string): Gemoji | null {
  const {genericEmoji, skintone} = stripSkintone(emoji)

  const gemoji = unicodeLookup.get(genericEmoji)
  const out = gemoji ?? unicodeLookup.get(genericEmoji + '\uFE0F') ?? null

  if (out && skintone) {
    out.description = `${out.description} (${skintoneMap[skintone]})`
  }
  return out
}

export default function Emoji(props: { emoji: string, jumbo?: boolean }) {
  const api = getApi()!;
  
  // Check if this is a custom emoji (format: :EMOJI_ID:)
  const customEmojiMatch = props.emoji.match(/^:(\d+):$/);
  
  const emojiUrl = createMemo(() => {
    if (customEmojiMatch) {
      const emojiId = BigInt(customEmojiMatch[1]);
      const customEmoji = api.cache?.customEmojis.get(emojiId);
      if (customEmoji) {
        return getCustomEmojiUrl(emojiId);
      }
    }
    return getUnicodeEmojiUrl(props.emoji);
  });

  const gemoji = createMemo(() => lookupUnicodeEmoji(props.emoji))
  const size = () => props.jumbo ? 40 : 20

  return (
    <span class="emoji inline-block cursor-pointer align-bottom relative">
      <img
        src={emojiUrl()}
        alt={props.emoji}
        width={size()}
        height={size()}
        draggable={false}
        aria-label={gemoji()?.description ?? 'emoji'}
        role="img"
        class="inline-block align-middle"
      />
    </span>
  );
}
