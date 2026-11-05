---
name: web-app-local-stack
description: Run the Angular web app against local HTTPS Fineract and execute the existing Jest suite on Linux or Windows.
---

# Run the web app locally

Start Fineract with PostgreSQL on `https://localhost:8443/fineract-provider` using the backend repository's `fineract-local-stack` skill. Use Node.js 20.19 or newer and run commands from the web-app repository root.

## Install and serve

Linux:

```bash
npm ci
npx ng serve --host 127.0.0.1 --proxy-config .agents/skills/web-app-local-stack/proxy.local-https.cjs
```

PowerShell on Windows:

```powershell
npm.cmd ci
npm.cmd exec -- ng serve --host 127.0.0.1 --proxy-config .agents/skills/web-app-local-stack/proxy.local-https.cjs
```

Open `http://localhost:4200` and log in with username `mifos`, password `password`, and tenant `default`. Keep the API URL fields in `src/assets/env.js` empty so the app uses the browser origin. The proxy forwards `/fineract-provider/**` to HTTPS on 8443, preserves the context path, and accepts the local self-signed certificate. Use the included HTTPS proxy for this backend configuration.

`npm ci` generates `src/environments/.env.ts` through the postinstall script. Review the generated version change before committing application changes. Keep the Angular process running in a separate terminal.

## Jest

The default Jest transform excludes JavaScript ESM packages used by Material Web components. Include the packages through a command-line override instead of changing `jest.config.ts`.

Linux:

```bash
npm test -- --runInBand --coverage=false '--transformIgnorePatterns=node_modules/(?!.*\.mjs$|@angular|@fortawesome|@material|lit|@lit|@lit-labs)'
```

PowerShell:

```powershell
npm.cmd test -- --runInBand --coverage=false '--transformIgnorePatterns=node_modules/(?!.*\.mjs$|@angular|@fortawesome|@material|lit|@lit|@lit-labs)'
```

Keep the regex argument in single quotes so the shell passes the parentheses and pipe characters to Jest unchanged. Remove `--coverage=false` when collecting the UI unit-test coverage report.
