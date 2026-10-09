# 복돼지 뽀송이

모바일·PC 반응형 제품 랜딩페이지입니다.

- 공개 주소: https://siyoung-lim-B.github.io/BBOSONGI/
- `index.html`: 페이지 구성 및 링크 공유 미리보기 설정
- `styles.css`: 반응형 디자인 및 Pretendard 글꼴 설정
- `app.js`: 사진 자동 전환, YouTube 연결 및 구매 안내창
- `assets/`: 제품 이미지, 공유 썸네일, 글꼴

## 배포

빌드 없이 저장소 루트의 정적 파일을 GitHub Pages에 배포합니다.
저장소 Settings → Pages에서 기존 게시 브랜치와 루트 폴더 설정을 유지합니다.

배포 도메인이 바뀌면 `index.html`의 `canonical`, `og:url`, `og:image`,
`twitter:image`도 새로운 공개 주소로 변경해야 합니다.
공유 썸네일 파일은 `assets/share-thumbnail-v1.png`입니다.

## 동작

사진은 슈트 뽀송이 → 여성과 뽀송이 → 냉장고 제품 순으로 5초마다 전환됩니다.
사진을 누르거나 좌우로 밀어 다음 사진을 볼 수 있습니다. 점은 현재 사진 위치를 표시합니다.
구매 버튼은 현재 온라인 판매 준비 안내창을 엽니다.
YouTube 연결 영상: https://www.youtube.com/shorts/cUWyAyXWnHM

## 확인

Node.js가 설치돼 있다면 `node --test tests/gallery.test.cjs`로 자동 전환 검증을 실행합니다.
Pretendard 폰트 라이선스는 `assets/fonts/LICENSE.txt`에 포함되어 있습니다.

## 카카오톡 공유

Kakao JavaScript SDK 2.8.2의 sendScrap으로 공개 페이지의 공유 미리보기를 전송합니다.
카카오 앱의 JavaScript SDK 도메인 및 제품 링크 웹 도메인은 https://siyoung-lim-b.github.io 로 등록했습니다.
JavaScript 키는 브라우저용 공개 키이며 Admin 키와 REST API 키는 포함하지 않았습니다.

