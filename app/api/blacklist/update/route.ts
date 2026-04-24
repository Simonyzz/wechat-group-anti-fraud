import { NextRequest, NextResponse } from "next/server";
import { getSheetData, sheets, SPREADSHEET_ID } from "@/app/lib/sheets";

export async function POST(request: NextRequest) {
    const { id, status } = await request.json();

    if (!id || !status) {
        return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const rows = await getSheetData("blacklist");
    const headers = rows[0];
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);

    if (rowIndex === -1) {
        return NextResponse.json({ error: "黑名单ID不存在" }, { status: 404 });
    }

    const statusIdx = headers.indexOf("status");
    const statusColumn = String.fromCharCode(65 + statusIdx); // 将列索引转换为字母

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `blacklist!${statusColumn}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[status]],
        },
    });

    return NextResponse.json({ success: true });
}