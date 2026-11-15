# 📝 [PROMPT_005] 본부장님 하명문 보존

- **일시**: 2026-11-15 10:20:41 KST
- **발신**: 본부장님 (Chief Executive Officer)
- **수신**: ADVISOR 총괄팀장 & AX-TWIN 전문 전술부대

---

## 👑 본부장님 하명 원문 (Verbatim)

```
MSRP Retail price - 소비자가 
Offer Price= 제안가, 명세가 , 영세율
Rate Supply (%) - 공급률  

공급가
Supply Price/ Offer Price 
공급업체(브랜드사)가 거래처에 공급하는 가격


소비자가
Retail Price
최종 소비자가격(권장소비자가격인 경우는 Suggested Retail Price (SRP) 또는 MSRP)


공급률 
Supply Rate(%) 
소비자가의 제안받은 공급가의 차지하는 퍼센트 비율


inbox 인박스 
outbox 아웃박스 
Carton box 카톤박스 

계산하는 방법
-Supply rate(%) 
아래 수식으로 직접 계산합니다.
Supply Rate (%) = Offer Price ÷ MSRP Retail
-Offer Price(KRW) 계산하는 방법 
제안가, 명세가, 영세율, 또는 supply price로 표시됨.
-Offer Price(USD) 계산하는 방법 
Offer Price (USD)는 아래 수식으로 계산합니다.
Offer Price (USD) = Offer Price (KRW) ÷ 환율
예시)
Offer Price (USD) = Offer Price (KRW) ÷ 1,480


바이어사에게 보낼 필요한 정보는 
-Supply rate(%) - 모두 값으로만 보여야합니다. 
-Offer Price(KRW) 계산하는 방법 
-Offer Price(USD) 계산하는 방법 
-Order Qty / Order Total Amount 



１。 브랜드사별로 양식이 다르므로  윈도우에 엑셀 파일을 다운 받습니다。
```

---

## 🎯 핵심 조치 과업
1. **무역 단가 / 공급률 / 환율 연산 공식 표준화 및 오퍼 시뮬레이터 신설**:
   - `MSRP (소비자가격)`, `Offer Price (공급가/제안가/영세율)`, `Supply Rate (%) = Offer Price / MSRP`, `환율(USD/KRW)`, `Offer Price (USD) = Offer Price (KRW) / 환율`
   - 수량 및 패킹 단위: `inbox (인박스 수량)`, `outbox (아웃박스 수량)`, `Carton box (카톤박스 규격/포장단위)`, `Order Qty`, `Order Total Amount (KRW & USD)`
   - 바이어 제출용 화면에서 Supply Rate(%)가 수식 없이 **계산된 최종 값(예: 42.5%)**으로 명확히 표기
2. **브랜드사별 양식 맞춤 엑셀 다운로더 (Excel Export Engine)**:
   - 브랜드사별(아누아, 조선미녀, 라운드랩, 스킨1004 등) 고유의 서식과 헤더, 박스 규격(Inbox/Outbox/Carton)이 반영된 **전문 엑셀(.xlsx) 파일 생성 및 윈도우 원클릭 다운로드** 지원
   - 웹 애플리케이션 내에 `[📊 5. 바이어 오퍼 & 견적 계산기 (Offer Sheet)]` 신규 메인 탭 신설 및 실시간 계산/엑셀 다운로드 기능 완비
3. **로컬 엑셀 템플릿 산출물 제작**:
   - `result/` 기지에 아누아, 조선미녀 등 주요 브랜드사 공식 오퍼시트 엑셀 샘플 파일 배포
   - GitHub Pages 클라우드 배포 동기화
