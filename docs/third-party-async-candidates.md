# サードパーティ非同期処理 — 次期リファレンス実装の候補分析

> 作成: 2026-07-08 · 追記: 2026-09-25(#25 TypeSafe AI Jev)、2026-09-26(#26 JMAP)· 対象: `csbc-dev` 配下の8リファレンス実装と [`../README.md`](../README.md)
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

## 2. 候補一覧(26件)

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
| 25 | **型付き判定モデル**(TypeSafe AI Jev) | テキストを生成せず、`state` に対する noul / choice / score の質問へ確率付きの型付き回答を返す。単発POST・非ストリーミング(70〜500ms)。質問文・判定基準・閾値・モデル版固定がそのままポリシーになり、アカウント単位のレート制限(1,200 rpm)もサーバで守る必要があるため、権限の語りは #15 より強い。ただし状態機械は #15 と同程度に薄い。2026-09-15 公開の early access |

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
| 26 | **JMAP メール同期**(RFC 8620 / 8621。Fastmail / Stalwart) | 1アカウントの上流セッション(資格情報・push・型ごとの state 文字列・バッチ要求)を、メールボックス一覧・クエリ窓・送信ジョブという複数リソースが共有する。複数 Core の合成(Observation + Command invocation)がドメインから強制される。タグの形は B1+B2 で、Case C にはならない |

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
8. **JMAP(#26)** — #24 の後に。#24 が示すのは Shell-mediated injection(README の例そのもの)で、残る Observation と Command invocation の2パターンは #24 では埋まらない。JMAP はこの2つを、人工的な組み合わせではなくドメインの必然として示す。実測では8パッケージとも `src/core/` の Core は1つで、複数 Core を合成した実物はまだない。ただしコストは中〜大で、メールクライアント化を避ける線引きが前提になる。
   - **閉じるもの**: リソース Core がセッション Core の型ごとの state 文字列を観測し(Observation)、変化したら差分取得(`Mailbox/changes`・`Email/queryChanges`)をセッション Core のバッチ実行コマンドに依頼する(Command invocation)。状態機械も厚い。セッション発見 → push 接続 → 差分同期 → `cannotCalculateChanges` なら全再取得、`ifInState` の衝突(`stateMismatch`)なら再同期、と分岐が多く、#15・#16・#25 を退けた「状態機械が薄い」は当てはまらない。
   - **閉じないもの**: Case C。JMAP には署名付きアップロード URL がなく、`uploadUrl` は資格情報付きの POST を要求する(RFC 8620 §6.1)。添付を browser → JMAP サーバへ直送するにはトークンをブラウザに渡すしかなく、秘密規律と衝突する。再開可能アップロード(#1)も閉じない。state 文字列による resume / restart は README の回復契約の分類を B のコントロールプレーン側から裏付けるだけで、Case C の空白は埋めない。Fan-out についても、同一ユーザーの複数タブ・複数タグで上流 push を1本にまとめる動機にはなるが、`feature-flags` のプロバイダ層集約(上流1本 → per-identity バケット)と同じ形で解けるので shared Core を強制しない。Fan-out の実証なら #17 の方が安い。
   - **README の未記述点を露出させる**(作らなくても記録する価値がある): (a) 粒度指針「1 Core = 1つのアドレス可能な非同期リソース」は、複数リソースが1つの上流セッション(資格情報・push 接続・バッチ要求)を共有する場合の置き場を語っていない。(b) 「Command invocation は最も稀」は JMAP では逆転し、リソース Core の取得がすべてセッション Core へのコマンド呼出になる。(c) リモート配線は1接続=1プロキシで、複数 Core はファサード `EventTarget` で束ねる必要がある。この制約は `auth0/src/server/createAuthenticatedWSS.ts` のコメントにしか書かれておらず、README の Core Composition 節にはない。
   - **スコープ外にするもの**: 本文・HTML・添付(1 MiB のエンベロープ上限、サニタイズ、上記の Case C 不成立)。Email / Thread のエンティティキャッシュ共有(アプリ全体の状態管理で、README の明示的非目標)。Case A 版も外す。Fastmail の JMAP API は CORS 対応だが、OAuth クライアントの登録は手動で、ブラウザの `EventSource` / `WebSocket` には `Authorization` ヘッダを付けられない。push を受けるには fetch ストリームで SSE を自前パースするしかなく、物語も `auth0` と重なる。
   - **作る場合の形**: サーバ Core。API トークンは全権に近い長寿命の資格情報なのでサーバから出さない。接続ごとにセッション Core とリソース Core 1つをファサードで束ね、上流 push はユーザー単位の共有ハブに集約する。タグは次の3つ。`<jmap-mailboxes>`(B2)は `mailboxes`(name / role / unreadEmails / totalEmails のみ)を持ち、push を受けたら `Mailbox/changes` の `updatedProperties` でカウンタだけの差分に絞る。`<jmap-email-query>`(B1)は inputs が mailbox / sort / position / limit で、filter は Core の許可リスト内だけ。`Email/query` と `Email/get` を後方参照で1往復にまとめ、`items` は要約プロパティのみ返す。`setKeywords` / `move` は `ifInState` 付き。`<jmap-submission>`(B1)は `send` / `cancel` を持ち、`undoStatus` / `deliveryStatus` を push で追う。Identity と envelope は Core が固定し、From をブラウザに選ばせない(authority の語りはここが最も鮮明)。`forbiddenFrom` / `forbiddenToSend` / `tooManyRecipients` はエラーコードへ写像する。ベンダー SDK は使わず fetch と自前の SSE パースで書く(`ai-agent` と同方針)。統合テストは Stalwart(OSS。EventSource / WebSocket / PushSubscription / OAuth に対応)をコンテナで立てれば、読者も手元で動かせる。
   - **#3 との接点**: RFC 8620 §7.2 の PushSubscription と RFC 9749(VAPID)を使うと、JMAP サーバがブラウザの push サービスへ StateChange を直接送れる。Shell が購読(Service Worker・通知許可・鍵)を、Core が登録と `verificationCode` の受け渡しを持つ構図になり、#3 を作るときの第2ドメインとして有力。
   - **再評価トリガ**: #24 の完了後も Observation / Command invocation が未展示のまま残っているとき。または README の Core Composition 節に (a)〜(c) を書き足すことになり、その裏付けが要るとき。

### P3 — 価値はあるが重複・地域制約・ハード依存

- 銀行連携(#5)・eKYC(#6)は `stripe` と説得力の系統が同じ(規制駆動のShell)で限界効用が低い
- WebUSB/BLE(#8, #9)は「読者が手元で動かせない」ためショーケースとして弱い
- 検索・メール送信(#15, #16)は状態機械が薄くCSBCの必然性を示しにくい
- Supabaseセッション(#21)は Case A 補強になるが `auth0` と物語が重複
- 型付き判定モデル Jev(#25)は B1 の3例目になるだけで、未展示の主張を単独では閉じない。質問セットをサーバに固定すると、ブラウザ側に残るのは「state を POST して JSON を受け取る」だけになり、汎用 fetch タグで足りる。ポリシーをサーバで固定する語りも `lambda` の pinPolicy と `ai-agent` の server-side pinning で既出。`ai-agent` のプロバイダとして組み込む案は、`IAiProvider` がテキスト/ストリーム前提のため成立しない。例外として、#24 の Core合成ショーケースを AI ドメインで作る場合は「Jev でルーティング/ガードし、低 confidence のときだけ `ai-agent` へ回す」という2つ目の Core として有力(ただし新サービス不要な #24 本来の構成の方が安い)。再評価トリガは GA による API 安定化、または自アプリでの実需。作る場合の形は B1 の `<jev-eval>`(ブラウザは `state` と許可リスト内の質問セット名のみを送り、bindable は `answers` / `loading` / `error` / `usage` / `model`。質問は動的なので、静的宣言の `wcBindable` では質問ごとのプロパティにできず `answers` 1つに集約する)

---

## 4. 運用上の注意

- 新パッケージを1つ追加するたびに、[`../scripts/check-integrity.mjs`](../scripts/check-integrity.mjs) のパッケージ一覧と README の実装カタログ表(Reference implementations 節)の更新が必要。
- バージョン収束(ROADMAP P0-5 フォローアップ)が未完のまま追加すると世代混在がさらに広がるため、**新規実装は最新の `@wc-bindable/core ^0.8.0` に揃えて開始する**こと。
