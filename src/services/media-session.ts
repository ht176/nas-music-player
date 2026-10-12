import type { Track } from '../api/types'

export class MediaSessionService {
  static updateMetadata(track: Track, coverUrl: string) {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: coverUrl
        ? [
            { src: coverUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: coverUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    })
  }

  static setActionHandlers(handlers: {
    play: () => void
    pause: () => void
    previoustrack: () => void
    nexttrack: () => void
    seekto?: (details: MediaSessionActionDetails) => void
  }) {
    if (!('mediaSession' in navigator)) return

    try {
      navigator.mediaSession.setActionHandler('play', handlers.play)
      navigator.mediaSession.setActionHandler('pause', handlers.pause)
      navigator.mediaSession.setActionHandler('previoustrack', handlers.previoustrack)
      navigator.mediaSession.setActionHandler('nexttrack', handlers.nexttrack)
      if (handlers.seekto) {
        navigator.mediaSession.setActionHandler('seekto', handlers.seekto)
      }
    } catch (e) {
      console.warn('MediaSession action handler error:', e)
    }
  }
}
