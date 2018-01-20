import React from 'react'

export default ({ children }) => (
  <div style={{
    fontFamily: '"Baskerville", serif',
    fontSize: '16px',
    lineHeight: '1.5',
    maxWidth: '900px',
    margin: '50px auto',
    padding: '20px',
  }}>
    <h1 style={{ textAlign: 'center' }}>Poslanecká sněmovna Parlamentu České republiky</h1>
    <hr />
    {children}
  </div>
)
