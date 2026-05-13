const navItems = [
  { id: 'fundamentos', label: '1. Fundamentos' },
  { id: 'playground', label: '2. Playground JSON-RPC' },
  { id: 'arquitectura', label: '3. Arquitectura MCP' },
  { id: 'ping', label: '4. Ping' },
  { id: 'tools', label: '5. Tools' },
  { id: 'resources', label: '6. Resources' },
  { id: 'resource-tools', label: '7. Resources in Tools' },
  { id: 'prompts', label: '8. Prompts' },
  { id: 'diseno', label: '9. Diseño de servidores MCP' },
  { id: 'laboratorio-final', label: '10. Laboratorio final' },
  { id: 'glosario', label: '11. Glosario' },
]

const courseSections = [
  {
    id: 'arquitectura',
    label: 'Arquitectura MCP',
    intro:
      'El curso parte de la idea correcta: MCP no es un framework ni una librería, es un contrato de comunicación entre un cliente MCP y un servidor MCP. Si eso no se entiende, después se confunden las tools con endpoints mágicos.',
    cards: [
      {
        title: 'Modelo mental mínimo',
        body: 'Pensalo así: el host es la app donde vive el usuario, el cliente MCP es el adaptador que habla el protocolo y el servidor MCP expone capacidades. El modelo NO “llama APIs”; el host decide cómo integrar ese flujo.',
        list: [
          'Host: ChatGPT, Claude Desktop, Cursor, un IDE o una app propia.',
          'Cliente MCP: implementa la conversación protocolar con el servidor.',
          'Servidor MCP: declara tools, resources, prompts y capacidades.',
        ],
      },
      {
        title: 'Transporte',
        body: 'En este laboratorio usamos stdio porque simplifica la puesta en marcha: el cliente inicia un proceso y se comunica por stdin/stdout. Conceptualmente, el protocolo también podría viajar por HTTP u otros transportes.',
        list: [
          'stdio: ideal para laboratorio local y herramientas instaladas.',
          'HTTP: más natural para distribución remota y menor fricción para usuarios.',
          'El transporte NO cambia la semántica central de tools/resources/prompts.',
        ],
      },
      {
        title: 'JSON-RPC',
        body: 'La conversación se modela como mensajes estructurados: request, response y notifications. Eso importa porque el protocolo necesita ids, métodos, params y resultados predecibles.',
        list: [
          'request: `method` + `params` + `id`',
          'response: `result` o `error`, asociado al mismo `id`',
          'notifications: eventos sin respuesta esperada',
        ],
      },
    ],
    diagram: {
      title: 'Flujo mental del protocolo',
      nodes: [
        ['Usuario + Host', 'secondary'],
        ['Cliente MCP', ''],
        ['Servidor MCP', 'secondary'],
        ['Datos / APIs / Lógica', ''],
      ],
      arrows: ['intención', 'JSON-RPC', 'operación real'],
    },
    code: {
      title: 'Esqueleto base del servidor',
      file: 'server.ts',
      content: `import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new McpServer(
  {
    name: 'mi-servidor-mcp',
    title: 'Mi servidor MCP',
    version: '1.0.0',
  },
  {
    instructions: 'Expone capacidades de ejemplo para aprender MCP.',
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Servidor MCP corriendo sobre stdio')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})`,
    },
  },
  {
    id: 'ping',
    label: 'Ping',
    intro:
      'El primer módulo no enseña lógica de negocio; enseña CONECTIVIDAD. Y eso está bien. Antes de diseñar tools, primero hay que verificar que cliente, servidor y transporte realmente se entienden.',
    cards: [
      {
        title: 'Qué valida `ping`',
        body: 'Valida que la sesión existe, que el transporte funciona y que el servidor responde. No prueba lógica de negocio. Prueba cableado.',
        list: [
          'Proceso levantado correctamente.',
          'Inicialización exitosa.',
          'Comunicación cliente-servidor operativa.',
        ],
      },
      {
        title: 'Capacidades negociadas',
        body: 'Durante la inicialización, cliente y servidor acuerdan qué soporta cada uno. El SDK resuelve buena parte de esto automáticamente, pero igual hay que entender qué está pasando.',
        list: [
          'No todo cliente soporta todo.',
          'No toda capacidad declarada tendrá una UX equivalente en cada host.',
          'El protocolo define la conversación, no la interfaz final.',
        ],
      },
    ],
    protocol: {
      title: 'Intercambio mínimo',
      steps: [
        'El cliente inicia sesión con el servidor y declara capacidades.',
        'El servidor responde con las suyas.',
        'El cliente envía `ping` para comprobar conectividad.',
        'El servidor responde con `result: {}`.',
      ],
    },
    code: {
      title: 'Ejemplo JSON-RPC',
      file: 'ping.json',
      content: `{
  "jsonrpc": "2.0",
  "id": "123",
  "method": "ping"
}

{
  "jsonrpc": "2.0",
  "id": "123",
  "result": {}
}`,
    },
  },
  {
    id: 'tools',
    label: 'Tools',
    intro:
      'Acá aparece la primera capacidad “visible”. Una tool es una operación invocable. Pero ojo: no es un endpoint REST reciclado. Una buena tool se diseña para ser entendida por un modelo y supervisada por un humano.',
    cards: [
      {
        title: 'Qué hace una tool',
        body: 'Una tool expone una acción con nombre, descripción y schema de entrada. El cliente puede descubrirla y llamarla. El servidor ejecuta y devuelve contenido estructurado.',
        list: [
          'Nombre orientado a intención: `create_entry`, `get_tag`.',
          'Descripción clara para el modelo y potencialmente para la UI.',
          'Schema de entrada para validar y guiar al LLM.',
        ],
      },
      {
        title: 'Control del modelo',
        body: 'El material fuente remarca que las tools son model-controlled. Eso significa que el modelo puede decidir usarlas. Por eso el diseño semántico importa tanto.',
        list: [
          'No uses nombres ambiguos.',
          'No escondas precondiciones.',
          'Pensá en confirmaciones humanas para acciones sensibles.',
        ],
      },
      {
        title: 'Errores y validación',
        body: 'El curso usa Zod e invariants para rechazar inputs inválidos. PERFECTO: si el contrato no es estricto, el modelo genera basura y después se culpa al LLM por un diseño débil.',
        list: [
          'Schema para estructura.',
          'Validaciones de dominio para reglas reales.',
          'Mensajes de error concretos.',
        ],
      },
    ],
    compare: {
      title: 'Tool bien diseñada vs mal diseñada',
      rows: [
        ['Nombre', '`add` o `create_entry`', '`doStuff`, `run`, `process`'],
        ['Schema', 'campos descriptivos con tipos claros', 'objeto libre sin semántica'],
        ['Resultado', 'contenido legible + estructurado', 'string crudo poco reutilizable'],
      ],
    },
    code: {
      title: 'Registrar una tool con schema',
      file: 'tools.ts',
      content: String.raw`import { z } from 'zod'

server.registerTool(
  'add',
  {
    title: 'Add',
    description: 'Suma dos números',
    inputSchema: {
      firstNumber: z.number().describe('Primer número'),
      secondNumber: z.number().describe('Segundo número'),
    },
  },
  async ({ firstNumber, secondNumber }) => {
    if (secondNumber < 0) {
      throw new Error('Second number cannot be negative')
    }

    return {
      content: [
        {
          type: 'text',
          text: \`The sum of \${firstNumber} and \${secondNumber} is \${firstNumber + secondNumber}.\`
        },
      ],
    }
  },
)`,
    },
  },
  {
    id: 'resources',
    label: 'Resources',
    intro:
      'Aquí aparece una distinción FUNDAMENTAL. Si se necesita exponer contexto legible y direccionable, muchas veces no conviene una tool sino un resource. Una tool “hace”; un resource “representa”.',
    cards: [
      {
        title: 'Qué es un resource',
        body: 'Es una pieza de información accesible por URI. Puede ser un archivo, una entrada de base de datos, un documento o metadata. El cliente la puede listar o leer.',
        list: [
          'Identidad estable vía URI.',
          'MIME type para describir el contenido.',
          'Ideal para contexto reutilizable.',
        ],
      },
      {
        title: 'Templates y completions',
        body: 'El repo avanza de un resource fijo a resource templates con parámetros como `{id}` y luego agrega completions para ayudar a descubrir valores válidos. Eso mejora MUCHO la UX.',
        list: [
          'URI base: `epicme://tags`',
          'Template: `epicme://entries/{id}`',
          'Completion: sugerir ids existentes al escribir.',
        ],
      },
      {
        title: 'Regla práctica',
        body: 'Si eso sería un GET en una API tradicional, probablemente es un buen candidato a resource.',
        list: [
          'Leer una entrada de diario.',
          'Listar tags.',
          'Exponer metadata de la app.',
        ],
      },
    ],
    protocol: {
      title: 'Flujo típico de resources',
      steps: [
        'El cliente pide `resources/list` para descubrir lo disponible.',
        'El usuario o la app elige uno.',
        'El cliente hace `resources/read` con una URI.',
        'El servidor devuelve `contents` con URI, mimeType y texto/datos.',
      ],
    },
    code: {
      title: 'Resource simple + template',
      file: 'resources.ts',
      content: `import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'

server.registerResource(
  'tags',
  'epicme://tags',
  {
    title: 'Tags',
    description: 'Todos los tags disponibles',
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.toString(),
        mimeType: 'application/json',
        text: JSON.stringify(await db.getTags()),
      },
    ],
  }),
)

server.registerResource(
  'entry',
  new ResourceTemplate('epicme://entries/{id}'),
  {
    title: 'Journal Entry',
    description: 'Una entrada individual por id',
  },
  async (uri, { id }) => ({
    contents: [
      {
        uri: uri.toString(),
        mimeType: 'application/json',
        text: JSON.stringify(await db.getEntry(Number(id))),
      },
    ],
  }),
)`,
    },
  },
  {
    id: 'resource-tools',
    label: 'Resources in Tools',
    intro:
      'Este módulo es clave porque mezcla acción y contexto. Una tool puede devolver texto, pero también puede embeder un resource o devolver links a resources. Eso hace que la salida sea más útil para hosts y modelos.',
    cards: [
      {
        title: 'Embedded resource',
        body: 'Devuelve el recurso completo dentro del resultado de la tool. Es útil cuando se necesita dar contexto inmediato y el payload es razonable.',
        list: [
          '`type: "resource"`',
          'incluye `uri`, `mimeType` y contenido',
          'bueno para respuestas pequeñas o atómicas',
        ],
      },
      {
        title: 'Resource link',
        body: 'Devuelve una referencia en vez del payload completo. Es mejor para listas, contenidos pesados o escenarios donde el cliente decide si profundizar.',
        list: [
          '`type: "resource_link"`',
          'incluye `uri`, `name`, `description`',
          'excelente para listados y navegación',
        ],
      },
      {
        title: 'Diseño inteligente',
        body: 'La elección no es estética. Es una decisión de costo, claridad y UX. Conviene incluir el recurso cuando el siguiente paso lógico es consumir el dato de inmediato. Conviene devolver un link cuando hace falta navegar o diferir la carga.',
        list: [
          'Crear algo → incluir el objeto creado.',
          'Listar muchas cosas → devolver links.',
          'Contexto grande → evitar duplicar payload.',
        ],
      },
    ],
    compare: {
      title: '¿Embed o link?',
      rows: [
        ['Caso', 'Mejor opción', 'Por qué'],
        ['`get_entry`', 'embed', 'el usuario pidió UNA entidad concreta'],
        ['`list_entries`', 'link', 'pueden ser muchas y no conviene inflar el resultado'],
        ['`create_tag`', 'embed', 'la entidad recién creada es contexto inmediato'],
      ],
    },
    code: {
      title: 'Devolver resources desde una tool',
      file: 'tools.ts',
      content: String.raw`return {
  content: [
    {
      type: 'text',
      text: 'Entry creada correctamente',
    },
    {
      type: 'resource',
      resource: {
        uri: \`epicme://entries/\${createdEntry.id}\`,
        mimeType: 'application/json',
        text: JSON.stringify(createdEntry),
      },
    },
  ],
)}`,
    },
  },
  {
    id: 'prompts',
    label: 'Prompts',
    intro:
      'Prompts en MCP NO son “strings guardados”. Son plantillas estructuradas, descubribles y parametrizables para que el usuario o el host activen flujos recurrentes sin reescribir instrucciones cada vez.',
    cards: [
      {
        title: 'Control del usuario',
        body: 'El material fuente lo subraya bien: prompts son user-controlled. No están pensados para que el modelo los invoque solo, sino para que el usuario elija un flujo guiado.',
        list: [
          'Menú de prompts disponibles.',
          'Argumentos configurables.',
          'Mensajes estructurados listos para pasar al modelo.',
        ],
      },
      {
        title: 'Prompts con contexto',
        body: 'El ejemplo más potente del repo usa un prompt para sugerir tags a una entrada del diario y le adjunta resources con la entrada y los tags disponibles. Eso es diseño orientado a flujo, no sólo a texto bonito.',
        list: [
          'un prompt puede incluir texto + resources',
          'puede tener autocompletado de argumentos',
          'sirve para estandarizar tareas frecuentes',
        ],
      },
      {
        title: 'Optimización',
        body: 'Un prompt bien hecho reduce llamadas innecesarias a tools y hace más claro el trabajo del modelo. O sea: menos improvisación, más dirección.',
        list: [
          'indicar qué hacer',
          'indicar con qué contexto',
          'indicar qué tools usar si corresponde',
        ],
      },
    ],
    protocol: {
      title: 'Flujo típico de prompts',
      steps: [
        'El cliente lista prompts disponibles.',
        'El usuario selecciona uno y completa argumentos.',
        'El cliente pide el template al servidor.',
        'El servidor devuelve `messages` estructurados para el modelo.',
      ],
    },
    code: {
      title: 'Prompt con args + resources',
      file: 'prompts.ts',
      content: String.raw`server.registerPrompt(
  'suggest_tags',
  {
    title: 'Suggest Tags',
    description: 'Sugiere tags para una entrada',
    argsSchema: {
      entryId: z.string().describe('ID de la entrada'),
    },
  },
  async ({ entryId }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Sugiere tags relevantes y evita duplicados.',
        },
      },
      {
        role: 'user',
        content: {
          type: 'resource',
          resource: {
            uri: \`epicme://entries/\${entryId}\`,
            mimeType: 'application/json',
            text: JSON.stringify(await db.getEntry(Number(entryId))),
          },
        },
      },
    ],
  }),
)`,
    },
  },
  {
    id: 'diseno',
    label: 'Diseño de servidores MCP',
    intro:
      'Acá está la parte arquitectónica que más vale la pena llevarse. El repo enseña features, pero la lección profunda es cómo DISEÑAR bien la frontera entre modelo y sistema.',
    cards: [
      {
        title: 'Cuándo usar cada cosa',
        body: 'No mezcles conceptos por ansiedad. Si todo es tool, perdiste semántica. Si todo es resource, perdiste acción. Si todo es prompt, perdiste precisión operativa.',
        list: [
          'Tool: ejecutar una acción o cálculo.',
          'Resource: exponer contexto direccionable.',
          'Prompt: encapsular un workflow guiado.',
        ],
      },
      {
        title: 'Instrucciones del servidor',
        body: 'El ejemplo final del repo define `instructions` con workflow, best practices y common requests. Eso funciona como “documentación viva” para el host/modelo.',
        list: [
          'explicá el propósito del servidor',
          'describí workflows recomendados',
          'evitar texto vago y marketing inútil',
        ],
      },
      {
        title: 'Human in the loop',
        body: 'El protocolo permite tools poderosas, pero la UX del host debería dar visibilidad y control. Especialmente en acciones destructivas o costosas.',
        list: [
          'mostrar tool antes de ejecutar',
          'explicar inputs y outputs',
          'pedir confirmación cuando haga falta',
        ],
      },
    ],
    compare: {
      title: 'Matriz de decisión',
      rows: [
        ['Necesidad', 'Elegí', 'Motivo'],
        ['Calcular algo', 'tool', 'hay ejecución y resultado'],
        ['Leer una entidad por URI', 'resource', 'hay identidad y contexto'],
        ['Guiar una tarea repetida', 'prompt', 'hay intención reusable'],
        ['Crear algo y devolverlo', 'tool + embedded resource', 'acción + contexto inmediato'],
      ],
    },
    code: {
      title: 'Capabilities del servidor final',
      file: 'index.ts',
      content: String.raw`const server = new McpServer(
  {
    name: 'epicme',
    title: 'EpicMe',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      completions: {},
      prompts: {},
    },
    instructions: \`Acá describís workflows, buenas prácticas y requests comunes\`,
  },
)`,
    },
  },
]

