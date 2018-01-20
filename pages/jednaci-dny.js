import React from 'react'
import fetch from 'isomorphic-unfetch'

import Head from 'next/head'
import Layout from '../components/layout'
import Player from '../components/player'


function parseTime(timestamp) {
  const [ hrs, mins, secs ] = timestamp.split(':').map(x => Number(x))
  return hrs * 3600 + (mins || 0) * 60 + (secs || 0)
}

function getOverlapAudiozaznamu(audiozaznam, nextAudiozaznam) {
  if (!nextAudiozaznam) {
    return null
  }

  // NOTE: The overlap is always ~1.5s off.
  const currentEnd = parseTime(audiozaznam['to_time']) - 1.5
  const nextStart = parseTime(nextAudiozaznam['from_time'])

  // NOTE: Overlap in seconds.
  return Math.max(0, currentEnd - nextStart)
}

function pad(value, length) {
  let str = String(value)
  while (str.length < length) {
    str = `0${str}`
  }
  return str
}


export default class extends React.PureComponent {
  static async getInitialProps({ req, query }) {
    const urlRoot = (req && req.headers && req.headers['host']) ? `http://${req.headers['host']}` : ''
    const result = await fetch(`${urlRoot}/api/audio-zaznamy?snemovna=${query['snemovna']}&jednaci-den=${query['den']}`)
    const audiozaznamy = await result.json()
    return {
      idSnemovny: query['snemovna'],
      idJednacihoDne: query['den'],
      audiozaznamy,
    }
  }

  state = {
    currentTimestamp: null,
    indexAudiozaznamu: -1,
    urlAudiozaznamu: null,
    contentsStenozaznamu: {},
    loadingsStenozaznamu: {},
  }

  componentDidMount() {
    this._updateStenozaznamy()
  }

  componentDidUpdate() {
    this._updateStenozaznamy()
  }

  _updateStenozaznamy() {
    const audiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu]

    if (
      audiozaznam &&
      !this.state.contentsStenozaznamu[audiozaznam['stenozaznam']] &&
      !this.state.loadingsStenozaznamu[audiozaznam['stenozaznam']]
    ) {
      this._loadStenozaznam(
        audiozaznam['schuze'],
        audiozaznam['id'],
        audiozaznam['stenozaznam']
      )
    }
  }

  async _loadStenozaznam(idSchuze, idAudiozaznamu, idStenozaznamu) {
    this.setState((prevState) => {
      return {
        loadingsStenozaznamu: {
          ...prevState.loadingsStenozaznamu,
          [idStenozaznamu]: true,
        },
      }
    })

    const result = await fetch(`/api/stenozaznamy?snemovna=${this.props.idSnemovny}&schuze=${idSchuze}&stenozaznam=${idStenozaznamu}`)
    const contents = await result.json()
    this.setState((prevState) => {
      return {
        contentsStenozaznamu: {
          ...prevState.contentsStenozaznamu,
          [idStenozaznamu]: contents,
        },
        loadingsStenozaznamu: {
          ...prevState.loadingsStenozaznamu,
          [idStenozaznamu]: false,
        },
      }
    })
  }

  _handlePlayRequestAudiozaznamu = (indexAudiozaznamu) => {
    const audiozaznam = this.props.audiozaznamy[indexAudiozaznamu]

    if (audiozaznam) {
      this.setState({
        indexAudiozaznamu,
        urlAudiozaznamu: audiozaznam['link'],
      })
    }
  }

  _handlePlayNextRequest = () => {
    this._handlePlayRequestAudiozaznamu(this.state.indexAudiozaznamu + 1)
  }

  _handleTime = (currentAudioProgress) => {
    const audiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu]
    if (!audiozaznam) {
      this.setState({
        currentTimestamp: null,
      })
      return
    }

    const currentAudioStartTime = parseTime(audiozaznam['from_time'])
    const currentTime = currentAudioStartTime + currentAudioProgress
    const currentHrs = Math.floor(currentTime / 3600)
    const currentMins = Math.floor((currentTime % 3600) / 60)
    const currentSecs = currentTime % 60

    this.setState({
      currentTimestamp: `${currentHrs}:${pad(currentMins, 2)}:${pad(currentSecs, 2)}`,
    })
  }

  render() {
    const audiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu]
    const contentsStenozaznamu = []
      .concat(
        audiozaznam ?
          this.state.contentsStenozaznamu[audiozaznam['stenozaznam']] || [
            this.state.loadingsStenozaznamu[audiozaznam['stenozaznam']] ? '(Načítá se…)' : '(Nedostupné)'
          ] :
          []
      )
    return (
      <Layout>
        <Head>
          <title>Jednací den {this.props.idJednacihoDne} – PSP ČR</title>
        </Head>

        <h2 style={{ textAlign: 'center' }}>Jednací den {this.props.idJednacihoDne}</h2>
        <hr />

        <div style={{ display: 'flex' }}>
          <div style={{ paddingRight: '50px' }}>
            <ul style={{
              width: '150px',
              margin: '0',
              padding: '20px 0',
              listStyle: 'none',
              fontFamily: '"Fira Code", "Menlo", monospace',
              fontSize: '13px',
              textAlign: 'right',
            }}>
              {this.props.audiozaznamy.map((audiozaznam, indexAudiozaznamu) =>
                <li
                  style={{
                    color: 'blue',
                    cursor: 'pointer',
                    fontWeight: (indexAudiozaznamu === this.state.indexAudiozaznamu) ? 'bold' : 'normal',
                    textDecoration: 'underline',
                  }}
                  onMouseDown={() => { this._handlePlayRequestAudiozaznamu(indexAudiozaznamu) }}
                >
                  {audiozaznam['from_time']} – {audiozaznam['to_time']}
                </li>
              )}
            </ul>
          </div>

          <div style={{
            flex: '1',
            padding: '20px 0',
            textAlign: 'justify',
          }}>
            <Player
              url={this.state.urlAudiozaznamu}
              onPlayNextRequest={this._handlePlayNextRequest}
              onTime={this._handleTime}
            />

            {this.state.urlAudiozaznamu && this.state.currentTimestamp &&
              <div style={{
                fontFamily: '"Fira Code", "Menlo", monospace',
                fontSize: '13px',
                fontWeight: 'bold',
              }}>
                {this.props.idJednacihoDne} {this.state.currentTimestamp}
                <hr
                  style={{ margin: '20px 0' }}
                />
              </div>
            }

            {contentsStenozaznamu.map((content, index) =>
              <p key={index} dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
        </div>
      </Layout>
    )
  }
}
