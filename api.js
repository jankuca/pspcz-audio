const fetch = require('node-fetch')


function listJednaciDny(idSnemovny) {
  return fetch(`http://www.psp.cz/eknih/${idSnemovny}/audio/index.htm`)
    .then((res) => {
      return res.text()
    })
    .then((html) => {
      const jednaciDny = []
      html.replace(/<a href="(\d{4}\/\d{1,2}\/\d{1,2}\/index.htm)"/g, (match, link) => {
        jednaciDny.push({
          'id': link.replace('/index.htm', ''),
          'den': link.split('/').slice(0, 3).reverse().join('.'),
          'link': `http://www.psp.cz/eknih/${idSnemovny}/audio/${link}`,
        })
      })
      return jednaciDny
    })
}


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
      case '/jednaci-dny':
        return listJednaciDny(query['snemovna'] || '2017ps')
      default:
        return null
    }
  }
}
