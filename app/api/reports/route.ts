import { NextRequest, NextResponse } from "next/server";
import { appendRow, getSheetData } from "@/app/lib/sheets";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { target_wxid, target_nickname, target_email, description, reporter_name, reporter_email } = body;

    if (!target_wxid && !target_email) {
        return NextResponse.json({ error: "请提供被举报人的微信名或邮箱" }, { status: 400 });
    }

    const rows = await getSheetData("reports");
    const newID = String(rows.length); // 简单的ID生成方式，实际项目中建议使用UUID等更可靠的方式

    await appendRow("reports", [
        newID,
        target_wxid || "",
        target_nickname || "",
        target_email || "",
        description || "",
        reporter_name || "",
        reporter_email || "",
        new Date().toISOString().split("T")[0], // 仅保留日期部分
        "pending"
    ]);

    return NextResponse.json({ success: true, reportId: newID });
}

export async function GET() {
    const rows = await getSheetData("reports");
    const headers = rows[0];
    const entries = rows.slice(1).map(row => {
        const entry: Record<string, string> = {};
        headers.forEach((header, idx) => {
            entry[header] = row[idx] || "";
        });
        return entry;
    });
    return NextResponse.json({ entries });
}