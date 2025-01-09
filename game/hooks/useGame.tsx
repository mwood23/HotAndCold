import { createContext, useContext, useEffect, useState } from 'react';
import { SingleGame } from '../shared';
import { sendMessageToDevvit } from '../utils';
import { useDevvitListener } from './useDevvitListener';
import { useSetPage } from './usePage';
import { logger } from '../utils/logger';
import { useMocks } from './useMocks';
import { GAME_INIT_DATA } from '../utils/initListener';

const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

const GameContext = createContext<Partial<SingleGame>>({});
const GameUpdaterContext = createContext<React.Dispatch<
  React.SetStateAction<Partial<SingleGame>>
> | null>(null);
// foo to trigger rebuild
export const GameContextProvider = ({ children }: { children: React.ReactNode }) => {
  const setPage = useSetPage();
  const mocks = useMocks();
  const [game, setGame] = useState<Partial<SingleGame>>(
    mocks.getMock('mocks')?.game ?? GAME_INIT_DATA ?? {}
  );
  logger.info(`game state:`, game);
  const initResponse = useDevvitListener('SINGLE_PLAYER_GAME_INIT_RESPONSE');
  const submissionResponse = useDevvitListener('WORD_SUBMITTED_RESPONSE');
  const hintResponse = useDevvitListener('HINT_RESPONSE');
  const giveUpResponse = useDevvitListener('GIVE_UP_RESPONSE');

  // Just in case the game is not initialized
  // This is old code left in for safety
  useEffect(() => {
    sendMessageToDevvit({
      type: 'GAME_INIT',
    });
  }, []);

  useEffect(() => {
    logger.log('Init response: ', initResponse);
    if (initResponse) {
      setGame(initResponse);
    }
  }, [initResponse]);

  useEffect(() => {
    logger.log('Submission response: ', submissionResponse);
    if (submissionResponse) {
      setGame(submissionResponse);
    }
  }, [submissionResponse]);

  useEffect(() => {
    logger.log('Hint response: ', hintResponse);
    if (hintResponse) {
      setGame(hintResponse);
    }
  }, [hintResponse]);

  useEffect(() => {
    logger.log('Give up response: ', giveUpResponse);
    if (giveUpResponse) {
      setGame(giveUpResponse);
    }
  }, [giveUpResponse]);

  useEffect(() => {
    logger.log('New game info: ', game);

    if (isEmpty(game)) return;

    // Keep in sync with usePage's initializer
    if (game.challengeUserInfo?.solvedAtMs || game.challengeUserInfo?.gaveUpAtMs) {
      setPage('win');
    } else {
      setPage('play');
    }
  }, [game, setPage]);

  return (
    <GameUpdaterContext.Provider value={setGame}>
      <GameContext.Provider value={game}>{children}</GameContext.Provider>
    </GameUpdaterContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error('useGame must be used within a GameContextProvider');
  }
  return context;
};

export const useSetGame = () => {
  const setGame = useContext(GameUpdaterContext);
  if (setGame === null) {
    throw new Error('useSetGame must be used within a GameContextProvider');
  }
  return setGame;
};
