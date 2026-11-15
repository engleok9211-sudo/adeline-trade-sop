# 📝 [PROMPT_004] 본부장님 하명문 보존

- **일시**: 2026-11-15 09:56:18 KST
- **발신**: 본부장님 (Chief Executive Officer)
- **수신**: ADVISOR 총괄팀장 & AX-TWIN 전문 전술부대

---

## 👑 본부장님 하명 원문 (Verbatim)

```
서류화면 조회 아이콘은 있는데 클릭했을때 조회가 안돼고, 외국 바이어와의 서류는 영어버전을 추가해줘
```

---

## 🎯 핵심 조치 과업
1. **서류 조회 클릭 시 미작동 원인 규명 및 즉시 수리**:
   - 자바스크립트 스크립트 분할 삽입 시 발생한 템플릿 리터럴 백틱 미완결 및 스크립트 중복으로 인한 `SyntaxError` 완전 제거
   - 단일 통합 마스터 스크립트로 일원화하여 `Node.js --check` 100% Zero-Error 검증 통과 및 정상 팝업 작동 보증
2. **외국 바이어용 공식 영문 서류 (Full English Version) 전면 구축**:
   - 뷰어 상단 툴바에 **[🌐 서류 언어: 🇰🇷 한국어 / 🇺🇸 English (Global)]** 실시간 전환 스위치 신설
   - 바이어 관련 서류(Buyer Order Sheet, Draft CI, Final CI, Packing List, Combined Package, C/O, SWIFT MT103, 영문 수출면장 등) 및 해외 인증 서류 3종(MSDS, INCI, COA)의 100% Full English 전문 규격 서식 탑재
3. **배포 및 무손실 기록 동기화**:
   - GitHub Pages 클라우드 배포 푸시 및 로컬 웹서버 최신화
   - `conversation/CONVERSATION_TOTAL.md` 100% Verbatim 기록 누적
