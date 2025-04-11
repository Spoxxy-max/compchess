
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
    'spin': 'animate-spin',
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
      } else if (timeLeft <= 10) {
        setAnimation('pulse');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isActive, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`font-mono font-bold ${sizeClasses[size]} ${animationClasses[animation]} text-solana transition-all duration-300`}
        style={{ 
          textShadow: timeLeft <= 3 ? '0 0 10px rgba(20, 241, 149, 0.5)' : 'none',
          transform: `scale(${timeLeft <= 3 ? 1.1 : 1})`
        }}
      >
        {timeLeft}
      </div>
      <p className="text-gray-400 mt-2">
        {timeLeft > 0 ? 'Game starting in...' : 'Game starting!'}
      </p>
    </div>
  );
};

export default CountdownTimer;
