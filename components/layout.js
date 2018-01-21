import React from 'react'

import Head from 'next/head'


export default ({ children }) => (
  <div className="layout">
    <Head>
      <meta name="viewport" content="initial-scale=1" />
      <meta property="og:image" content="http://pspcz-audio.herokuapp.com/static/logo-poslanecka-snemovna-parlamentu-cr.png" />
      <style>{`
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </Head>

    <div className="header">
      <img
        className="logo"
        src="/static/logo-poslanecka-snemovna-parlamentu-cr.png"
        alt="Poslanecká sněmovna Parlamentu České republiky"
      />
    </div>

    {children}

    <style jsx>{`
      .layout {
        font-family: Baskerville, serif;
        font-size: 16px;
        line-height: 1.5;
        max-width: 900px;
        margin: 20px auto 50px;
        padding: 20px;
      }

      .header {
        padding-bottom: 20px;
        border-bottom: 1px solid #AAA;
      }

      .logo {
        display: block;
        margin: 0 auto;
      }

      @media (max-width: 600px) {
        .layout {
          padding: 0;
        }

        .header {
          padding-bottom: 15px;
        }

        .logo {
          height: 80px;
        }
      }
    `}</style>
  </div>
)
