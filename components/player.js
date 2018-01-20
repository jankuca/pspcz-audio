import React from 'react'


export default class Player extends React.PureComponent {
  props: {
    url: ?string,
    onTime: ?(number) => void,
  }

  _node: ?Element

  _audio = null
  _loadingAudio = false

  componentDidMount() {
    this._startPlaying(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this._switchAudio(this.props, nextProps)
  }

  _startPlaying(props) {
    if (props.url) {
      const audio = this._createAudio(props.url)
      audio.oncanplaythrough = () => {
        this._loadingAudio = false
        this._play(audio, props)
      }

      this._node.appendChild(audio)
      this._audio = audio
      this._audio.style.display = ''
      this._loadingAudio = true
    }
  }

  _switchAudio(prevProps, nextProps) {
    if (prevProps.url === nextProps.url) {
      return
    }

    if (this._audio) {
      this._node.removeChild(this._audio)
      this._disposeAudio(this._audio)
      this._audio = null
      this._loadingAudio = false
    }

    this._startPlaying(nextProps)
  }

  _createAudio(url) {
    const audio = new Audio(url)
    audio.controls = true
    audio.style.display = 'none'
    audio.style.width = '100%'
    return audio
  }

  _disposeAudio(audio) {
    audio.pause()
    audio.style.display = 'none'
    audio.oncanplaythrough = null
    audio.ontimeupdate = null
    audio.onended = null
  }

  _play(audio, props) {
    audio.play()
      .then(() => {
        audio.ontimeupdate = () => {
          if (props.onTime) {
            props.onTime(Math.floor(audio.currentTime))
          }
        }
      })
  }

  render() {
    return (
      <div ref={(node) => { this._node = node }} />
    )
  }
}
