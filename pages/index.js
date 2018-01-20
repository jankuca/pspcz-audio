import React from 'react'
import fetch from 'isomorphic-unfetch'

import Head from 'next/head'
import Layout from '../components/layout'


export default class extends React.PureComponent {
  static async getInitialProps({ req }) {
    const urlRoot = (req && req.headers && req.headers['host']) ? `http://${req.headers['host']}` : ''
    const idSnemovny = '2017ps'
    const result = await fetch(`${urlRoot}/api/jednaci-dny?snemovna=${idSnemovny}`)
    const jednaciDny = await result.json()
    return {
      idSnemovny,
      jednaciDny,
    }
  }

  render() {
    return (
      <Layout>
        <Head>
          <title>Audio Poslanecké sněmovny Parlamentu ČR</title>
        </Head>

        <h2 style={{ textAlign: 'center' }}>Jednací dny</h2>
        <ul style={{
          padding: '0',
          listStyle: 'none',
          fontFamily: '"Fira Code", "Menlo", monospace',
          fontSize: '13px',
          textAlign: 'center',
        }}>
          {this.props.jednaciDny.map((jednaciDen) =>
            <li>{jednaciDen['den']}</li>
          )}
        </ul>
      </Layout>
    )
  }
}
