// DATABASE_URL이 설정되어 있으면 Postgres(Supabase)를, 없으면 로컬 JSON 파일을 사용한다.
// 나머지 코드(routes 등)는 항상 이 파일만 import하므로 백엔드가 어떤 저장소를 쓰는지 몰라도 된다.

import { isPostgresEnabled } from "./postgresPool.js";
import * as jsonStore from "./jsonOutfitsStore.js";
import * as pgStore from "./pgOutfitsStore.js";

const impl = isPostgresEnabled() ? pgStore : jsonStore;

export const listOutfits = impl.listOutfits;
export const getOutfit = impl.getOutfit;
export const createOutfit = impl.createOutfit;
export const updateOutfit = impl.updateOutfit;
export const deleteOutfit = impl.deleteOutfit;
