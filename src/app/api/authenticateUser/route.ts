import { google } from "googleapis";
import { NextResponse } from "next/server"; // ✅ NextResponse をインポート

// ✅ 環境変数を取得
const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"); // 改行コード修正
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;

console.log("✅ SHEET_ID:", SHEET_ID);

export async function POST(req: Request) {
    // ✅ 環境変数がセットされているか確認
    if (!SHEET_ID || !GOOGLE_PROJECT_ID || !GOOGLE_PRIVATE_KEY || !GOOGLE_CLIENT_EMAIL) {
        console.error("❌ 環境変数が不足しています");
        return NextResponse.json({ error: "環境変数が不足しています" }, { status: 500 });
    }

    let requestBody;
    try {
        requestBody = await req.json();
    } catch (error) {
        console.error("APIエラー:", error); // エラーをログ出力
        return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const { email, password } = requestBody;

    try {
        // ✅ Google 認証の設定（`.env.local` から取得）
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: "service_account",
                project_id: GOOGLE_PROJECT_ID,
                private_key: GOOGLE_PRIVATE_KEY,
                client_email: GOOGLE_CLIENT_EMAIL,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
        });

        const sheets = google.sheets({ version: "v4", auth });

        // ✅ Google Sheets からデータ取得
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: "Users!A:C",
        });

        if (!response.data || !response.data.values) {
            console.error("❌ スプレッドシートのデータが取得できません");
            return NextResponse.json({ error: "Spreadsheet data is empty" }, { status: 500 });
        }

        const rows = response.data.values || [];
        const user = rows.find((row) => row[1] === email && row[2] === password);

        if (user) {
            return NextResponse.json({ userId: user[0] });
        } else {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
    } catch (error) {
        console.error("❌ APIエラー:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
