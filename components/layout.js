import React from 'react'

import Head from 'next/head'


export default ({ children }) => (
  <div style={{
    fontFamily: '"Baskerville", serif',
    fontSize: '16px',
    lineHeight: '1.5',
    maxWidth: '900px',
    margin: '20px auto 50px',
    padding: '20px',
  }}>
    <Head>
      <meta property="og:image" content="http://pspcz-audio.herokuapp.com/static/logo-poslanecka-snemovna-parlamentu-cr.png" />
    </Head>

    <img
      src="/static/logo-poslanecka-snemovna-parlamentu-cr.png"
      alt="Poslanecká sněmovna Parlamentu České republiky"
      style={{
        display: 'block',
        margin: '0 auto 30px',
      }}
    />
    <hr />
    {children}
  </div>
)
