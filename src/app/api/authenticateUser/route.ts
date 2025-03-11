import { google } from "googleapis";
import { NextResponse } from "next/server"; // ✅ NextResponse をインポート
import path from "path"

const SHEET_ID = process.env.SHEET_ID; // 環境変数からスプレッドシートIDを取得

export async function POST(req: Request) {
    try {
      const { email, password } = await req.json();
  
      const auth = new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), "credentials.json"), // `credentials.json` を使用
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });
  
      const sheets = google.sheets({ version: "v4", auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Users!A:C",
      });
  
      const rows = response.data.values || [];
      const user = rows.find((row) => row[1] === email && row[2] === password);
  
      if (user) {
        return NextResponse.json({ userId: user[0] });
      } else {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ error: error as Error }, { status: 500 });
    }
  }
  