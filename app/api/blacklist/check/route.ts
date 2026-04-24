import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/app/lib/sheets";

export async function GET(request: NextRequest) {
    const wxid = request.nextUrl.searchParams.get("wxid") || "";
    const email = request.nextUrl.searchParams.get("email") || "";

    if (!wxid && !email) {
        return NextResponse.json({ error: "请提供微信名或邮箱" }, { status: 400 });
    }

    const rows = await getSheetData("blacklist");
    const headers = rows[0];
    const data = rows.slice(1)

    const wxidIndex = headers.indexOf("wxid");
    const emailIndex = headers.indexOf("email");
    const statusIndex = headers.indexOf("status");

    const match = data.find(row => 
        row[statusIndex] === "active" &&
        ((wxid && row[wxidIndex] === wxid) || (email && row[emailIndex] === email))
    );

    return NextResponse.json({ 
        blocked: !!match,
        reason: match ? match[headers.indexOf("reason")] : null,
    });
}
