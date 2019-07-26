FROM node:10-alpine AS builder

RUN apk add --no-cache \
    build-base \
    libtool \
    autoconf \
    automake \
    pkgconfig \
    nasm \
    libpng-dev libjpeg-turbo-dev giflib-dev tiff-dev \
    zlib-dev

WORKDIR /api
COPY . .

ARG NODE_ENV

RUN yarn
RUN NODE_ENV=${NODE_ENV} yarn build
