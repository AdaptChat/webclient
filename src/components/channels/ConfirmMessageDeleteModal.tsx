import {ModalTemplate, useModal} from "../ui/Modal";
import {createSignal} from "solid-js";
import {getApi} from "../../api/Api";
import Icon from "../icons/Icon";
import Trash from "../icons/svg/Trash";
import {Message} from "../../types/message";
import {MessagePreview} from "../messaging/Chat";

type Props = {
  message: Message,
}

export default function ConfirmMessageDeleteModal(props: Props) {
  const api = getApi()!
  const {hideModal} = useModal()

  const [isDeleting, setIsDeleting] = createSignal<boolean>(false)

  return (
    <ModalTemplate title="Delete Message">
      <p class="text-fg/70 text-sm mt-4 text-center">
        Are you sure you want to delete this message?
      </p>
      <div class="rounded-xl overflow-y-auto max-h-[50lvh] bg-bg-3/30 mt-2 py-4">
        <MessagePreview message={props.message} noHoverEffects />
      </div>
      <form
        class="flex flex-wrap justify-end mt-4 gap-x-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setIsDeleting(true)
          try {
            await api.deleteMessage(props.message.channel_id, props.message.id)
          } catch (err) {
            setIsDeleting(false)
            throw err
          }
          setIsDeleting(false)
          hideModal()
        }}
      >
        <button type="button" class="btn border-none btn-ghost" onClick={hideModal}>
          Cancel
        </button>
        <button type="submit" class="btn btn-danger border-none" disabled={isDeleting()}>
          <Icon icon={Trash} class="fill-fg w-4 h-4 mr-2" />
          Delete Message
        </button>
      </form>
    </ModalTemplate>
  )
}
