# Platform standard (otterworks platform/standards): every stage starts from
# the approved node-20-slim image pinned by digest. The first stage runs the
# unit tests, so `docker build --target test` is the unit test step.

###############
### STAGE 1: Install dependencies and run the unit tests
###############
FROM docker.io/library/node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 AS test

ARG NPM_REGISTRY_URL=https://registry.npmjs.org/

# Browsers for Cypress, Puppeteer and Playwright are only used by the e2e
# suites, which need a running Fineract backend and are not run here. The Jest
# unit tests run headlessly on jsdom and need no browser.
ENV CI=true \
    HUSKY=0 \
    CYPRESS_INSTALL_BINARY=0 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_OPTIONS=--max-old-space-size=4096

# git: version.js (npm postinstall) runs git describe for the version info.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

COPY ./ /usr/src/app/

RUN npm config set fetch-retry-maxtimeout 120000 \
    && npm config set registry $NPM_REGISTRY_URL --location=global \
    && npm ci

RUN npm run test:ci \
    && node --test server/

###############
### STAGE 2: Build the production bundle
###############
FROM test AS build
ARG BUILD_ENVIRONMENT_OPTIONS="--configuration production"
RUN sh -c "ng build --output-path=/dist $BUILD_ENVIRONMENT_OPTIONS"

###############
### STAGE 3: Serve the bundle from Node as a non-root user
###############
FROM docker.io/library/node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0

# Debian security updates on top of the pinned base (Trivy blocks fixable
# CRITICAL CVEs), then drop the package managers node does not need at runtime.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn-* \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg

WORKDIR /app
COPY --from=build /usr/src/app/server/server.js /app/server.js
COPY --from=build /dist/browser /app/public

# Heap sized for the 256Mi container limit of the platform limit range.
ENV NODE_ENV=production \
    PORT=8080 \
    NODE_OPTIONS=--max-old-space-size=128

USER 10001
EXPOSE 8080
CMD ["node", "/app/server.js"]
