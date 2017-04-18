# 網路、Socket與安全性

Node應用程式核心必然依賴兩個主要基礎物件：網路與安全性。討論網路就離不開socket。

一旦超出單一獨立的機器就得考慮安全性。

## 伺服器、串流與socket

許多Node核心API與建構傾聽特定類型服務有關。

- HTTP模組建構傾聽HTTP請求的網頁伺服器
- Transmission Control Protocol(TCP)伺服器
- Transport Layer Security(TLS)伺服器
- User Datagram Protocol(UDP) socket

### socket與串流

socket是通訊的端點，**網路**socket是網路上兩台電腦上應用程式間通訊的端點。串流資料可作為緩衝區中的二進位資料或Unicode字串傳輸。兩種類型的資料均以**封包**傳輸：部分資料拆開成較小的片段。結束封包(FIN)是特別的封包，由socket發出以表示傳輸完成。

