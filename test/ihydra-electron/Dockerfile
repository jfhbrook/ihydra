FROM node:latest

RUN apt-get update && \
    apt-get install -yq --no-install-recommends libzmq3-dev jupyter-notebook && \
    apt-get clean

RUN mkdir -p ihydra

COPY . ihydra

RUN cd ihydra && rm -rf node_modules && npm i --production

WORKDIR ihydra

CMD npm install && npm run test
