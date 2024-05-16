import Icon from "../components/icons/Icon";
import Hand from "../components/icons/svg/Hand";
import Header from "../components/ui/Header";

export default function NotFound() {
  return (
    <div class="flex flex-col items-center justify-center w-full h-full">
      <Header>Not found!</Header>
      <Icon icon={Hand} class="fill-fg w-24 h-24 mb-4" />
      <p class="font-title font-medium text-4xl">Not found!</p>
      <a class="btn btn-sm text-lg mt-4" onClick={() => window.history.back()}>Go Back</a>
    </div>
  )
}
