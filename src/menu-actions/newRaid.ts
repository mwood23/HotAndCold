import { Devvit } from '@devvit/public-api';
import { RaidChallenge } from '../core/raidChallenge.js';

Devvit.addMenuItem({
  label: 'HotAndCold: New raid',
  forUserType: 'moderator',
  location: 'subreddit',
  onPress: async (_event, context) => {
    try {
      const { postUrl } = await RaidChallenge.makeNewChallenge({ context });

      context.ui.navigateTo(postUrl);
    } catch (error) {
      console.error(`Error making new challenge:`, error);
    }
  },
});
