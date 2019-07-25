FROM mhart/alpine-node:10

WORKDIR /api
COPY . .

RUN apk add --no-cache \
    build-base \
    libtool \
    autoconf \
    automake \
    pkgconfig \
    nasm \
    libpng-dev libjpeg-turbo-dev giflib-dev tiff-dev \
    zlib-dev

RUN npm install
RUN npm run build
