import React from 'react'
import fetch from 'isomorphic-unfetch'

import Head from 'next/head'
import Layout from '../components/layout'


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
    indexAudiozaznamu: -1,
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
      })
    }
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
            {contentsStenozaznamu.map((content, index) =>
              <p key={index} dangerouslySetInnerHTML={{ __html: content }} />
            )}
          </div>
        </div>
      </Layout>
    )
  }
}