const playgroundCases = {
  ping: {
    title: 'Ping',
    description: 'Verifica conectividad y sesión activa.',
    request: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "ping"
}`,
    response: `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {}
}`,
  },
  tool: {
    title: 'Tool call',
    description: 'Invoca una acción del servidor con argumentos validados.',
    request: `{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "add",
    "arguments": {
      "firstNumber": 2,
      "secondNumber": 3
    }
  }
}`,
    response: `{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "The sum of 2 and 3 is 5."
      }
    ],
    "isError": false
  }
}`,
  },
  resource: {
    title: 'Read resource',
    description: 'Lee contexto direccionado por URI.',
    request: `{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "epicme://entries/42"
  }
}`,
    response: `{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "contents": [
      {
        "uri": "epicme://entries/42",
        "mimeType": "application/json",
        "text": "{\"id\":42,\"title\":\"Reflexión\"}"
      }
    ]
  }
}`,
  },
  prompt: {
    title: 'Get prompt',
    description: 'Recupera mensajes estructurados para un workflow guiado.',
    request: `{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "prompts/get",
  "params": {
    "name": "suggest_tags",
    "arguments": {
      "entryId": "42"
    }
  }
}`,
    response: `{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Sugiere tags relevantes y evita duplicados."
        }
      }
    ]
  }
}`,
  },
}

const glossary = [
  ['Host', 'La aplicación donde vive la experiencia del usuario y/o del modelo.'],
  ['Cliente MCP', 'La pieza que implementa el protocolo y conversa con el servidor.'],
  ['Servidor MCP', 'La pieza que expone capacidades, contexto y prompts.'],
  ['Tool', 'Acción invocable por nombre con schema de entrada.'],
  ['Resource', 'Dato identificable por URI que puede listarse o leerse.'],
  ['Prompt', 'Plantilla estructurada y reusable para guiar al modelo.'],
  ['Completion', 'Mecanismo para sugerir valores válidos al completar args o templates.'],
  ['JSON-RPC', 'Protocolo de mensajes estructurados sobre el que se apoya MCP.'],
]

function renderNav() {
  const nav = document.getElementById('nav-list')
  nav.innerHTML = navItems
    .map((item) => `<li><a href="#${item.id}">${item.label}</a></li>`)
    .join('')
}

function renderIntro() {
  const root = document.getElementById('fundamentos')
  root.innerHTML = `
    <p class="eyebrow">Fundamentos</p>
    <h2 class="section-title">Qué cubre este curso</h2>
    <p class="section-intro">
      Este material sigue una progresión pedagógica clara: conexión mínima, tools, resources,
      composición entre tools y resources, y finalmente prompts. Sobre eso armé una narrativa más docente, con foco en concepto,
      criterio de diseño y ejemplos concretos.
    </p>
    <div class="grid-3">
      <article class="card">
        <p class="card-label">Objetivo</p>
        <h3>Entender MCP sin humo</h3>
        <p>
          Que puedas explicar qué problema resuelve MCP, cómo está compuesto y cómo diseñar un servidor MCP razonable.
        </p>
      </article>
      <article class="card">
        <p class="card-label">Fuentes verificadas</p>
        <h3>README + ejercicios + soluciones</h3>
        <p>
          El contenido fue consolidado como material interno y está organizado alrededor de conceptos verificables del protocolo.
        </p>
      </article>
      <article class="card">
        <p class="card-label">Enfoque</p>
        <h3>Presentación + laboratorio</h3>
        <p>
          Primero se presenta el modelo mental. Después se muestra un camino de implementación para construir uno propio.
        </p>
      </article>
    </div>
    <div class="diagram-grid section">
      <article class="diagram-card">
        <h3>Mapa general del curso</h3>
        <div class="diagram">
          <div class="diagram-node">1. Conexión<br/><strong>Ping + init</strong></div>
          <div class="diagram-arrow">→</div>
          <div class="diagram-node secondary">2. Acción<br/><strong>Tools</strong></div>
          <div class="diagram-arrow">→</div>
          <div class="diagram-node">3. Contexto<br/><strong>Resources</strong></div>
        </div>
      </article>
      <article class="diagram-card">
        <h3>Segunda mitad</h3>
        <div class="diagram">
          <div class="diagram-node secondary">4. Composición<br/><strong>Resources in Tools</strong></div>
          <div class="diagram-arrow">→</div>
          <div class="diagram-node">5. Workflow guiado<br/><strong>Prompts</strong></div>
        </div>
      </article>
      <article class="diagram-card">
        <h3>Resultado esperado</h3>
        <p>
          Salís con un criterio mucho mejor para responder esta pregunta: <strong>¿qué expongo como tool, qué como resource y qué como prompt?</strong>
        </p>
      </article>
    </div>
  `
}

function renderPlayground() {
  const root = document.getElementById('playground')
  root.innerHTML = `
    <p class="eyebrow">Playground</p>
    <h2 class="section-title">Ver el protocolo te ordena la cabeza</h2>
    <p class="section-intro">
      Tocá cada caso para ver request y response. Si no ves los mensajes, terminás razonando MCP como una caja negra. Y no, eso no alcanza.
    </p>
    <div class="playground-panel">
      <div class="playground-tabs">
        ${Object.keys(playgroundCases)
          .map(
            (key, index) => `
              <button class="playground-tab ${index === 0 ? 'active' : ''}" data-case="${key}">
                ${playgroundCases[key].title}
              </button>`,
          )
          .join('')}
      </div>
      <div id="playground-content"></div>
    </div>
  `

  const tabs = [...root.querySelectorAll('.playground-tab')]
  const content = root.querySelector('#playground-content')

  function update(caseKey) {
    const selected = playgroundCases[caseKey]
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.case === caseKey))
    content.innerHTML = `
      <div class="grid-2">
        <article class="protocol-card">
          <h3>${selected.title}</h3>
          <p>${selected.description}</p>
          ${renderCodeBlock('Request', selected.request)}
        </article>
        <article class="protocol-card">
          <h3>Response</h3>
          <p>Fijate en la forma: mismo <code>id</code>, estructura predecible, contenido typed.</p>
          ${renderCodeBlock('Response', selected.response)}
        </article>
      </div>
    `
    bindCopyButtons(content)
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => update(tab.dataset.case)))
  update('ping')
}

function renderSections() {
  const root = document.getElementById('course-sections')
  root.innerHTML = courseSections
    .map((section) => {
      const cards = `
        <div class="grid-3">
          ${section.cards
            .map(
              (card) => `
                <article class="card">
                  <p class="card-label">${section.label}</p>
                  <h3>${card.title}</h3>
                  <p>${card.body}</p>
                  <ul class="bullet-list">
                    ${card.list.map((item) => `<li>${item}</li>`).join('')}
                  </ul>
                </article>`,
            )
            .join('')}
        </div>`

      const diagram = section.diagram
        ? `
          <article class="diagram-card section">
            <h3>${section.diagram.title}</h3>
            <div class="diagram">
              ${section.diagram.nodes
                .map(
                  ([label, tone], index) => `
                    <div class="diagram-node ${tone}">${label}</div>
                    ${index < section.diagram.nodes.length - 1 ? `<div class="diagram-arrow">${section.diagram.arrows[index]}</div>` : ''}`,
                )
                .join('')}
            </div>
          </article>`
        : ''

      const compare = section.compare
        ? `
          <article class="compare-card section">
            <h3>${section.compare.title}</h3>
            <table class="table">
              <tbody>
                ${section.compare.rows
                  .map(
                    (row, index) => `
                      <tr>
                        ${row
                          .map((col) => (index === 0 ? `<th>${col}</th>` : `<td>${col}</td>`))
                          .join('')}
                      </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </article>`
        : ''

      const protocol = section.protocol
        ? `
          <article class="protocol-card section">
            <h3>${section.protocol.title}</h3>
            <div class="protocol-rail">
              ${section.protocol.steps
                .map(
                  (step, index) => `
                    <div class="protocol-step">
                      <div class="protocol-step-index">${index + 1}</div>
                      <p>${step}</p>
                    </div>`,
                )
                .join('')}
            </div>
          </article>`
        : ''

      return `
        <section id="${section.id}" class="section">
          <p class="eyebrow">${section.label}</p>
          <h2 class="section-title">${section.label}</h2>
          <p class="section-intro">${section.intro}</p>
          ${cards}
          ${diagram}
          ${compare}
          ${protocol}
          <article class="code-card section">
            <div class="code-header">
              <strong>${section.code.title}</strong>
              <span>${section.code.file}</span>
            </div>
            <pre><code>${escapeHtml(section.code.content)}</code></pre>
          </article>
        </section>
      `
    })
    .join('')
}

