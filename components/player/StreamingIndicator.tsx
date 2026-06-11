'use client';

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1 bg-primary-600 rounded-full waveform-bar"
          style={{
            height: '12px',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
