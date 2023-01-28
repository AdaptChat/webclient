import Layout from "./Layout";
import {getApi} from "../api/Api";

export default function Home() {
  const api = getApi()!

  return (
    <Layout>
      <h1>Welcome, {api.cache!.clientUser!.username}!</h1>
    </Layout>
  )
}
