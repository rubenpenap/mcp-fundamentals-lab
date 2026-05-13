# MCP Fundamentals Lab

Presentación y laboratorio local sobre fundamentos de MCP, pensada para uso interno y aprendizaje guiado.

## Qué incluye

- explicación de arquitectura MCP
- `ping`, `tools`, `resources`, `resources in tools` y `prompts`
- ejemplos de código paso a paso
- diagrams/flows en modo oscuro
- playground visual de mensajes JSON-RPC
- guía de laboratorio final

## Cómo correrlo

```bash
npm start
```

Luego abrí:

```txt
http://localhost:4173
```

## Despliegue en GitHub Pages

El repo incluye un workflow en:

```txt
.github/workflows/deploy-pages.yml
```

Hace deploy automático a GitHub Pages cuando hay push a `main`.

Si es la primera vez que lo activas en el repositorio:

1. Ve a **Settings → Pages**
2. En **Build and deployment**, selecciona **GitHub Actions**
3. Haz push a `main` o ejecuta el workflow manualmente

## Stack

- HTML
- CSS
- JavaScript vanilla
- servidor HTTP mínimo con Node

## Alcance del contenido

- arquitectura MCP
- `ping`, `tools`, `resources`, `resources in tools` y `prompts`
- ejemplos TypeScript y mensajes JSON-RPC
- criterio de diseño para servidores MCP
