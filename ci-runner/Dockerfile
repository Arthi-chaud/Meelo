# SRC: https://github.com/beikeni/github-runner-dockerfile

FROM ubuntu:24.04
ARG PLATFORM="x64"
ARG RUNNER_VERSION="2.331.0"

ENV DEBIAN_FRONTEND=noninteractive

# User config + install base dependencies
RUN apt update -y && apt upgrade -y && useradd -m docker
RUN apt install -y --no-install-recommends \
	curl jq build-essential libssl-dev libffi-dev python3 python3-venv python3-dev python3-pip
RUN cd /home/docker && mkdir actions-runner && cd actions-runner \
	&& curl -O -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${PLATFORM}-${RUNNER_VERSION}.tar.gz \
	&& tar xzf ./actions-runner-linux-${PLATFORM}-${RUNNER_VERSION}.tar.gz
RUN chown -R docker ~docker && /home/docker/actions-runner/bin/installdependencies.sh

RUN apt update
RUN apt install -y --no-install-recommends \
	git \
	openjdk-17-jdk openjdk-17-jre

COPY start.sh start.sh
RUN chmod +x start.sh

USER docker

# Install node 24
ENV NVM_DIR=/home/docker/.nvm
ENV NODE_VERSION=24.13.1
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
	&& . ~/.nvm/nvm.sh \
	&& nvm install ${NODE_VERSION} \
	&& nvm use ${NODE_VERSION}
ENV PATH=$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Install yarn + expo/eas
RUN npm install -g corepack
RUN npm install -g eas-cli


ENTRYPOINT ["./start.sh"]

