import Layout from "./Layout";
import {JSX} from "solid-js";

export default function NotFound(props: { sidebar?: () => JSX.Element }) {
  return (
    <Layout sidebar={props.sidebar} title="Page not found">
      <p>Not found</p>
    </Layout>
  )
}
