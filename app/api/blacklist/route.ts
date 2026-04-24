import { NextRequest, NextResponse } from "next/server";
import { getSheetData, appendRow } from "@/app/lib/sheets";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { wxid, nickname, email, reason } = body;

    if (!wxid && !email) {
        return NextResponse.json({ error: "请提供微信号或邮箱" }, { status: 400 });
    }

    const rows = await getSheetData("blacklist");
    const newID = String(rows.length);

    await appendRow("blacklist", [
        newID,
        wxid || "",
        nickname || "",
        email || "",
        reason || "",
        "管理员",
        new Date().toISOString().split("T")[0], // 仅保留日期部分
        "active",
    ]);

    return NextResponse.json({ success: true, id: newID });
}

export async function GET() {
    const rows = await getSheetData("blacklist");
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