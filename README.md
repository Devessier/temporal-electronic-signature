# Temporal Electronic Signature

Temporal Electronic Signature is a demonstration of Temporal Node.js SDK used with XState to write workflows. By implementing an electronic signature system, we have to use all most important features of Temporal: activities, signals, queries, timers. Thanks to XState, the code we have to write is more predictable and prevents race conditions to happen.

https://user-images.githubusercontent.com/29370468/136715088-f016acc4-dd5f-4153-8e1b-f63ff1e40c14.mp4

## What can be done with the application?

- User selects a PDF document and validates her choice. It creates a signature procedure.
- Uploaded document is shown and the user has to validate her choice, or cancel the procedure.
- An email address is asked. A confirmation code will be sent to this address that will unblock the procedure.
- The user has to fill the code she received by email.
- If the code was correct, the document is signed and shown to the user.
- If the procedure is not validated after one minute, it expires automatically.

## How it works

### The Stack

The application is built around three packages: `app`, `api` and `temporal`. The front-end is built on [SvelteKit](https://kit.svelte.dev/) and [TailwindCSS](https://tailwindcss.com). The back-end uses [AdonisJS](https://adonisjs.com/).

### The Workflow

[The workflow](https://github.com/Devessier/temporal-electronic-signature/tree/main/packages/temporal/src/workflows/index.ts) is impleted using [XState](https://xstate.js.org/docs/). XState is a library to create state machines in JavaScript. A state machine is a way to represent code with explicit *states*, that can be in one state at a time, and that goes from one state to another one via *transitions*. Statecharts are an improvement of state machines that bring some interesting features, such as *hierarchical states*, *delayed transitions* or *service invokation*. These features are used in the workflow.

Let's see how the workflow is organized with states. [Open the visualizer](https://stately.ai/viz/embed/1c8fd755-0e13-4912-9526-4c49e8140186?mode=viz&controls=1&pan=1&zoom=1)

### Setup

Those are the instructions to launch the signature system locally.

Except `docker-compose` package, all commands will have to be executed in separate shells and kept alived.

#### Dependencies

First, let's install dependencies at the root of the repository.

```sh
yarn install
```

### Temporal

We have to launch Temporal server and Temporal worker.

#### Environment variables

Go to `packages/temporal` directory, create a `.env` from `.env.example`.

You will need credentials to authenticate to a SMTP server. You can use your [Gmail account credentials](https://www.hostinger.com/tutorials/how-to-use-free-google-smtp-server).

#### Temporal server

Execute the following command:

```sh
cd packages/docker-compose

docker-compose up -d
```

#### Temporal worker

Launch a Temporal worker:

```sh
cd packages/temporal

yarn start.watch
```

### Back-end

Go to `packages/api` directory, create a `.env` by copying `.env.example`.

Then launch the API with the following command.

```sh
cd packages/api

yarn dev
```

### Front-end

Launch SvelteKit development server with the following command.

```sh
cd packages/app

yarn dev
```

The front-end will then be accessible at http://localhost:3000.

If not, check the URL printed in the logs.
