/* @refresh reload */
import {render} from 'solid-js/web';
import {Router} from "@solidjs/router";

import './index.css';
import App, {ContextMenuProvider} from './App';

console.log('%cAdapt', 'font-size: 48px;')
console.log(
  "%cThis is a browser feature intended for developers. " +
  "If someone told you to copy and paste something here, don\'t do it. It may compromise your account.",
  "font-size: 16px;",
)

const app = () => (
  <ContextMenuProvider>
    <Router>
      <App />
    </Router>
  </ContextMenuProvider>
);
render(app, document.getElementById('root') as HTMLElement);
