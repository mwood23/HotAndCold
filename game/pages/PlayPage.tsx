import { useState } from 'react';
import { sendMessageToDevvit } from '../utils';
import { WordInput } from '../components/wordInput';
import { Guesses } from '../components/guesses';
import { useGame } from '../hooks/useGame';

export const PlayPage = () => {
  const [word, setWord] = useState('');
  const { challengeUserInfo } = useGame();

  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <div className="flex flex-col items-center justify-center gap-6">
        <p className="mt-4 text-center text-xl text-white">Can you guess the secret word?</p>
        <WordInput
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onSubmit={(animationDuration) => {
            if (word.trim().split(' ').length > 1) {
              sendMessageToDevvit({
                type: 'SHOW_TOAST',
                string: 'I only understand one word at a time.',
              });
              return;
            }

            sendMessageToDevvit({
              type: 'WORD_SUBMITTED',
              value: word.trim().toLowerCase(),
            });
            // TODO Store previous in case we need to replenish due to errors

            setTimeout(() => {
              setWord('');
            }, animationDuration);
          }}
          placeholders={[
            'Can you guess the word?',
            'Any word will do to get started',
            'Try banana',
            'Or cat',
          ]}
        />
      </div>
      <Guesses items={challengeUserInfo?.guesses ?? []} />
    </div>
  );
};
