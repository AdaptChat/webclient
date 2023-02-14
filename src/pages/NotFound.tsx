import Layout from "./Layout";
import {JSX} from "solid-js";

export default function NotFound(props: { sidebar?: () => JSX.Element }) {
  return (
    <Layout sidebar={props.sidebar} title="Page not found">
      <div class="flex flex-col items-center justify-center w-full h-full">
        <p class="font-title font-medium text-4xl">Not found!</p>
        <a class="btn btn-sm text-lg mt-4" onClick={() => window.history.back()}>Go Back</a>
      </div>
    </Layout>
  )
}
