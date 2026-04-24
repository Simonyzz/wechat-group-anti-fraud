import { NextRequest, NextResponse } from "next/server";
import { getSheetData, appendRow, sheets, SPREADSHEET_ID } from "@/app/lib/sheets";

export async function POST(request: NextRequest) {
    const { report_id } = await request.json();

    if (!report_id) {
        return NextResponse.json({ error: "请提供举报ID" }, { status: 400 });
    }

    //1. 获取举报详情
    const reports = await getSheetData("reports");
    const headers = reports[0];
    const rowIndex = reports.findIndex((r, i) => i > 0 && String(r[0]) === String(report_id));

    if (rowIndex === -1) {
        return NextResponse.json({ error: "举报ID不存在" }, { status: 404 });
    }

    const report = reports[rowIndex];
    const targetWxidIdx = headers.indexOf("target_wxid");
    const targetEmailIdx = headers.indexOf("target_email");
    const descriptionIdx = headers.indexOf("description");
    const reporterNameIdx = headers.indexOf("reporter_name");

    //2. 更新举报状态为approved
    const statusIdx = headers.indexOf("status");
    const statusColumn = String.fromCharCode(65 + statusIdx); // 将列索引转换为字母
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `reports!${statusColumn}${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [["approved"]],
        },
    });

    //3. 检查是否在黑名单中，如果不在则加入黑名单
    const blacklist = await getSheetData("blacklist");
    const blHeaders = blacklist[0];
    const blWxidIdx = blHeaders.indexOf("wxid");
    const blEmailIdx = blHeaders.indexOf("email");
    const blStatusIdx = blHeaders.indexOf("status");

    const targetWxid = report[targetWxidIdx] || "";
    const targetEmail = report[targetEmailIdx] || "";

    const existingIndex = blacklist.findIndex((row, i) =>
        i > 0 &&
        ((targetWxid && row[blWxidIdx] === targetWxid) || (targetEmail && row[blEmailIdx] === targetEmail))
    );

    if (existingIndex !== -1) {
        // 已存在，更新状态为active
        const existingStatus = blacklist[existingIndex][blStatusIdx];
        if (existingStatus === "removed") {
            const statusColumn = String.fromCharCode(65 + blStatusIdx);
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `blacklist!${statusColumn}${existingIndex + 1}`,
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: [["active"]],
                },
            });
            return NextResponse.json({ success: true, message: "举报已批准，用户重新加入黑名单" });
        }
        // 已经是active状态，无需更新
        return NextResponse.json({ success: true, message: "举报已批准，用户已在黑名单中" });
    }

    //4. 不存在，添加到黑名单
    const newId = String(blacklist.length);
    let reason = "其他";
    const desc = report[descriptionIdx] || "";
    if (desc.includes("代写")) reason = "代写";
    else if (desc.includes("广告")) reason = "广告";
    else if (desc.includes("诈骗")) reason = "诈骗";

    await appendRow("blacklist", [
        newId,
        targetWxid,
        "",
        targetEmail,
        reason,
        report[reporterNameIdx] || "未知",
        new Date().toISOString().split("T")[0],
        "active",
    ]);

    return NextResponse.json({ success: true, message: "举报已批准，用户已加入黑名单" });
}