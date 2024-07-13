/* @refresh reload */
import {render} from 'solid-js/web';

import './index.css';
import Entrypoint from './Entrypoint';
import {ContextMenuProvider} from "./components/ui/ContextMenu";
import {ThemeProvider} from "./client/themes";
import {HeaderContextProvider} from "./components/ui/Header";

console.log('%cAdapt', 'font-size: 48px;')
console.log(
  "%cThis is a browser feature intended for developers. " +
  "If someone told you to copy and paste something here, don\'t do it. It may compromise your account.",
  "font-size: 16px;",
)

const app = () => (
  <ThemeProvider>
    <ContextMenuProvider>
      <HeaderContextProvider>
        <Entrypoint />
      </HeaderContextProvider>
    </ContextMenuProvider>
  </ThemeProvider>
);
render(app, document.getElementById('root') as HTMLElement);
