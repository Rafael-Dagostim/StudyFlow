# StudyFlow

> Frontend do **StudyFlow** — aplicação para organização de projetos de estudo com suporte a chat. Trabalha em conjunto com a [StudyFlowAPI](https://github.com/Rafael-Dagostim/StudyFlowAPI).

## Features

- Autenticação (`/login`, `/register`)
- Listagem e gerenciamento de projetos de estudo (`/`, `/projects/new`, `/projects/:id/edit`)
- Edição de perfil de usuário
- Chat integrado por projeto

## Stack

- **React 19** + **TypeScript**
- **Create React App** (react-scripts 5)
- **MUI 7** (`@mui/material`, `@mui/icons-material`) + **Emotion** — UI components
- **react-router-dom 7** — roteamento (`createBrowserRouter`)

## Estrutura

```
src/
├── App.tsx
├── index.tsx
├── router.tsx                # createBrowserRouter
├── routes.tsx                # definição das rotas filhas
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Home.tsx
│   ├── NewProject.tsx
│   ├── EditProject.tsx
│   ├── EditProfile.tsx
│   └── ChatPage.tsx
├── components/
├── styles/
├── types/
└── assets/
```

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- Backend [StudyFlowAPI](https://github.com/Rafael-Dagostim/StudyFlowAPI) rodando

### Setup

```bash
git clone https://github.com/Rafael-Dagostim/StudyFlow.git
cd StudyFlow
npm install
npm run dev      # alias de start, sobe em http://localhost:3000
```

## Scripts

| Script | Descrição |
|---|---|
| `npm run dev` / `npm start` | Dev server |
| `npm run build` | Build de produção em `build/` |
| `npm test` | Testes (React Testing Library) |
