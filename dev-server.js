// Servidor local só pra desenvolvimento, sem precisar da Vercel CLI.
// Roteia qualquer chamada /api/<nome> para o arquivo correspondente em
// /api/<nome>.js, igual a Vercel faria em produção.
//
// Uso: node --env-file=.env dev-server.js
// (o --env-file já carrega o seu .env automaticamente, Node 20.6+)

import http from 'node:http'

const PORT = 3000

const server = http.createServer((req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  const routeName = req.url.replace('/api/', '').split('?')[0]
  if (!/^[a-zA-Z0-9_-]+$/.test(routeName)) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Rota inválida' }))
    return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', async () => {
    try {
      req.body = body ? JSON.parse(body) : {}
    } catch {
      req.body = {}
    }

    res.status = (code) => { res.statusCode = code; return res }
    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(obj))
    }

    try {
      // "?t=" força reimportar o módulo a cada chamada, então editar um
      // arquivo em /api não exige reiniciar o dev-server.js.
      const mod = await import(`./api/${routeName}.js?t=${Date.now()}`)
      await mod.default(req, res)
    } catch (err) {
      console.error(err)
      res.status(404).json({ error: `Rota não encontrada: /api/${routeName}` })
    }
  })
})

server.listen(PORT, () => {
  console.log(`API local rodando em http://localhost:${PORT}/api/*`)
})