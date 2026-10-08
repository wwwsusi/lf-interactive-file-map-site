import {validateProjection} from './dashboard-model.mjs';
// A live read is authoritative as a whole; imported legacy rows cannot overlay it.
export function mergeLiveReport(previous,raw){return validateProjection(raw);}
