# Elio DAO Frontend

## About

This is the frontend UI for Elio DAO. Users can use this interface to create DAOs and vote on proposals.  


## Status

:hammer_and_wrench: This repo is still in the early development stage and please use it at your own risk. Currently, contracts are only available on Stellar's Futurenet. 

Our design guide and mockups are [here](./design/)

## Tech and code structure

![Stellar](https://img.shields.io/badge/Stellar-090020?style=for-the-badge&logo=stellar&logoColor=white) ![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) 

This application is built with React and Next.js. We use Tailwind for CSS and [Zustand](https://github.com/pmndrs/zustand) for state management.


Zustand stores folder is [here](./src/stores/). Query actions are also in the [`useElioStore`](./src/stores/elioStore.tsx) file. 

Most of the transaction actions are in the [`useElioDao`](./src/hooks/useElioDao.tsx) hook

## Getting Started

- Please have one of these wallet extensions installed on your browser: [Freighter](https://www.freighter.app/ "Freighter") only for now
- Please turn ON experimental mode and change the network to FUTURENET on Freighter
- You will need some Stellar XLM tokens to do transactions. For now, you can use the friendbot on Freighter wallet to fund your account. As of now, you will need 1000 XLM tokens to create a DAO.
- Check the [config](./src/config) folder if you want to cutomize configurations. 

> The frontend defaults to the service of the Elio DAO test environment.

### Docker setup

We are using docker compose.

```shell
docker compose build
docker compose up
```

### Building from source
1. Install node packages

```
yarn install
```

2. Start dev server 
```
yarn dev
```

3. Now you can open http://localhost:3000 on your browser to see the application.

We obtain contract addresses and some config values from our service at ```https://service.elio-dao.org/config/``` If you need to change the node endpoint, you can go to the [config](./src/config) folder


## Before commit

Please run this script to test, format, and lint code. 

```
yarn pre-commit
```


Please use this script to commit and run tests:

```
yarn commit
```


This repo uses [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) specifications


## License
[APACHE 2.0 License](https://github.com/deep-ink-ventures/elio-dao-frontend/blob/main/LICENSE)
