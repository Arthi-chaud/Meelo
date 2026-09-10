FROM --platform=$BUILDPLATFORM alpine:3.23 AS base
ARG TARGETARCH
RUN apk update && apk add git build-base

FROM base AS meilisearch_builder
ENV VERSION=v1.53.2
ENV REPO=https://github.com/meilisearch/meilisearch
RUN apk add rustup 
RUN rustup-init -y
ENV PATH=/root/.cargo/bin/:$PATH
RUN rustup update && rustup default stable
RUN git clone --branch "$VERSION" --single-branch "$REPO" /tmp/meilisearch
WORKDIR /tmp/meilisearch
RUN case "$TARGETARCH" in \
      amd64) echo "amd64" > /tmp/rust-target ;; \
      arm64) echo "aarch64" > /tmp/rust-target ;; \
      *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
    esac
RUN TARGET="$(cat /tmp/rust-target)-unknown-linux-musl" \
	&& rustup target add "$TARGET" \
	&& cargo build --release --target="$TARGET" \
	&& mkdir /out && mv ./target/$TARGET/release/meilisearch /out/meilisearch



FROM base AS runner

RUN apk add openssl postgresql rabbitmq-server nodejs
COPY --from=meilisearch_builder /out/meilisearch /usr/bin/meilisearch
RUN node --version > /dev/null && meilisearch --version > /dev/null 


CMD ["echo", "hello world"]
