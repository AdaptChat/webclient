import {Gemoji, gemoji} from 'gemoji'
import {createEffect, createMemo, createSignal, For, onCleanup, onMount} from "solid-js";
import {getUnicodeEmojiUrl, getCustomEmojiUrl} from "./Emoji";
import {ReactiveSet} from "@solid-primitives/set";
import Icon from "../icons/Icon";
import ChevronRight from "../icons/svg/ChevronRight";
import FaceSmile from "../icons/svg/FaceSmile";
import {Show} from "solid-js";
import Fuse from 'fuse.js';
import { getApi } from "../../api/Api";
import tooltip from '../../directives/tooltip';
import GuildIcon from '../guilds/GuildIcon';
void tooltip

function generateCategoryMap(): Map<string, (Gemoji | { id: bigint, name: string, guild_id: bigint })[]> {
  const categories = new Map<string, (Gemoji | { id: bigint, name: string, guild_id: bigint })[]>()
  
  // Add custom emojis first
  const api = getApi()!
  const customEmojis = api.cache?.customEmojis.values() ?? []
  for (const emoji of customEmojis) {
    const category = api.cache?.guilds.get(emoji.guild_id)?.name ?? 'Custom'
    if (!categories.has(category))
      categories.set(category, [])
    categories.get(category)!.push(emoji)
  }

  // Add unicode emojis
  for (const emoji of gemoji) {
    const category = emoji.category
    if (!categories.has(category))
      categories.set(category, [])
    categories.get(category)!.push(emoji)
  }

  return categories
}

