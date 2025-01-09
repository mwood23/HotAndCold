import './utils/initListener';
import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IS_DETACHED } from './constants';
import { logger } from './utils/logger';
import { SinglePlayer } from './SinglePlayerApp';
import { RaidApp } from './RaidApp';
import { GAME_TYPE } from './utils/initListener';

if (IS_DETACHED) {
  logger.debug(`Running in detached mode`);
}

const GameSwitch = () => {
  const [game, setGame] = useState<'SINGLE_PLAYER' | 'RAID' | undefined>(undefined);

  useEffect(() => {
    let limit = 0;
    let interval: NodeJS.Timeout | undefined;

    if (limit > 20) {
      logger.error('Could not find game type');

      if (interval) {
        clearInterval(interval);
      }
    }

    interval = setInterval(() => {
      if (GAME_TYPE) {
        setGame(GAME_TYPE);
        clearInterval(interval);
      }

      limit++;
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!game) return null;

  return game === 'SINGLE_PLAYER' ? <SinglePlayer /> : <RaidApp />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameSwitch />
  </StrictMode>
);
