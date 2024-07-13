import {ModalTemplate, useModal} from "../ui/Modal";
import {createMemo, createSignal} from "solid-js";
import {GuildChannel} from "../../types/channel";
import {getApi} from "../../api/Api";
import {useNavigate, useParams} from "@solidjs/router";
import Icon from "../icons/Icon";
import Trash from "../icons/svg/Trash";

type Props = {
  channel: GuildChannel,
}

export default function ConfirmChannelDeleteModal(props: Props) {
  const api = getApi()!
  const navigate = useNavigate()
  const params = useParams()
  const {hideModal} = useModal()

  const guild = createMemo(() => api.cache!.guilds.get(BigInt(params.guildId)))
  const [isDeleting, setIsDeleting] = createSignal<boolean>(false)
  const colloquial = () => props.channel.type === 'text' ? `#${props.channel.name}` : props.channel.name

  return (
    <ModalTemplate title="Delete Channel">
      <p class="text-fg/70 text-center text-sm mt-4">
        Are you sure you want to delete <b>{colloquial()}</b> in {guild()?.name}? You will not be able to undo this action.
        All data and messages associated with this channel will be deleted and you will not be able to recover them in the future.
      </p>
      <form
        class="flex flex-wrap justify-end mt-4 gap-x-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setIsDeleting(true)
          try {
            await api.request('DELETE', `/channels/${props.channel.id}`)
          } catch (err) {
            setIsDeleting(false)
            throw err
          }
          setIsDeleting(false)
          hideModal()
          if (params.channelId && BigInt(params.channelId) === props.channel.id) navigate(`/guilds/${params.guildId}`)
        }}
      >
        <button class="btn border-none btn-ghost" onClick={hideModal}>
          Cancel
        </button>
        <button type="submit" class="btn btn-danger border-none" disabled={isDeleting()}>
          <Icon icon={Trash} class="fill-fg w-4 h-4 mr-2" />
          Delete #{props.channel.name}
        </button>
      </form>
    </ModalTemplate>
  )
}
