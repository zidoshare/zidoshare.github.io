FROM node:12

RUN echo \
    deb http://mirrors.tuna.tsinghua.edu.cn/debian/ stretch main contrib non-free \
    deb http://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-updates main contrib non-free \
    deb http://mirrors.tuna.tsinghua.edu.cn/debian/ stretch-backports main contrib non-free \
    deb http://mirrors.tuna.tsinghua.edu.cn/debian-security stretch/updates main contrib non-free \
    > /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y libvips-dev

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn config set sass_binary_site http://cdn.npm.taobao.org/dist/node-sass -g && \
    yarn --registry=https://registry.npm.taobao.org

COPY . .

CMD [ "npm", "start" ]