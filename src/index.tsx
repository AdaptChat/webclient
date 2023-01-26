/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';
import {Router} from "@solidjs/router";

const app = () => <Router><App /></Router>;
render(app, document.getElementById('root') as HTMLElement);
