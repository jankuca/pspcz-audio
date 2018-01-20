const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const Api = require('./api')

const dev = (process.env['NODE_ENV'] !== 'production')
const port = process.env['PORT'] || 3000

const app = next({ dev })
const handle = app.getRequestHandler()

const api = new Api()

app.prepare().then(() => {
  createServer((req, res) => {
    // Be sure to pass `true` as the second argument to `url.parse`.
    // This tells it to parse the query portion of the URL.
    const parsedUrl = parse(req.url, true)
    const { pathname, query } = parsedUrl

    if (/^\/api(\/|$)/.test(pathname)) {
      api.handle(req, res, parsedUrl)
    } else {
      handle(req, res, parsedUrl)
    }
  }).listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
