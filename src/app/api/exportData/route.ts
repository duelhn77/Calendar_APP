import { google } from "googleapis";
import { NextResponse } from "next/server";
import { parse } from "json2csv";
import ExcelJS from "exceljs";

const SHEET_ID = process.env.SHEET_ID || "";

export async function POST(req: Request) {
  try {
    const { startDate, endDate, format } = await req.json(); // 🔹 `fileType` → `format` に統一

    console.log("📤 API 受信:", { startDate, endDate, format });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // 🔹 改行を厳密に処理
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 🔹 スプレッドシートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "TimeSheet!A:I", // 🔹 取得範囲を明確に指定
    });

    const rows = response.data.values || [];
    console.log("📊 取得データ:", rows.length, "件");

    if (rows.length < 2) throw new Error("データが見つかりません");

    // 🔹 ヘッダーとデータを分ける
    const headers = rows[0];
    
    const data = rows.slice(1).filter(row => {
        const rowStart = new Date(row[3]); // `start` (D列) を `Date` に変換
        const rowEnd = new Date(row[4]);   // `end` (E列) を `Date` に変換
      
        // ✅ `YYYY-MM-DD` の文字列として比較
        const rowStartDate = rowStart.toISOString().split("T")[0]; // `YYYY-MM-DD` 形式に変換
        const rowEndDate = rowEnd.toISOString().split("T")[0];     // `YYYY-MM-DD` 形式に変換
      
        console.log("📝 データ確認:", rowStartDate, rowEndDate);
      
        return rowStartDate >= startDate && rowEndDate <= endDate;
    });
      
      

    console.log("📊 フィルタ後:", data.length, "件");

    if (!data.length) throw new Error("指定期間のデータがありません");

    let fileBuffer;
    let contentType;
    let fileExtension;

    if (format === "csv") {
      // 🔹 CSV 形式でエクスポート
      const csv = parse(data, {
        fields: headers,
        quote: '"', // 🔹 値をエスケープ処理
        delimiter: ",",
      });

      fileBuffer = Buffer.from(csv, "utf-8");
      contentType = "text/csv";
      fileExtension = "csv";
    } else {
      // 🔹 Excel 形式でエクスポート
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Exported Data");

      worksheet.addRow(headers); // 🔹 ヘッダー行を追加
      data.forEach(row => worksheet.addRow(row));

      fileBuffer = await workbook.xlsx.writeBuffer();
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileExtension = "xlsx";
    }

    console.log("📂 ファイル生成完了: export." + fileExtension);

    // 🔹 クライアントにファイルを送信
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="export_${startDate}_${endDate}.${fileExtension}"`,
      },
    });
  } catch (error) {
    console.error("❌ エクスポートエラー:", error);
    return NextResponse.json({ 
      error: (error as Error).message, 
      stack: (error as Error).stack // ✅ 追加: スタックトレースを表示
    }, { status: 500 });
  }
  
}
