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

        <style jsx>{`
          .heading {
            margin: 0;
            padding: 20px 0;
            border-bottom: 1px solid #AAA;
            font-size: 20px;
            text-align: center;
          }

          .day-list {
            padding: 0;
            list-style: none;
            font-family: "Fira Code", "Menlo", monospace;
            font-size: 13px;
            text-align: center;
          }

          .day-list__item {
            color: blue;
            cursor: pointer;
            text-decoration: underline;
          }

          @media (max-width: 600px) {
            .heading {
              padding: 10px 0;
              font-size: 20px;
              font-weight: normal;
            }

            .day-list {
              font-size: 16px;
              line-height: 2em;
            }
          }
        `}</style>

        <h2 className="heading">Jednací dny</h2>
        <ul className="day-list">
          {this.props.jednaciDny.map((jednaciDen) =>
            <li>
              <a
                className="day-list__item"
                href={`./jednaci-dny?snemovna=${this.props.idSnemovny}&den=${jednaciDen['id']}`}
              >
                {jednaciDen['den']}
              </a>
            </li>
          )}
        </ul>
      </Layout>
    )
  }
}
