import React, { useRef, useEffect } from 'react';
import * as dashjs from 'dashjs';
import { cn } from '@bunpeg/ui';

type Props = Omit<React.ComponentProps<'video'>, 'src' | 'ref'> & { src: string; ref: React.RefObject<dashjs.MediaPlayerClass | null> };

const DashVideoPlayer = ({ src, ref: externalRef, className, ...rest }: Props) => {
  const playerRef = useRef<dashjs.MediaPlayerClass | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      console.log('Initializing dash.js player...');
      playerRef.current = dashjs.MediaPlayer().create();
      externalRef.current = playerRef.current;

      playerRef.current.initialize(videoRef.current, src, false);

      playerRef.current.on(dashjs.MediaPlayer.events.ERROR, (event) => {
        console.error('Dash.js error:', event);
      });

      playerRef.current.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, () => {
        console.log('Playback started');
      });

      playerRef.current.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, () => {
        console.log('Playback paused');
      });
    }

    return () => {
      if (playerRef.current) {
        console.log('Resetting dash.js player...');
        playerRef.current.reset();
        playerRef.current = null;
      }
    };
  }, [src, videoRef, externalRef]);

  return (
    <video ref={videoRef} className={cn('aspect-video w-full', className)} {...rest} />
  );
};

export default DashVideoPlayer;
