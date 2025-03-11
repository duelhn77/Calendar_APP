import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// 環境変数のチェック
const SHEET_ID = process.env.SHEET_ID || '';

export const runtime = "nodejs"; // ✅ APIルートのランタイムをNode.jsに設定

export async function GET() {
  try {
    // ✅ 環境変数の確認
    if (!SHEET_ID || !process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.error("❌ 環境変数が不足しています");
      return NextResponse.json({ error: "環境変数が不足しています" }, { status: 500 });
    }

    // ✅ Google Sheets API の認証
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ✅ Google スプレッドシートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Engagements!A2:A', // A列の2行目からデータを取得
    });

    const engagements = (response.data.values || []).map(row => ({ name: row[0] }));

    console.log("✅ 取得したエンゲージメント:", engagements);

    return NextResponse.json(engagements, { status: 200 });
  } catch (error) {
    console.error("❌ fetchEngagements API エラー:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


