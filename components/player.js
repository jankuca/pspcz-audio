import React from 'react'


export default class Player extends React.PureComponent {
  props: {
    url: ?string,
    nextUrl: ?string,
    overlap: ?number,
    onOverlap: ?() => void,
    onPlayNextRequest: ?() => void,
    onTime: ?(number) => void,
  }

  _node: ?Element

  _audio = null
  _loadingAudio = false
  _nextAudio = null
  _loadingNextAudio = false
  _inOverlap = false

  componentDidMount() {
    this._startPlaying(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this._switchAudio(this.props, nextProps)
    this._prepareNextAudio(this.props, nextProps)
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

  _prepareNextAudio(prevProps, nextProps) {
    if (this._nextAudio && prevProps.nextUrl === nextProps.nextUrl) {
      return
    }

    if (this._nextAudio) {
      this._node.removeChild(this._nextAudio)
      this._disposeAudio(this._nextAudio)
      this._nextAudio = null
      this._loadingNextAudio = false
    }

    if (this._inOverlap && nextProps.nextUrl) {
      const nextAudio = this._createAudio(nextProps.nextUrl)
      nextAudio.oncanplaythrough = () => {
        this._loadingNextAudio = false
      }

      this._node.appendChild(nextAudio)
      this._nextAudio = nextAudio
      this._loadingNextAudio = true
    }

    this._inOverlap = false
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

    if (this._nextAudio && prevProps.nextUrl === nextProps.url) {
      this._audio = this._nextAudio
      this._loadingAudio = this._loadingNextAudio
      this._nextAudio = null
      this._loadingNextAudio = false
      this._inOverlap = false

      this._audio.style.display = ''
      this._play(this._audio, nextProps)
    } else {
      this._startPlaying(nextProps)
    }
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

          if (!this._inOverlap && audio.duration - audio.currentTime < props.overlap) {
            this._inOverlap = true
            if (props.onOverlap) {
              props.onOverlap()
            }
            this._prepareNextAudio(props, props)
          }
        }

        audio.onended = () => {
          if (props.onPlayNextRequest) {
            props.onPlayNextRequest()
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
