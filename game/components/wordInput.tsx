import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../utils';

export function WordInput({
  placeholders,
  onChange,
  onSubmit,
  autoFocusOnKeypress = true,
  value: externalValue = '', // New prop for controlled input
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  autoFocusOnKeypress?: boolean;
  value?: string; // Add to props interface
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [internalValue, setInternalValue] = useState(externalValue);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'visible' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === 'visible') {
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [placeholders]);

  useEffect(() => {
    if (!autoFocusOnKeypress) return;

    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (
        e.key === 'Escape' ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.key === 'Shift' ||
        e.key === 'Tab'
      ) {
        return;
      }

      if (document.visibilityState === 'visible' && inputRef.current) {
        e.preventDefault();
        inputRef.current.focus();

        if (e.key.length === 1) {
          const newValue = e.key;
          onChange?.({
            target: { value: newValue },
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    };

    if (document.visibilityState === 'visible') {
      document.addEventListener('keydown', handleGlobalKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [autoFocusOnKeypress, onChange]);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue('font-size'));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = '#FFF';
    ctx.fillText(internalValue, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (pixelData[e] !== 0 && pixelData[e + 1] !== 0 && pixelData[e + 2] !== 0) {
          newData.push({
            x: n,
            y: t,
            color: [pixelData[e], pixelData[e + 1], pixelData[e + 2], pixelData[e + 3]],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [internalValue]);

  useEffect(() => {
    draw();
  }, [internalValue, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          // Don't reset the value anymore, let the parent control it
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const vanishAndSubmit = () => {
    if (!internalValue) return;

    setAnimating(true);
    draw();

    if (inputRef.current) {
      const maxX = newDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
    }
  };

  const handleSubmit = () => {
    if (internalValue) {
      vanishAndSubmit();
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !animating) {
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        'relative mx-auto h-12 w-full max-w-xl overflow-hidden rounded-full bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200 dark:bg-zinc-800',
        internalValue && 'bg-gray-50'
      )}
    >
      <canvas
        className={cn(
          'pointer-events-none absolute left-2 top-[20%] origin-top-left scale-50 transform pr-20 text-base invert filter sm:left-8 dark:invert-0',
          !animating ? 'opacity-0' : 'opacity-100'
        )}
        ref={canvasRef}
      />
      <input
        onChange={(e) => {
          if (!animating) {
            onChange && onChange(e);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={internalValue}
        type="text"
        autoCorrect="off"
        className={cn(
          'relative z-50 h-full w-full rounded-full border-none bg-transparent pl-4 pr-20 text-sm text-black focus:outline-none focus:ring-0 sm:pl-10 sm:text-base dark:text-white',
          animating && 'text-transparent dark:text-transparent'
        )}
      />

      <button
        disabled={!internalValue}
        type="submit"
        className="absolute right-2 top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black transition duration-200 disabled:bg-gray-100 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
        onClick={handleSubmit}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-gray-300"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: '50%',
              strokeDashoffset: '50%',
            }}
            animate={{
              strokeDashoffset: internalValue ? 0 : '50%',
            }}
            transition={{
              duration: 0.3,
              ease: 'linear',
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>

      <div className="pointer-events-none absolute inset-0 flex items-center rounded-full">
        <AnimatePresence mode="wait">
          {!internalValue && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: 'linear',
              }}
              className="w-[calc(100%-2rem)] truncate pl-4 text-left text-sm font-normal text-neutral-500 sm:pl-12 sm:text-base dark:text-zinc-500"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}