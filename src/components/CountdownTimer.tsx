
import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  size?: 'small' | 'medium' | 'large';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  seconds, 
  onComplete, 
  size = 'medium' 
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isActive, setIsActive] = useState(true);
  const [animation, setAnimation] = useState('pulse');

  // Size classes
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl',
  };
  
  // Animation classes
  const animationClasses = {
    'pulse': 'animate-pulse',
    'bounce': 'animate-bounce',
    'none': ''
  };

  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      setIsActive(false);
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prevTime => prevTime - 1);
      
      // Change animation based on time left
      if (timeLeft <= 3) {
        setAnimation('bounce');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isActive, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`font-mono font-bold ${sizeClasses[size]} ${animationClasses[animation]} text-solana`}>
        {timeLeft}
      </div>
      <p className="text-gray-400 mt-2">
        {timeLeft > 0 ? 'Game starting in...' : 'Game starting!'}
      </p>
    </div>
  );
};

export default CountdownTimer;
