import { For } from "solid-js";
import Header from "../../components/ui/Header";
import { AVAILABLE_LOCALES, LOCALE_FLAGS, getLanguageDisplayName, locale, setLocale, t } from "../../i18n";
import { getUnicodeEmojiUrl } from "../../components/messaging/Emoji";

function LocaleOption(props: { localeKey: string }) {
  const localName = () => getLanguageDisplayName(props.localeKey, locale());
  const nativeName = () => getLanguageDisplayName(props.localeKey, props.localeKey);
  const flag = () => LOCALE_FLAGS[props.localeKey];
  const isSelected = () => locale() === props.localeKey;

  return (
    <button
      type="button"
      class="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition text-left"
      classList={{
        "bg-accent text-accent-content": isSelected(),
        "hover:bg-fg/10 text-fg": !isSelected(),
      }}
      onClick={() => setLocale(props.localeKey)}
    >
      <span class="flex items-center gap-3">
        <img src={getUnicodeEmojiUrl(flag()!)} alt={flag()!} width={20} height={20} class="inline-block" />
        <span class="font-medium">{nativeName()}</span>
      </span>
      <span class="text-xs opacity-60 mobile:hidden">
        {localName()}
      </span>
    </button>
  );
}

export default function Locale() {
  return (
    <div class="flex flex-col w-full py-2">
      <Header>{t("settings.user.language.header")}</Header>
      <p class="text-fg/60 text-sm mb-4 mx-4">
        {t("settings.user.language.description")}
      </p>
      <div class="flex flex-col px-2">
        <For each={AVAILABLE_LOCALES}>
          {(localeKey) => <LocaleOption localeKey={localeKey} />}
        </For>
      </div>
      <p class="text-fg/40 font-light text-sm my-2 mx-4">
        Many strings in Adapt are still machine-translated!
        If you want to help translate Adapt, see the 
        <a 
          href="//github.com/AdaptChat/webclient?tab=readme-ov-file#contributing-translations"
          class="underline underline-offset-2 hover:text-fg/80 text-fg/40"
        >
          Translation Contribution Guide
        </a>.
      </p>
    </div>
  );
}
