# Adapted from: https://github.com/tauri-apps/tauri/issues/1355#issuecomment-896434917

ARG CENTOS_VERSION=7.9.2009
FROM centos:$CENTOS_VERSION

ARG NVM_VERSION=0.39.2
ARG NODE_VERSION=16.18.0

# Install dependencies
RUN \
    yum install -y \
        # This is an older version of webkit but it works.
        webkitgtk4-devel \
        openssl-devel \
        curl \
        wget \
        squashfs-tools \
        gcc \
        gcc-c++ \
        make \
        file \
        librsvg2-devel

RUN useradd -u 1000 docker
USER docker
ENV HOME=/home/docker

# Install NVM
RUN \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v$NVM_VERSION/install.sh | bash \
    && source $HOME/.nvm/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm use node

# Install Rust
RUN \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

ENV PATH=$HOME/.nvm/versions/node/v$NODE_VERSION/bin:$PATH
ENV PATH=$HOME/.cargo/bin:$PATH

# Install Tauri CLI
RUN \
    # do not use downloaded packages of tauri - you must build it yourself in this environment for correct GLIBC version
    cargo install tauri-cli

# cargo tauri build