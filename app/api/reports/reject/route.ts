import { NextRequest, NextResponse } from "next/server";
import { getSheetData, sheets, SPREADSHEET_ID} from "@/app/lib/sheets";

export async function POST(request: NextRequest) {
    const { report_id } = await request.json();

    if (!report_id) {
        return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const rows = await getSheetData("reports");
    const headers = rows[0];
    const rowIndex = rows.findIndex((r, i) => i > 0 && String(r[0]) === String(report_id));

    if (rowIndex === -1) {
        return NextResponse.json({ error: "未找到对应的报告" }, { status: 404 });
    }

    const statusIdx = headers.indexOf("status");
    const statusColumn = String.fromCharCode(65 + statusIdx); // 将列索引转换为字母

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `reports!${statusColumn}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["rejected"]],
        },
    });
    return NextResponse.json({ success: true });
}