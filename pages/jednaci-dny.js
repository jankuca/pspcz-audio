import React from 'react'
import classnames from 'classnames'
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
    urlNextAudiozaznamu: null,
    overlap: null,
    inOverlap: false,
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
    const prevAudiozaznam = (this.state.indexAudiozaznamu > 0) ? this.props.audiozaznamy[this.state.indexAudiozaznamu - 1] : null
    const audiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu]
    const nextAudiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu + 1]

    if (
      prevAudiozaznam &&
      !this.state.contentsStenozaznamu[prevAudiozaznam['stenozaznam']] &&
      !this.state.loadingsStenozaznamu[prevAudiozaznam['stenozaznam']]
    ) {
      this._loadStenozaznam(
        prevAudiozaznam['schuze'],
        prevAudiozaznam['id'],
        prevAudiozaznam['stenozaznam']
      )
    }

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

    if (
      nextAudiozaznam &&
      !this.state.contentsStenozaznamu[nextAudiozaznam['stenozaznam']] &&
      !this.state.loadingsStenozaznamu[nextAudiozaznam['stenozaznam']]
    ) {
      this._loadStenozaznam(
        nextAudiozaznam['schuze'],
        nextAudiozaznam['id'],
        nextAudiozaznam['stenozaznam']
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
    const nextAudiozaznam = this.props.audiozaznamy[indexAudiozaznamu + 1]

    if (audiozaznam) {
      this.setState({
        indexAudiozaznamu,
        urlAudiozaznamu: audiozaznam['link'],
        urlNextAudiozaznamu: nextAudiozaznam['link'],
        overlap: getOverlapAudiozaznamu(audiozaznam, nextAudiozaznam),
        inOverlap: false,
      })
    }
  }

  _handleOverlap = () => {
    this.setState({
      inOverlap: true,
    })
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
    const prevAudiozaznam = (this.state.indexAudiozaznamu > 0) ? this.props.audiozaznamy[this.state.indexAudiozaznamu - 1] : null
    const audiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu]
    const nextAudiozaznam = this.props.audiozaznamy[this.state.indexAudiozaznamu + 1]

    const contentsStenozaznamu = []
      .concat(
        (!this.state.inOverlap && prevAudiozaznam) ?
          this.state.contentsStenozaznamu[prevAudiozaznam['stenozaznam']] || [
            this.state.loadingsStenozaznamu[prevAudiozaznam['stenozaznam']] ? '(Načítá se…)' : '(Nedostupné)'
          ] :
          []
      )
      .concat(
        audiozaznam ?
          this.state.contentsStenozaznamu[audiozaznam['stenozaznam']] || [
            this.state.loadingsStenozaznamu[audiozaznam['stenozaznam']] ? '(Načítá se…)' : '(Nedostupné)'
          ] :
          []
      )
      .concat(
        (this.state.inOverlap && nextAudiozaznam) ?
          this.state.contentsStenozaznamu[nextAudiozaznam['stenozaznam']] || [
            this.state.loadingsStenozaznamu[nextAudiozaznam['stenozaznam']] ? '(Načítá se…)' : '(Nedostupné)'
          ] :
          []
      )

    return (
      <Layout>
        <style jsx>{`
          .heading {
            margin: 0;
            padding: 20px 0;
            border-bottom: 1px solid #AAA;
            font-size: 20px;
            text-align: center;
          }

          .page {
            display: flex;
            padding: 35px 0;
          }

          .sidebar {
            padding-right: 50px;
          }

          .audio-list {
            width: 150px;
            margin: 0;
            padding: 0;
            list-style: none;
            font-family: "Fira Code", "Menlo", monospace;
            font-size: 13px;
            text-align: right;
          }

          .audio-list__item {
            color: blue;
            cursor: pointer;
            text-decoration: underline;
          }

          .audio-list__item--active {
            font-weight: bold;
          }

          .content {
            flex: 1;
            padding: 0;
            text-align: justify;
          }

          .content__separator {
            margin: 20px 0;
            border: 0;
            border-bottom: 1px solid #AAA;
          }

          .timestamp {
            display: block;
            margin: 0;
            padding: 10px 15px;
            background-color: #333;
            color: #EEE;
            font-family: "Fira Code", "Menlo", monospace;
            font-size: 13px;
            font-weight: bold;
          }

          @media (max-width: 600px) {
            .heading {
              padding: 10px 0;
              font-size: 20px;
              font-weight: normal;
            }

            .page {
              display: block;
            }

            .sidebar {
              padding: 0;
              padding-bottom: 30px;
            }

            .audio-list {
              width: auto;
              font-size: 16px;
              line-height: 2em;
              text-align: center;
            }

            .content {
              flex: none;
              padding: 20px;
            }

            .player-container {
              margin-bottom: 50px;
            }

            .timestamp {
              text-align: center;
            }
          }
        `}</style>

        <Head>
          <title>Jednací den {this.props.idJednacihoDne} – PSP ČR</title>
        </Head>

        <h2 className="heading">Jednací den {this.props.idJednacihoDne}</h2>

        <div className="page">
          <div className="sidebar">
            <ul className="audio-list">
              {this.props.audiozaznamy.map((audiozaznam, indexAudiozaznamu) =>
                <li
                  className={classnames({
                    'audio-list__item': true,
                    'audio-list__item--active': (
                      indexAudiozaznamu === this.state.indexAudiozaznamu ||
                      (this.state.inOverlap && indexAudiozaznamu === this.state.indexAudiozaznamu + 1)
                    ),
                  })}
                  onMouseDown={() => { this._handlePlayRequestAudiozaznamu(indexAudiozaznamu) }}
                >
                  {audiozaznam['from_time']} – {audiozaznam['to_time']}
                </li>
              )}
            </ul>
          </div>

          <div className="content">
            <div className="player-container">
              <Player
                url={this.state.urlAudiozaznamu}
                nextUrl={this.state.urlNextAudiozaznamu}
                overlap={this.state.overlap}
                onOverlap={this._handleOverlap}
                onPlayNextRequest={this._handlePlayNextRequest}
                onTime={this._handleTime}
              />

              {this.state.urlAudiozaznamu && this.state.currentTimestamp &&
                <div className="timestamp">
                  {this.props.idJednacihoDne} {this.state.currentTimestamp}
                </div>
              }
            </div>

            {contentsStenozaznamu.map((content, index) =>
              <p key={index} dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
        </div>
      </Layout>
    )
  }
}
