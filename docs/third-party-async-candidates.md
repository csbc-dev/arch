# サードパーティ非同期処理 — 次期リファレンス実装の候補分析

> 作成: 2026-07-08 · 対象: `csbc-dev` 配下の8リファレンス実装と [`../README.md`](../README.md)
> 選定基準: [`../ROADMAP.md`](../ROADMAP.md) §0 の意図フィルタに従い、「採用獲得」ではなく
> **「文書の主張を反証不能な実証に変えるか」**(completeness × persuasiveness × honesty)で評価する。

---

## 結論

最有力は **①再開可能アップローダ(tus / GCS resumable)、②共有Core型リアルタイムティッカー、③Web Push、④WebRTC** の4つ。
いずれも「人気サービスだから」ではなく、**現在の README が文章でしか主張できていない箇所を、動く実装に変える**ことが選定理由である。

---

## 1. 現状のカバレッジと「未展示の主張」

### Case カバレッジ

| Case | 既存実装 | 空白 |
|---|---|---|
| A(ブラウザCore) | `auth0` のみ | 1例だけで手薄 |
| B1(コマンド仲介) | `ai-agent`(+未分類の `lambda`) | 2例目なし |
| B2(観測専用) | `feature-flags` | 2例目なし |
| C(ブラウザ固定実行) | `s3-uploader` / `stripe` / `webauthn` / `ami-voice` | 充実。ただし偏りあり |

### README に実装ゼロのまま主張されている箇所(5つ)

1. **Resumability**(README「Recovery contract」節)— 「ドメイン依存の設計選択」と分類し直したが、アップロード系での「再開可能な設計」側の実例がない。`s3-uploader` の README 自身が `@csbc-dev/s3-uploader-resumable` を「intended path」と明記済み。
2. **Shared Core / Fan-out Model**(README「Fan-out Model」節)— 「明示的オプトイン」と説明するだけで実例ゼロ。
3. **WebRTC / WebUSB / WebBluetooth / File System Access**(README「Case C」節)— Case C の正典ドメインとして列挙されながら全て未実装。
4. **プラガブルトランスポート**(MessagePort / BroadcastChannel / WebTransport)— 文章のみ。
5. **Core合成の3パターン**(README「Core Composition and Granularity」節)— 規範として書かれているが、複数Coreを合成する実例が薄い。

---

## 2. 候補一覧(24件)

### Case C 候補(ブラウザ固定実行 — 「秘密はサーバ、実行はブラウザ」の緊張が鮮明なもの)

| # | 候補 | Core(権限) | Shell(実行) | 特記 |
|---|---|---|---|---|
| 1 | **再開可能アップロード**(tus.io / GCS resumable / R2) | uploadId+完了パーツの永続化、再開認可 | バイトポンプ、チェックポイント報告 | `s3-uploader` の README が既に予告。回復契約タクソノミの「もう片側」を実証 |
| 2 | **WebRTC 通話**(素のWebRTC+自前シグナリング、またはLiveKit) | ルーム権限、トークン発行、シグナリング | getUserMedia、RTCPeerConnection、ICE | 未展示正典ドメインの筆頭。データプレーンがWebSocketを通れない最極端の例 |
| 3 | **Web Push**(VAPID) | VAPID秘密鍵、送信判断、購読の永続化 | Push購読、Service Worker、通知権限 | 権限分離が教科書的に鮮明で実装が小さい。「ブラウザが閉じていてもCoreが動く」という新しい語りも生む |
| 4 | **TTSストリーミング**(ElevenLabs / OpenAI TTS) | APIキー、合成要求の権限 | AudioContext再生、バッファリング | `ami-voice`(ASR)との対称でC系の物語が完結する |
| 5 | **銀行連携**(Plaid / Stripe Financial Connections) | シークレット、トークン交換 | ベンダーiframe(Link)起動 | `stripe` と同型の「規制がShellを強制する」第2例。地域依存が難点 |
| 6 | **カメラeKYC**(Stripe Identity / TRUSTDOCK) | 検証セッション権限、結果Webhook | getUserMediaキャプチャ、ベンダーフロー | カメラ=ユーザージェスチャ固定。ベンダー審査が重い |
| 7 | **録画→変換→配信**(MediaRecorder + Mux / CF Stream) | アセット権限、変換ジョブ監視 | 録画、WebCodecs、直接アップロード | C+B1複合。豊かな進捗状態機械 |
| 8 | **WebUSB / WebSerial**(サーマルプリンタ、マイコン) | ジョブ内容、ファームウェア権限 | デバイスアクセス | デバイス固定の純粋例だが、読者が動かせない(ハード必須) |
| 9 | **Web Bluetooth**(BLEセンサ) | データ収集ポリシー | GATT接続 | 同上 |
| 10 | **File System Access 同期**(ローカルフォルダ→R2/Drive) | 同期ポリシー、署名 | ディレクトリハンドル、差分検出 | READMEのCase C列挙に記載。permission永続化の癖が多い |
| 11 | **Payment Request API**(Apple Pay / Google Pay) | PSP連携、マーチャント検証 | ブラウザ決済シート | 実機・証明書要件が重い |
| 12 | **Geolocation + 経路API**(Mapbox) | ジオコーディング、APIキー | 位置情報許可、watchPosition | 状態機械がやや薄い |

