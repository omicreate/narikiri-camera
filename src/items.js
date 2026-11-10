// なりきりの一覧。1つ増やすときは items_*.js に定義を1つ足すだけでよい
import dino from './items_dino.js';
import animal from './items_animal.js';
import vehicle from './items_vehicle.js';
import job from './items_job.js';

export const CATS = [
  { id: 'dino', name: 'きょうりゅう' },
  { id: 'animal', name: 'どうぶつ' },
  { id: 'vehicle', name: 'のりもの' },
  { id: 'job', name: 'おしごと' },
];

export const ITEMS = [...dino, ...animal, ...vehicle, ...job];
export const itemById = (id) => ITEMS.find((it) => it.id === id) || ITEMS[0];
