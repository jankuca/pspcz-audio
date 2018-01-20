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


function listAudioZaznamy(idSnemovny, idJednacihoDne) {
  return fetch(`http://www.psp.cz/eknih/${idSnemovny}/audio/${idJednacihoDne}/index.htm`)
    .then((res) => {
      return res.text()
    })
    .then((html) => {
      const audioZaznamy = []
      html.replace(
        /<a href="(\d{16}\.mp3)">(\d{1,2}:\d{2}) - (\d{1,2}:\d{2})<\/a>.*?<a href="[\.\/]+stenprot\/(\d+schuz)\/(s\d+).htm"/g,
        (match, link, fromTimestamp, toTimestamp, idSchuze, idStenozaznamu) => {
          audioZaznamy.push({
            'id': link.replace('.mp3', ''),
            'from_time': fromTimestamp,
            'to_time': toTimestamp,
            'link': `http://www.psp.cz/eknih/${idSnemovny}/audio/${idJednacihoDne}/${link}`,
            'schuze': idSchuze,
            'stenozaznam': idStenozaznamu,
          })
        }
      )
      return audioZaznamy
    })
}


function getStenozaznam(idSnemovny, idSchuze, idStenozaznamu) {
  return fetch(`http://www.psp.cz/eknih/${idSnemovny}/stenprot/${idSchuze}/${idStenozaznamu}.htm`)
    .then((res) => {
      return res.text()
    })
    .then((html) => {
      const paragraphs = []
      const contentsHtml = html.match(/<!-- ex -->[\s\n]*([\s\S]*?)[\s\n]*<!-- sy -->/)[1]
      contentsHtml.replace(/<p align="justify">(.*?)<\/p>/g, (match, content) => {
        paragraphs.push(
          content
            .replace(/<a href="\//g, '<a target="_blank" href="http://www.psp.cz/')
        )
      })
      return paragraphs
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
      case '/audio-zaznamy':
        return listAudioZaznamy(
          query['snemovna'] || '2017ps',
          query['jednaci-den']
        )
      case '/stenozaznamy':
        return getStenozaznam(
          query['snemovna'] || '2017ps',
          query['schuze'],
          query['stenozaznam']
        )
      default:
        return null
    }
  }
}
