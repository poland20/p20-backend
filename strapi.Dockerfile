FROM node:10-alpine AS builder

RUN apk --no-cache add \
    build-base \
    libtool \
    autoconf \
    automake \
    pkgconfig \
    nasm \
    libpng-dev libjpeg-turbo-dev giflib-dev tiff-dev \
    zlib-dev

COPY package.json yarn.lock ./
RUN yarn

FROM node:10-alpine

ARG NODE_ENV

WORKDIR /api

COPY --from=builder node_modules node_modules
COPY . .

RUN NODE_ENV=${NODE_ENV} yarn build
