
module.exports = class Api {
  handle(req, res, { pathname, query }) {
    const apiPathname = pathname.replace(/^\/api\//, '/')
    this._getResult(apiPathname, query)
      .then((result) => {
        if (result) {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=UTF-8',
          })
          res.write(JSON.stringify(result, null, 2))
        } else {
          res.writeHead(404)
        }
        res.end()
      })
      .catch((err) => {
        res.writeHead(500)
        res.write(err.stack)
        res.end()
      })
  }

  _getResult(apiPathname, query) {
    switch (apiPathname) {
      default:
        return null
    }
  }
}
