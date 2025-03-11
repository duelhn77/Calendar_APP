import { google } from "googleapis";
import { NextResponse } from "next/server";

const SHEET_ID = process.env.SHEET_ID || "";

export async function POST(req: Request) {
  try {
    const { userId, start, end, engagement, activity, location, details } = await req.json();
    const now = new Date().toISOString();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ `DataID` を取得し、現在の行数 +1 で設定
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "TimeSheet!A:A", // A列（DataID）を取得
    });

    const newId = (sheetData.data.values?.length || 1).toString(); // IDを計算

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "TimeSheet!A:I", // A列（DataID）を追加
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newId, now, userId, start, end, engagement, activity, location, details]],
      },
    });

    return NextResponse.json({ message: "Event saved successfully", id: newId });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

