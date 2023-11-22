import {createContext, useContext} from "solid-js";
import {ContextMenuProps} from "../components/ui/ContextMenu";

export const ContextMenuContext = createContext<ContextMenuProps>()

export default function useContextMenu() {
  return useContext(ContextMenuContext)
}