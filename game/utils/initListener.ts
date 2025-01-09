import { SingleGameResponse } from '../shared';

export let GAME_TYPE: 'SINGLE_PLAYER' | 'RAID' | undefined = undefined;
export let GAME_INIT_DATA: SingleGameResponse | undefined = undefined;

const initListener = (ev: MessageEvent) => {
  if (ev.data?.data?.message?.type === 'INIT') {
    GAME_INIT_DATA = ev.data.data.message.payload.game;
    GAME_TYPE = ev.data.data.message.payload.type;
    window.removeEventListener('message', initListener);
  }
};

window.addEventListener('message', initListener);
