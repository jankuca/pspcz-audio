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

  render() {
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
                >
                  {audiozaznam['from_time']} – {audiozaznam['to_time']}
                </li>
              )}
            </ul>
          </div>
        </div>
      </Layout>
    )
  }
}
