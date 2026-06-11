'use client';

import { useEffect, useRef } from 'react';
import { getFrequencyData } from '@/lib/audio/player';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { cn } from '@/lib/utils';

interface WaveformProps {
  mini?: boolean;
  className?: string;
}

export function Waveform({ mini = false, className }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isStreaming = usePlayerStore((s) => s.isStreaming);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = getFrequencyData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!data || (!isPlaying && !isStreaming)) {
        // Draw idle flat line
        ctx.fillStyle = 'rgb(var(--muted-foreground) / 0.2)';
        const barCount = mini ? 8 : 32;
        const barWidth = (width / barCount) - 1;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 1);
          ctx.fillRect(x, height / 2 - 1, barWidth, 2);
        }
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw frequency bars
      const barCount = mini ? 8 : 32;
      const step = Math.floor(data.length / barCount);
      const barWidth = (width / barCount) - 1;
      const maxValue = 255;

      for (let i = 0; i < barCount; i++) {
        const value = data[i * step] || 0;
        const barHeight = (value / maxValue) * height * 0.8;
        const x = i * (barWidth + 1);
        const y = (height - barHeight) / 2;

        // Gradient color based on frequency
        const intensity = value / maxValue;
        const hue = 220 + intensity * 40; // blue to purple
        ctx.fillStyle = `hsla(${hue}, 80%, ${50 + intensity * 20}%, ${0.3 + intensity * 0.7})`;
        ctx.fillRect(x, y, barWidth, Math.max(barHeight, 1));

        // Mini bars just use simple rounded rects
        if (!mini) {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, Math.max(barHeight, 1), 1);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, isStreaming, mini]);

  return (
    <canvas
      ref={canvasRef}
      width={mini ? 80 : 200}
      height={mini ? 32 : 48}
      className={cn('w-full h-full', className)}
    />
  );
}
