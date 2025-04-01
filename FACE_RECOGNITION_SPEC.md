# 顔認識機能の仕様書

## 概要

QRコードチェックインシステムに顔認識機能を追加することで、会員証を持っていない場合でも、登録済みの顔情報を使って自動的に会員を識別し、チェックインプロセスを効率化します。

## 実装の変更箇所

### 1. ファイル構成

- **新規ファイル**: `public/js/face-recognition.js` - 顔認識機能のコア実装
- **変更ファイル**:
  - `public/js/app.js` - 顔認識機能の統合
  - `public/index.html` - 顔認識用のUIと依存関係の追加
  - `public/js/member-register.js` - 顔情報取得機能の追加

### 2. 外部依存関係

- **face-api.js**: 顔検出と認識のためのJavaScriptライブラリ
  ```html
  <script defer src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js"></script>
  ```

### 3. バックエンド連携

- Google Apps Scriptに顔情報を保存・取得するためのエンドポイントを追加
- `MemberRegister.getFaces()` メソッドを追加して顔情報を取得

## 機能詳細

### 1. 顔認識クラス (FaceRecognition)

```javascript
class FaceRecognition {
    constructor() {
        // 初期化処理
    }
    
    // 顔認識モデルの初期化
    async initModels() { ... }
    
    // 顔情報の読み込み
    async loadFaceData() { ... }
    
    // 認識されたIDのクリア
    clearRecognizedId() { ... }
    
    // 顔認識の実行
    async recognizeFace() { ... }
    
    // メッセージコンテナの初期化
    initMessageContainer() { ... }
    
    // 顔登録メッセージの表示
    showFaceRegistrationMessage(confidence) { ... }
    
    // 認識信頼度の表示
    showConfidenceLevel(confidence, memberId) { ... }
    
    // 顔登録メッセージの削除
    removeFaceRegistrationMessage() { ... }
}
```

### 2. 顔認識の処理フロー

1. **初期化**:
   - 顔認識モデルのロード (`faceapi.nets.*`)
   - Google Spreadsheetから顔情報の取得

2. **定期的な顔検出**:
   - `checkFaceRecognition()` 関数が500msごとに実行
   - カメラ映像から顔を検出し、登録済みの顔と比較

3. **顔認識結果の処理**:
   - 顔が認識された場合:
     - 緑色の枠で顔を囲む
     - 会員IDを自動入力
     - 会員情報を表示
   - 顔が認識されない場合:
     - 赤色の枠で顔を囲む
     - 顔登録メッセージを表示
   - 顔が検出されない場合:
     - 枠を非表示
     - 5秒後に入力フィールドをクリア

### 3. 顔認識の精度と信頼度

- **閾値**: 0.6 (ユークリッド距離)
- **最小信頼度**: 50%
- **信頼度の計算**: `Math.round((1 - distance / 0.6) * 100)`
- 信頼度が50%未満の場合は認識失敗とみなす

### 4. UI要素

- **顔認識フレーム**: 検出された顔を囲む矩形
  - 認識成功時: 緑色
  - 認識失敗時: 赤色
  
- **メッセージ表示**:
  - 認識失敗時: 「認識できない顔を検出しました。顔情報を登録できます。(確からしさ: XX%)」
  - 認識成功時: 「顔を認識しました: ID XXXX (確からしさ: XX%)」

### 5. 顔登録機能

- 顔登録リンクを提供
- 会員IDが入力されると、顔登録リンクに自動的にIDパラメータを追加
- QRコード読み取り時にも顔登録リンクを更新

## 技術的な実装詳細

### 1. 顔検出と認識

- **TinyFaceDetector**: 軽量な顔検出モデル
- **FaceLandmark68Net**: 顔のランドマーク検出
- **FaceRecognitionNet**: 顔特徴量の抽出

### 2. 顔特徴量の比較

- 128次元の顔特徴ベクトル（ディスクリプタ）を使用
- ユークリッド距離で類似度を計算
- 距離が小さいほど類似度が高い

### 3. 顔情報の保存形式

- 会員IDをキー、顔特徴量（JSON文字列）を値とするオブジェクト
- Google Spreadsheetに保存

### 4. エラー処理

- モデル読み込みエラーのハンドリング
- 顔検出・認識処理中のエラーハンドリング
- 顔情報取得失敗時のフォールバック

## 統合ポイント

### 1. アプリケーションとの統合

- `app.js`内で`FaceRecognition`インスタンスを作成
- 定期的に`checkFaceRecognition()`を呼び出し
- 認識された会員IDを使って会員情報を更新

### 2. QRコード読み取りとの連携

- QRコード読み取りと顔認識は並行して動作
- どちらかで会員が識別されると情報が表示される

### 3. チェックインフローとの統合

- 顔認識で会員が識別されても自動チェックインはしない
- ユーザーは「チェックイン」ボタンを押す必要がある

## パフォーマンスと最適化

- 顔検出は500msごとに実行（適度な頻度）
- 軽量なTinyFaceDetectorモデルを使用
- CDNからモデルを読み込み、キャッシュを活用

