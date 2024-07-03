import {gemoji, type Gemoji} from "gemoji";
import {createMemo} from "solid-js";

const unicodeLookup = new Map<string, Gemoji>(gemoji.map((emoji) => [emoji.emoji, emoji]))

export function getUnicodeEmojiUrl(emoji: string) {
  return `https://emojicdn.elk.sh/${emoji}?style=twitter`
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

export default function UnicodeEmoji(props: { match: string, jumbo?: boolean }) {
  const gemoji = createMemo(() => lookupUnicodeEmoji(props.match))
  const size = () => props.jumbo ? 64 : 20

  return (
    <span class="emoji inline-block cursor-pointer align-bottom">
      <img
        src={getUnicodeEmojiUrl(props.match)}
        alt={props.match}
        width={size()}
        height={size()}
        draggable={false}
        aria-label={gemoji()?.description ?? 'unicode emoji'}
        role="img"
        class="inline-block align-middle"
      />
    </span>
  )
}
