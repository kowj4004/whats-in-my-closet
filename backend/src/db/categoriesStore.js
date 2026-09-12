// 카테고리는 이제 사용자마다 자기 것을 커스터마이징하므로(이름 변경/추가/삭제/사진/세부카테고리),
// 정적 파일 하나를 모두가 공유하던 예전 방식은 더 이상 의미가 없다 — 항상 Postgres를 사용한다.
// (clothes/outfits와 달리 DATABASE_URL 없는 JSON 폴백은 지원하지 않는다: 로그인 없이는
// "누구의 카테고리인지"가 정의되지 않기 때문.)

export * from "./pgCategoriesStore.js";
