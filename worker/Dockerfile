FROM alpine as handbrake
WORKDIR /tmp
# Compile HandBrake
RUN \
    apk add \
        # build tools.
        autoconf \
        automake \
        build-base \
        bzip2-dev \
        cmake \
        coreutils \
        diffutils \
        file \
        git \
        harfbuzz-dev \
        jansson-dev \
        lame-dev \
        libass-dev \
        libsamplerate-dev \
        libtheora-dev \
        libtool \
        libxml2-dev \
        libva-dev \
        libvorbis-dev \
        linux-headers \
        m4 \
        nasm \
        opus-dev \
        patch \
        python \
        speex-dev \
        tar \
        x264-dev \
        xz-dev \
        yasm \
        && \
    # Download source
    git clone https://github.com/HandBrake/HandBrake && \
    cd HandBrake && \
    git checkout $(git describe --tags $(git rev-list --tags --max-count=1)) && \
    ./configure --disable-gtk \
                --enable-fdk-aac \
                --launch-jobs=$(nproc) \
                --launch

# Build FFmpeg
FROM alpine:3.8 as ffmpeg

ARG FFMPEG_VERSION=4.1.2
ARG PREFIX=/opt/ffmpeg

# FFmpeg build dependencies.
RUN apk add --update \
  build-base \
  gcc \
  lame-dev \
  libvorbis-dev \
  libwebp-dev \
  libtheora-dev \
  opus-dev \
  pkgconf \
  pkgconfig \
  wget \
  yasm

# Get fdk-aac from testing.
RUN echo http://dl-cdn.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories && \
  apk add --update fdk-aac-dev

# Get ffmpeg source.
RUN cd /tmp/ && \
  wget http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz && \
  tar zxf ffmpeg-${FFMPEG_VERSION}.tar.gz && rm ffmpeg-${FFMPEG_VERSION}.tar.gz

# Compile ffmpeg.
RUN cd /tmp/ffmpeg-${FFMPEG_VERSION} && \
  ./configure \
  --enable-version3 \
  --enable-gpl \
  --enable-nonfree \
  --enable-small \
  --enable-libmp3lame \
  --enable-libtheora \
  --enable-libvorbis \
  --enable-libopus \
  --enable-libfdk-aac \
  --enable-postproc \
  --enable-avresample \
  --disable-debug \
  --disable-doc \
  --disable-ffplay \
  --extra-cflags="-I${PREFIX}/include" \
  --extra-ldflags="-L${PREFIX}/lib" \
  --extra-libs="-lpthread -lm" \
  --prefix="${PREFIX}" && \
  make && make install && make distclean

FROM node:10-alpine
WORKDIR /usr/src/app
RUN apk update && apk upgrade && \
    apk add mediainfo perl perl-mojolicious perl-json \
    libass lame libsamplerate libtheora libvorbis x264-dev opus speex jansson \
    libxml2 xz
COPY --from=handbrake /tmp/HandBrake/build/HandBrakeCLI /HandBrakeCLI
COPY --from=ffmpeg /opt/ffmpeg /opt/ffmpeg
COPY --from=ffmpeg /usr/lib/libfdk-aac.so.2 /usr/lib/libfdk-aac.so.2

COPY package.json ./
RUN npm install --quiet --production
COPY index.js index.js
COPY lib lib

CMD ["npm", "start"]
