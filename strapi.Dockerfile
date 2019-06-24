FROM mhart/alpine-node:10 AS base

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

ARG config

RUN yarn
RUN NODE_ENV=$config yarn build