export default function EmojiPicker(props: { onSelect?: (emoji: string) => void }) {
  const api = getApi()!
  const unicodeCategories = createMemo(generateCategoryMap)
  const collapsedUnicodeCategories = new ReactiveSet<string>()
  const [hovered, setHovered] = createSignal<Gemoji | { id: bigint, name: string, guild_id: bigint } | undefined>(undefined)
  const [visibleEmojis, setVisibleEmojis] = createSignal<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = createSignal("")
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(null)
  let observer: IntersectionObserver | null = null
  let fuse: Fuse<Gemoji | { id: bigint, name: string, guild_id: bigint }> | null = null

  onMount(() => {
    const allEmojis = [...gemoji, ...(api.cache?.customEmojis.values() ?? [])]
    fuse = new Fuse(allEmojis, {
      keys: ['names', 'name'],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2
    })
  })

  const filteredCategories = createMemo(() => {
    const query = searchQuery().toLowerCase()
    if (!query || !fuse) return unicodeCategories()

    const searchResults = fuse.search(query)
    const filtered = new Map<string, (Gemoji | { id: bigint, name: string, guild_id: bigint })[]>()
    
    // Group search results by category
    searchResults.forEach(result => {
      const emoji = result.item
      const category = 'emoji' in emoji ? emoji.category : (api.cache?.guilds.get(emoji.guild_id)?.name ?? 'Custom')
      if (!filtered.has(category)) {
        filtered.set(category, [])
      }
      filtered.get(category)!.push(emoji)
    })

    return filtered
  })

  // Get unique categories for the sidebar
  const categories = createMemo(() => {
    const cats = new Set<string>()
    filteredCategories().forEach((_, category) => {
      cats.add(category)
    })
    return [...cats]
  })

  // Effect to handle search results visibility
  createEffect(() => {
    const query = searchQuery()
    if (query && fuse) {
      const searchResults = fuse.search(query)
      setVisibleEmojis(prev => {
        const next = new Set(prev)
        searchResults.forEach(result => {
          const emoji = result.item
          if ('emoji' in emoji) {
            next.add(emoji.emoji)
          } else {
            next.add(`:${emoji.id}:`)
          }
        })
        return next
      })
    }
  })

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const emoji = entry.target.getAttribute('data-emoji')
            if (emoji) {
              setVisibleEmojis(prev => {
                const next = new Set(prev)
                next.add(emoji)
                return next
              })
            }
          }
        })
      },
      { rootMargin: '50px' }
    )

    // Observe emojis in expanded categories on mount
    setTimeout(() => {
      unicodeCategories().forEach((emojis, category) => {
        if (!collapsedUnicodeCategories.has(category)) {
          emojis.forEach(emoji => {
            const element = document.querySelector(`[data-emoji="${'emoji' in emoji ? emoji.emoji : `:${emoji.id}:`}"]`)
            if (element) observer?.observe(element)
          })
        }
      })
    }, 0)
  })
  onCleanup(() => {
    observer?.disconnect()
  })

  const toggleCategory = (category: string) => {
    if (collapsedUnicodeCategories.has(category)) {
      collapsedUnicodeCategories.delete(category)
    } else {
      collapsedUnicodeCategories.add(category)
    }
  }

  const scrollToCategory = (category: string) => {
    setSelectedCategory(category)
    const element = document.querySelector(`[data-category="${category}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div class="bg-bg-0/70 backdrop-blur box-border rounded-xl h-[300px] w-[350px] flex flex-col relative overflow-hidden">
      <div class="sticky top-0 z-10 bg-bg-0/70 backdrop-blur">
        <input
          type="text"
          placeholder="Search emojis..."
          class="w-full bg-0 rounded-lg px-3 py-3 text-sm text-fg placeholder:text-fg/40 focus:outline-none"
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </div>
      <div class="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div class="w-12 bg-0 overflow-y-auto hide-scrollbar flex flex-col pb-2">
          <For each={categories()}>
            {(category) => {
              const isGuild = [...(api.cache?.guilds.values() ?? [])].some(g => g.name === category)
              const guild = isGuild ? [...(api.cache?.guilds.values() ?? [])].find(g => g.name === category) : null
              
              return (
                <button
                  class="w-full flex py-1.5 items-center justify-center group"
                  onClick={() => scrollToCategory(category)}
                  use:tooltip={{ content: category, placement: 'left' }}
                >
                  {isGuild ? (
                    <GuildIcon guild={guild!} sizeClass="w-7 h-7" />
                  ) : (
                    <Icon icon={FaceSmile} class="w-5 h-5 fill-fg/60 group-hover:fill-accent transition-all duration-200" />
                  )}
                </button>
              )
            }}
          </For>
        </div>
        {/* Main content */}
        <div class="overflow-y-auto flex-1 pb-12 px-2">
          <For each={[...filteredCategories().entries()]}>
            {([category, emojis]) => (
              <div data-category={category}>
                <button 
                  class="w-full text-sm font-title text-fg text-opacity-60 p-1 flex items-center justify-between 
                    group hover:text-opacity-100 rounded-lg transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category);
                  }}
                >
                  <span>{category}</span>
                  <span classList={{
                    "transition-transform transform duration-200": true,
                    "rotate-0": collapsedUnicodeCategories.has(category),
                    "rotate-90": !collapsedUnicodeCategories.has(category),
                  }}>        
                    <Icon icon={ChevronRight} class="w-3 h-3 fill-fg/60 group-hover:fill-fg transition-all duration-200" />
                  </span>
                </button>
                {!collapsedUnicodeCategories.has(category) && (
                  <div class="grid grid-cols-8">
                    <For each={emojis}>
                      {emoji => {
                        const isCustom = !('emoji' in emoji)
                        const emojiId = isCustom ? `:${emoji.id}:` : emoji.emoji
                        const emojiUrl = isCustom ? getCustomEmojiUrl(emoji.id) : getUnicodeEmojiUrl(emoji.emoji)
                        const emojiName = isCustom ? emoji.name : emoji.names[0]
                        
                        return (
                          <button
                            class="p-1 rounded-lg hover:bg-fg/10 transition inline-block align-bottom relative"
                            onMouseEnter={() => setHovered(emoji)}
                            onMouseLeave={() => setHovered(undefined)}
                            onClick={() => props.onSelect?.(emojiId)}
                            data-emoji={emojiId}
                          >
                            <Show when={visibleEmojis().has(emojiId)} fallback={
                              <div class="w-6 h-6 bg-fg/10 rounded animate-pulse" />
                            }>
                              <img
                                src={emojiUrl}
                                alt={emojiName}
                                width={24}
                                height={24}
                                draggable={false}
                                aria-label={emojiName}
                                role="img"
                                class="inline-block align-middle"
                              />
                            </Show>
                          </button>
                        )
                      }}
                    </For>
                  </div>
                )}
              </div>
            )}
          </For>
        </div>
      </div>
      <Show when={hovered()}>
        <div class="absolute backdrop-blur-xl bg-bg-3/80 rounded-lg left-2 right-2 bottom-2 p-2 flex items-center gap-x-2 z-[201]">
          <img
            src={('emoji' in hovered()! ? getUnicodeEmojiUrl((hovered() as Gemoji).emoji) : getCustomEmojiUrl((hovered() as { id: bigint, name: string }).id))}
            alt={('emoji' in hovered()! ? (hovered() as Gemoji).emoji : `:${(hovered() as { id: bigint, name: string }).name}:`)}
            width={24}
            height={24}
            draggable={false}
            class="inline-block align-middle"
          />
          <span class="text-sm text-fg/80 font-light">:{'emoji' in hovered()! ? (hovered() as Gemoji).names[0] : (hovered() as { id: bigint, name: string }).name}:</span>
        </div>
      </Show>
    </div>
  )
}