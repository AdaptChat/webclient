# Adapt Web Client

Interact with Adapt directly from your browser: https://app.adapt.chat

## What's this? 

This is the official web-based client and Progressive Web App (PWA) for the [Adapt chat platform](https://adapt.chat). 

## Roadmap

See the [project board](https://github.com/orgs/AdaptChat/projects/2/views/4?layout=board) for the current status of the
web client.

## Tauri Desktop Builds

- Windows:
  - [x86_64 (64 bit)](https://download.adapt.chat/webclient/windows-x86_64/Adapt-setup.exe)
- MacOS:
  - x86_64 (Intel): [.app bundle](https://download.adapt.chat/webclient/darwin-x86_64/Adapt.app.zip) | [.dmg installer](https://download.adapt.chat/webclient/darwin-x86_64/Adapt-installer.dmg)
  - aarch64 (Apple Silicon): [.app bundle](https://download.adapt.chat/webclient/darwin-aarch64/Adapt.app.zip) | [.dmg installer](https://download.adapt.chat/webclient/darwin-aarch64/Adapt-installer.dmg)
- Linux (x86_64/AMD64):
  - [.deb](https://download.adapt.chat/webclient/linux-x86_64/Adapt.deb) (smaller, but might need to install dependencies)
  - [AppImage](https://download.adapt.chat/webclient/linux-x86_64/Adapt.AppImage) (larger, easier to install)

For macOS, you will need to run the following if you get an "app is damaged" error:
```sh
$ xattr -dr com.apple.quarantine /Applications/Adapt.app
```

See the official downloads page: https://adapt.chat/download.

## Contributing

### Contributing Code

All contributions are welcome! Here are a few general guidelines:
- for JSX and CSS, use 2-space indents
- there is no strict guideline for code formatting, but try to follow best practices.
  if you want, run a code formatter on the section of code you are contributing
- break long lines into multiple lines (especially with Tailwind classes)
- ensure the remainder of the client still works properly
- if you have used Generative AI for part of the contribution, please mention so in the PR description
  - fully AI-generated contributions with no review will not be accepted

### Contributing Translations

If you want to translate the Adapt Web Client:
+ create an account on https://i18n.adapt.chat (this is a [Weblate](https://weblate.org/) instance)
+ after setting up your account, contact me and tell me your email and language(s) you want to translate
  - you can contact me through the official [Adapt Community Server](https://adapt.chat/invite/Sy0HSbiR), the [Adapt Development Discord](https://discord.gg/A2ewwZSxxs), or via emailing me@jay3332.tech.
+ after you get a response, you may begin translating!

## Building from Source

You can run the Adapt client locally using [Vite](https://vitejs.dev/).

### Prerequisites
- [Node.js](https://nodejs.org/) **v18 or later**
- [npm](https://npmjs.com) or some other package manager

### Clone the repository
```bash
git clone https://github.com/AdaptChat/webclient.git
cd webclient
```

### Install dependencies
```bash
npm install
```

### Start development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

To preview the production build locally:

```bash
npm run serve
```

### Building for Desktop from Source

You can choose to build the client as a desktop app using [Tauri](https://tauri.app/):

```bash
npm run tauri build
```
