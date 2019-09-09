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

ADD packages packages
COPY package.json yarn.lock ./
RUN yarn --prod

FROM node:10-alpine

ARG NODE_ENV

RUN apk add --no-cache tzdata
ENV TZ Europe/London

WORKDIR /api

COPY --from=builder node_modules node_modules
COPY . .

RUN NODE_ENV=${NODE_ENV} yarn build
