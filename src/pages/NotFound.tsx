import Layout from "./Layout";
import {JSX} from "solid-js";
import Icon from "../components/icons/Icon";
import Hand from "../components/icons/svg/Hand";

export default function NotFound(props: { sidebar?: () => JSX.Element }) {
  return (
    <Layout sidebar={props.sidebar} title="Page not found">
      <div class="flex flex-col items-center justify-center w-full h-full">
        <Icon icon={Hand} class="fill-fg w-24 h-24 mb-4" />
        <p class="font-title font-medium text-4xl">Not found!</p>
        <a class="btn btn-sm text-lg mt-4" onClick={() => window.history.back()}>Go Back</a>
      </div>
    </Layout>
  )
}
