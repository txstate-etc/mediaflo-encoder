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

FROM node:10-alpine
WORKDIR /usr/src/app
RUN apk update && apk upgrade && \
    apk add ffmpeg mediainfo perl perl-mojolicious perl-json \
    libass lame libsamplerate libtheora libvorbis x264-dev opus speex jansson \
    libxml2 xz
COPY --from=handbrake /tmp/HandBrake/build/HandBrakeCLI /HandBrakeCLI

COPY package.json ./
RUN npm install --quiet --production
COPY index.js index.js
COPY lib lib

CMD ["npm", "start"]
