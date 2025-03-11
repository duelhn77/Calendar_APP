export interface EventData {
  id: string;          // DataId (スプレッドシートのA列)
  userId: string;      // ユーザーID (スプレッドシートのC列)
  start: string;       // 開始時刻 (スプレッドシートのD列)
  end: string;         // 終了時刻 (スプレッドシートのE列)
  engagement: string;  // エンゲージメント (F列)
  activity: string;    // アクティビティ (G列)
  location: string;    // ロケーション (H列)
  details: string;     // 詳細 (I列)
}


  