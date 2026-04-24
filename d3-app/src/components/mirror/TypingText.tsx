import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
}

export const TypingText: React.FC<TypingTextProps> = ({ text, speed = 30, onDone, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    setIsDone(false);

    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(intervalId);
        setIsDone(true);
        if (onDone) {
          onDone();
        }
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onDone]);

  return (
    <span className={className}>
      {displayedText}
      {!isDone && <span className="animate-pulse">▍</span>}
    </span>
  );
};
