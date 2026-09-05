// DATABASE_URL이 설정되어 있으면 Postgres(Supabase)를, 없으면 로컬 JSON 파일을 사용한다.
// 나머지 코드(routes 등)는 항상 이 파일만 import하므로 백엔드가 어떤 저장소를 쓰는지 몰라도 된다.

import { isPostgresEnabled } from "./postgresPool.js";
import * as jsonStore from "./jsonClothesStore.js";
import * as pgStore from "./pgClothesStore.js";

const impl = isPostgresEnabled() ? pgStore : jsonStore;

export const listClothes = impl.listClothes;
export const getCloth = impl.getCloth;
export const createCloth = impl.createCloth;
export const updateCloth = impl.updateCloth;
export const deleteCloth = impl.deleteCloth;
