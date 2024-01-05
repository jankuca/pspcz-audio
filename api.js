const fetch = require('node-fetch')


function listJednaciDny(idSnemovny, roky) {
  return Promise.all(
    roky.map((rok) => {
      const url = `http://www.psp.cz/eknih/${idSnemovny}/audio/${rok === 'null' ? '' : `${rok}/`}index.htm`
      return fetch(url).then((res) => ({ res, rok }))
    })
  )
    .then((responses) => {
      return Promise.all(
        responses.map(({ res, rok }) => {
          return res.text().then((html) => ({ html, rok }))
        })
      )
    })
    .then((htmlPerRok) => {
      return htmlPerRok.map(({ html, rok }) => {
        const jednaciDny = []
        html.replace(/<a href="((?:\d{4}\/)?\d{1,2}\/\d{1,2})\/index.htm"/g, (match, link) => {
          const dateParts = link.split('/').slice(0, 3)
          const fullDateParts = dateParts.length === 3 ? dateParts : [rok, ...dateParts]
          jednaciDny.push({
            'id': fullDateParts.join('/'),
            'den': [...fullDateParts].reverse().join('.'),
            'link': `http://www.psp.cz/eknih/${idSnemovny}/audio/${link}/index.htm`,
          })
        })
        return jednaciDny
      }).flat()
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
        return listJednaciDny(
          query['snemovna'] || '2017ps',
          query['roky'] ? query['roky'].split(',') : ['null']
        )
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
