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

  _ios = false

  _audio = null
  _loadingAudio = false
  _nextAudio = null
  _loadingNextAudio = false
  _inOverlap = false

  componentDidMount() {
    const userAgent = window.navigator.userAgent
    this._ios = Boolean(userAgent.match(/iPad/i) || userAgent.match(/iPhone/i))

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
        audio.oncanplaythrough = null
        this._loadingAudio = false
        this._play(audio, 0, props)
      }

      this._node.appendChild(audio)
      this._audio = audio
      this._audio.style.display = ''
      this._loadingAudio = true
    }
  }

  _prepareNextAudio(prevProps, nextProps) {
    // NOTE: Audio preloading is disabled for iOS because audio objects must
    //   be reused.
    if (this._ios) {
      return
    }

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

    // NOTE: Audio objects are reused on iOS which is why they can only be
    //   destroyed when the playback should be stopped due to a lack of a URL.
    //   See: https://www.ibm.com/developerworks/library/wa-ioshtml5/
    if (this._audio && (!this._ios || !nextProps.url)) {
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
      this._play(this._audio, prevProps.overlap || 0, nextProps)
    } else {
      this._startPlaying(nextProps)
    }
  }

  _createAudio(url) {
    // NOTE: Audio objects are reused on iOS to overcome unavailable autoplay.
    const audio = (this._ios && this._audio) ? this._audio : new Audio()
    audio.src = url
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

  _play(audio, startTime, props) {
    // NOTE: Seeking is not available until the audio is loaded until which
    //   duration is NaN (or maybe 0 in some browsers).
    if (audio.duration) {
      audio.currentTime = startTime
    }

    audio.play()
      .then(() => {
        audio.currentTime = startTime

        audio.ontimeupdate = () => {
          if (props.onTime) {
            props.onTime(Math.floor(audio.currentTime))
          }

          if (!this._inOverlap && audio.duration - audio.currentTime < props.overlap) {
            if (this._ios) {
              this.onended = null
              if (props.onPlayNextRequest) {
                props.onPlayNextRequest()
              }
            } else {
              this._inOverlap = true
              if (props.onOverlap) {
                props.onOverlap()
              }

              this._prepareNextAudio(props, props)
            }
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
