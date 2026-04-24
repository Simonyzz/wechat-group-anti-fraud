import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/app/lib/sheets";

export async function POST(request: NextRequest) {
    const { text } = await request.json();

    if (!text) {
        return NextResponse.json({ error: "请提供要检查的文本" }, { status: 400 });
    }

    const keywords = await getSheetData("keywords");
    const data = keywords.slice(1); // 去掉表头
    const keywordIndex = 1; // 假设关键词在第二列
    const categoryIndex = 2; // 假设分类在第三列

    const matches = data.filter((row) => text.includes(row[keywordIndex]));

    return NextResponse.json({ 
        flagged: matches.length > 0,
        matches: matches.map(row => ({
            keyword: row[keywordIndex],
            category: row[categoryIndex],
        }))
    });
}