### Case B1 候補(コマンド仲介リモートCore)

| # | 候補 | 特記 |
|---|---|---|
| 13 | **長時間ジョブ+進捗**(動画変換 / OCR / 画像生成) | Webhook駆動status+進捗ストリームの状態機械。B1の2例目として汎用性最高 |
| 14 | **e署名**(DocuSign / クラウドサイン) | エンベロープライフサイクル。埋め込みiframeでC寄りにもなる |
| 15 | **検索**(Meilisearch / Typesense) | 高頻度入力→デバウンス→状態機械。スコープ付きキーで権限の語りは弱め |
| 16 | **メール/SMS送信+配信追跡**(Resend / Twilio) | 状態機械が薄く展示価値低 |

### Case B2 候補(観測専用 — shared Core実証の場)

| # | 候補 | 特記 |
|---|---|---|
| 17 | **相場ティッカー**(Binance / Coinbase 公開WebSocket) | **1つの上流接続→N購読者**がshared Core fan-outの最小実証。認証不要の公開APIで実装コスト最小 |
| 18 | **IoTテレメトリ**(MQTTブリッジ) | 同型。デモ環境構築がやや重い |
| 19 | **CI/CDステータスウォッチャ**(GitHub Actions API) | ポーリング→ストリーム変換の例。開発者に身近 |
| 20 | **プレゼンス/在席表示** | マルチタブ・複数クライアント間パリティのデモに好適 |

### Case A・構成実証系

| # | 候補 | 特記 |
|---|---|---|
| 21 | **Supabase / Firebase セッション**(Case A) | 手薄なCase Aの2例目。ただし `auth0` と役割重複 |
| 22 | **OPFS/IndexedDBオフラインキュー+同期** | サードパーティ性が弱い(除外寄り) |
| 23 | **SharedWorker/MessagePortホストCore** | 「プラガブルトランスポート」主張の実証。`feature-flags` ドメイン流用で新サービス不要 |
| 24 | **Core合成ショーケース**(`auth0` Core → `s3-uploader` Shellへ注入) | Core Composition の3パターンを動く形に。**新サービス不要で最安** |

---

## 3. 優先順位

### P1 — 未展示主張を直接閉じる(次に着手すべき)

1. **再開可能アップローダ(#1)** — 唯一、既存リポジトリが自ら予告している欠落。`s3-uploader` のコード資産を流用でき、回復契約タクソノミが「両側とも実物で示せる」状態になる。費用対効果最大。
2. **相場ティッカー+shared Core(#17)** — Fan-out Model の実証とB2の2例目を一石二鳥で埋める。公開APIなので認証不要、実装コストが候補中最小クラス。
3. **Web Push(#3)** — 小規模で権限分離が最も教科書的。決済でもアップロードでもない Case C バリエーションを追加できる。

### P2 — 説得力を一段上げる(コストと相談)

4. **WebRTC(#2)** — 正典ドメイン筆頭として明記されながらゼロという最大の空白。ただしシグナリング+SFU/P2Pの実装コストは全候補中最大なので、P1の後に。まず1対1のP2P最小構成に絞るのが現実的。
5. **長時間ジョブ+進捗(#13)** — B1の2例目。`ai-agent`(ストリーミング対話)と異なる「Webhook駆動の非対話ジョブ」の状態機械を示せる。
6. **Core合成ショーケース(#24)+ SharedWorkerトランスポート(#23)** — 新サービス不要で、prose-only の Core Composition とトランスポート差し替え可能性の主張を閉じる。実装というより「構成の実証」。
7. **TTS(#4)** — `ami-voice` との対称性で音声ドメインが完結。

### P3 — 価値はあるが重複・地域制約・ハード依存

- 銀行連携(#5)・eKYC(#6)は `stripe` と説得力の系統が同じ(規制駆動のShell)で限界効用が低い
- WebUSB/BLE(#8, #9)は「読者が手元で動かせない」ためショーケースとして弱い
- 検索・メール送信(#15, #16)は状態機械が薄くCSBCの必然性を示しにくい
- Supabaseセッション(#21)は Case A 補強になるが `auth0` と物語が重複

---

## 4. 運用上の注意

- 新パッケージを1つ追加するたびに、[`../scripts/check-integrity.mjs`](../scripts/check-integrity.mjs) のパッケージ一覧と README の実装カタログ表(Reference implementations 節)の更新が必要。
- バージョン収束(ROADMAP P0-5 フォローアップ)が未完のまま追加すると世代混在がさらに広がるため、**新規実装は最新の `@wc-bindable/core ^0.8.0` に揃えて開始する**こと。