function renderFinalLab() {
  const root = document.getElementById('laboratorio-final')
  root.innerHTML = `
    <p class="eyebrow">Laboratorio final</p>
    <h2 class="section-title">Camino sugerido para construir tu propio servidor MCP</h2>
    <p class="section-intro">
      Esta es la síntesis práctica del curso. Si quisieras replicar el laboratorio desde cero, ESTE es el orden correcto. No empieces por prompts si todavía no puedes ni responder ping.
    </p>
    <div class="steps-grid">
      <article class="lab-card">
        <h3>Paso 1 — Conectividad</h3>
        <ul class="check-list">
          <li>Crear el servidor con <code>McpServer</code>.</li>
          <li>Conectarlo a <code>StdioServerTransport</code>.</li>
          <li>Verificar la sesión con MCP Inspector.</li>
        </ul>
      </article>
      <article class="lab-card">
        <h3>Paso 2 — Primera tool</h3>
        <ul class="check-list">
          <li>Declarar <code>capabilities.tools</code>.</li>
          <li>Registrar una tool simple y luego una con args.</li>
          <li>Agregar validación de input y reglas de dominio.</li>
        </ul>
      </article>
      <article class="lab-card">
        <h3>Paso 3 — Resources</h3>
        <ul class="check-list">
          <li>Exponer al menos un resource fijo por URI.</li>
          <li>Agregar un template con <code>{id}</code>.</li>
          <li>Sumar completions para mejorar descubribilidad.</li>
        </ul>
      </article>
      <article class="lab-card">
        <h3>Paso 4 — Composición</h3>
        <ul class="check-list">
          <li>Hacer que una tool devuelva un embedded resource.</li>
          <li>Hacer que una tool de listado devuelva resource links.</li>
          <li>Evaluar costo/beneficio de embed vs link.</li>
        </ul>
      </article>
      <article class="lab-card">
        <h3>Paso 5 — Prompt reusable</h3>
        <ul class="check-list">
          <li>Registrar un prompt con args.</li>
          <li>Adjuntar resources como contexto estructurado.</li>
          <li>Agregar completions si el flujo lo necesita.</li>
        </ul>
      </article>
      <article class="lab-card">
        <h3>Paso 6 — UX y criterio</h3>
        <ul class="check-list">
          <li>Escribir buenas <code>instructions</code> del servidor.</li>
          <li>Nombrar tools desde intención, no desde implementación.</li>
          <li>Definir confirmaciones humanas para operaciones sensibles.</li>
        </ul>
      </article>
    </div>
    <div class="lab-grid section">
      <article class="callout success">
        <strong>Entrega ideal del laboratorio:</strong>
        <p>
          Un servidor MCP pequeño pero coherente: 2 o 3 tools, 1 o 2 resources, 1 prompt y una narrativa clara en las instructions.
        </p>
      </article>
      <article class="callout warning">
        <strong>Error típico:</strong>
        <p>
          Diseñar primero la feature y recién después pensar el protocolo. Hacé lo contrario: primero decidí QUÉ interfaz necesita el modelo/usuario.
        </p>
      </article>
    </div>
  `
}

function renderGlossary() {
  const root = document.getElementById('glosario')
  root.innerHTML = `
    <p class="eyebrow">Glosario</p>
    <h2 class="section-title">Términos que debes poder explicar con claridad</h2>
    <div class="glossary-grid">
      ${glossary
        .map(
          ([term, description]) => `
            <article class="glossary-card">
              <h3>${term}</h3>
              <p>${description}</p>
            </article>`,
        )
        .join('')}
    </div>
  `
}

function renderCodeBlock(title, content) {
  return `
    <div class="code-card section">
      <div class="code-header">
        <strong>${title}</strong>
        <button class="copy-button" data-copy="${encodeURIComponent(content)}">Copiar</button>
      </div>
      <pre><code>${escapeHtml(content)}</code></pre>
    </div>
  `
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function bindCopyButtons(root = document) {
  root.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = decodeURIComponent(button.dataset.copy)
      await navigator.clipboard.writeText(text)
      const original = button.textContent
      button.textContent = 'Copiado'
      setTimeout(() => {
        button.textContent = original
      }, 1200)
    })
  })
}

renderNav()
renderIntro()
renderPlayground()
renderSections()
renderFinalLab()
renderGlossary()
bindCopyButtons()
