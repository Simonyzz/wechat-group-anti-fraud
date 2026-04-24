"use client";

import { useState, useEffect, useCallback } from 'react';

const API_BASE = "";

//Tab data
const TABS = [
    { id: 'blacklist', label: '黑名单管理' },
    { id: 'reports', label: '举报审核' },
    { id: 'keywords', label: '关键词检测' },
];

const STATUS_COLORS = {
    active: { bg: "#fee2e2", text: "#991b1b", label: "生效中" },
    removed: { bg: "#e0e7ff", text: "#3730a3", label: "已移除" },
    pending: { bg: "#fef3c7", text: "#92400e", label: "待审核" },
    approved: { bg: "#d1fae5", text: "#065f46", label: "已审核" },
    rejected: { bg: "#fee2e2", text: "#991b1b", label: "已驳回" },
};

type StatusBadgeProps = {
    status: string;
};

function StatusBadge({ status }: StatusBadgeProps) {
    const s = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || { bg: "#f3f4f6", text: "#374151", label: status };
    return (
        <span style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: "12px",
            backgroundColor: s.bg,
            color: s.text,
            fontSize: "12px",
            fontWeight: 600,
        }}>
            {s.label}
        </span>
    ); 
}

type ToastProps = {
    message: string;
    type: string;
    onClose: () => void;
};

function Toast({ message, type, onClose }: ToastProps) {
    if (!message) return null;
    const bgColor = type === "success" ? "#d1fae5" : "#fee2e2";
    const textColor = type === "success" ? "#065f46" : "#991b1b";
    return (
        <div style={{
            position: "fixed", top: 20, right: 20, background: bgColor, color: textColor,
            padding: "12px 20px", borderRadius: "8px", fontSize: "14px", zIndex: 999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "fadeIn 0.3s ease",
        }}>
            {message}
            <span onClick={onClose} style={{ marginLeft: 12, cursor: "pointer", opacity: 0.7 }}>X</span>
        </div>
    ); 
}

type BlacklistEntry = {
    id: string;
    wxid: string;
    nickname: string;
    email: string;
    reason: string;
    reported_by: string;
    created_at: string;
    status: string;
};

// Blacklist tab
function BlacklistTab() {
    const [entries, setEntries] = useState<BlacklistEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ wxid: "", nickname: "", email: "", reason: "代写" });
    const [searchQuery, setSearchQuery] = useState("");
    const [toast, setToast] = useState({ message: "", type: "" });

    const showToast = (message: string, type: string = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: "", type: "" }), 3000);
    };

    const fetchBlacklist = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/blacklist`);
            const data = await res.json();
            setEntries(data.entries || []);
        } catch (err) {
            setEntries([
                { id: "1", wxid: "wxid_abc123", nickname: "代写小王", email: "spam@qq.com", reason: "代写", reported_by: "管理员", created_at: "2025-04-14", status: "active" },
                { id: "2", wxid: "wxid_def456", nickname: "广告哥", email: "ad@163.com", reason: "广告", reported_by: "张三", created_at: "2025-04-14", status: "active" },
                { id: "3", wxid: "wxid_ghi789", nickname: "骗子小李", email: "scam@gmail.com", reason: "诈骗", reported_by: "李四", created_at: "2025-04-13", status: "removed" },
            ]);
        }
        setLoading(false); 
    }, []);

    useEffect(() => { fetchBlacklist(); }, [fetchBlacklist]);

    const handleAdd = async () => {
        if (!form.wxid && !form.email) {
            showToast("请至少提供微信ID或邮箱", "error");
            return;
        }
        try {
            await fetch(`${API_BASE}/api/blacklist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            showToast("添加成功");
        } catch {
            setEntries(prev => [...prev, {
                id: String(prev.length + 1), ...form,
                reported_by: "管理员",
                created_at: new Date().toISOString().split("T")[0],
                status: "active"
            }]);
            showToast("添加成功（本地模拟）");
        }
        setForm({ wxid: "", nickname: "", email: "", reason: "代写" });
        setShowForm(false);
    };

    const handleRemove = async (id: string) => {
        const entry = entries.find(e => e.id === id);
        if (!entry) return;

        const newStatus = entry.status === "active" ? "removed" : "active";

        try {
            await fetch("/api/blacklist/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus })
            });
            setEntries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
            showToast("状态更新成功");
        } catch {
            showToast("状态更新失败", "error");
        }
    };

    const filtered = entries.filter(e =>        
        !searchQuery ||
        e.wxid?.includes(searchQuery) ||
        e.nickname?.includes(searchQuery) ||
        e.email?.includes(searchQuery)
    );
    
    const activeCount = entries.filter(e => e.status === "active").length;

    return (
        <div>
        <Toast {...toast} onClose={() => setToast({ message: "", type: "" })} />
        
        {/* Stats bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
            { label: "黑名单总数", value: entries.length, color: "#3b82f6" },
            { label: "生效中", value: activeCount, color: "#10b981" },
            { label: "已移除数量", value: entries.length - activeCount, color: "#ef4444" },
        ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: "16px 20px", borderRadius: 10, border: "1px solid #d1d5db", }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
        ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
            placeholder="搜索 wxid /昵称/邮箱..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #d1d5db", flex: 1, fontSize: 14, outline: "none", color: "#374151",
            }}
        />
        <button
            onClick={() => setShowForm(!showForm)}
            style={{
                padding: "10px 20px", borderRadius: 8, border: "1px solid #d1d5db", backgroundColor: "#3b82f6", color: "#fff", fontSize: 14, cursor: "pointer",
            }}
        >
            {showForm ? "取消" : "添加黑名单"}
        </button>
        </div>

        {/* Add form */}
        {showForm && (
            <div style={{ padding: 20, border: "1px solid #d1d5db", borderRadius: 10, marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {[
                    { key: "wxid" as const, label: "微信ID（wxid）", placeholder: "如 wxid_abc123" },
                    { key: "nickname" as const, label: "昵称", placeholder: "请输入昵称" },
                    { key: "email" as const, label: "邮箱", placeholder: "请输入邮箱" },
                ].map((field) => (
                    <div key={field.key}>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#374151" }}>
                            {field.label}
                        </label>
                        <input
                            placeholder={field.placeholder}
                            value={form[field.key]}
                            onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                            style={{
                                padding: "10px 20px", borderRadius: 8, border: "1px solid #d1d5db", flex: 1, fontSize: 14, outline: "none", color: "#374151",
                            }}
                        />
                    </div>
                ))}
            </div>
            <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#374151" }}>原因</label>
            <select
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                style={{
                    width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#374151",
                }}
            >
                <option value="代写">代写</option>
                <option value="广告">广告</option>
                <option value="诈骗">诈骗</option>
            </select>
            <button
                onClick={handleAdd}
                style={{
                    marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "none", 
                    backgroundColor: "#10b981", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
            >确认添加</button>
            </div>
        )}

        {/* Table */}
        <div style={{ background: "#f9fafb", borderRadius: 10, border: "1px solid #d1d5db", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#374151" }}>
        <thead>
            <tr style={{ background: "#f3f4f6" }}>
                {["微信ID", "昵称", "邮箱", "原因", "举报人", "创建时间", "状态", "操作"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {filtered.map(entry => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>{entry.wxid}</td>
                    <td style={{ padding: "10px 14px" }}>{entry.nickname}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12 }}>{entry.email}</td>
                    <td style={{ padding: "10px 14px" }}>{entry.reason}</td>
                    <td style={{ padding: "10px 14px" }}>{entry.reported_by}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>{entry.created_at}</td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={entry.status}></StatusBadge></td>
                    <td style={{ padding: "10px 14px" }}>
                        <button
                            onClick={() => handleRemove(entry.id)}
                            style={{
                                padding: "4px 12px", borderRadius: 6, border: "1px solid #d1d5db", backgroundColor: "#f3f4f6", color: "#374151", fontSize: 12, cursor: "pointer",
                            }}
                        >
                            {entry.status === "active" ? "移除" : "恢复"}
                        </button>
                    </td>
                </tr>
            ))}
            {filtered.length === 0 && (
                <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                        暂无数据
                    </td>
                </tr>
            )}
        </tbody>
        </table>
        </div>
        </div>
    );
}

// Reports tab
function ReportsTab() {
    const [reports, setReports] = useState<Array<{ id: string; target_wxid: string; target_email: string; description: string; reporter_name: string; reporter_email: string; created_at: string; status: string }>>([]);
    const [toast, setToast] = useState({ message: "", type: "" });
    const showToast = (message: string, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: "", type: "" }), 3000);
    };

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(data => setReports(data.entries || []));
    }, []);

    const handleAction = async (id: string, action: string) => {
        try {
            const url = action === 'approved' ? '/api/reports/approve' : '/api/reports/reject';
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ report_id: id })
            });
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
            showToast(action === 'approved' ? '审核通过并加入黑名单' : '驳回');
        } catch {
            showToast("操作过程中发生错误", "error");
        }
    };

    const pendingCount = reports.filter(r => r.status === "pending").length;

    return (
        <div>
        <Toast {...toast} onClose={() => setToast({ message: "", type: "" })} />

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
            { label: "举报总数", value: reports.length, color: "#3b82f6" },
            { label: "待处理", value: pendingCount, color: "#f59e0b" }, 
            { label: "已通过", value: reports.filter(r => r.status === "approved").length, color: "#10b981" }, 
            { label: "已驳回", value: reports.filter(r => r.status === "rejected").length, color: "#ef4444" },
        ].map((stat, index) => (
            <div key={index} style={{ flex: 1, background: "#f9fafb", padding: "16px 20px", borderRadius: 10, border: "1px solid #d1d5db", }}>
                <div style={{ fontSize: 12, marginBottom: 4, color: "#374151" }}>{stat.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
        ))}
        </div>

        {/* Report cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map(report => (
                <div key={report.id} style={{ background: "#f9fafb", borderRadius: 10, padding: 20, border: report.status === "pending" ? "2px solid #f59e0b" : "1px solid #d1d5db", }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>举报对象</span>
                                <StatusBadge status={report.status} />
                            </div>
                            <div style={{ fontSize: 13, color: "#374151" }}>
                            <span style={{ fontFamily: "monospace" }}>{report.target_wxid}</span>
                            {report.target_email && <span> * {report.target_email}</span>}
                        </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>{report.created_at}</div>
                </div>

                <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                    {report.description}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                        举报人: {report.reporter_name} ({report.reporter_email})
                    </div>
                    {report.status === "pending" && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                onClick={() => handleAction(report.id, "approved")}
                            >
                                审核通过并加入黑名单
                            </button>
                            <button
                                style={{ background: "#ef4444", border: "1px solid #dc2626", padding: "6px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#fff" }}
                                onClick={() => handleAction(report.id, "rejected")}
                            >
                                驳回
                            </button>
                        </div>
                    )}
                </div>
                </div>
            ))}
        </div>
    </div>
    );
}

// Keywords tab
function KeywordsTab() {
    const [text, setText] = useState("");
    const [result, setResult] = useState<{ flagged: boolean; matches: Array<{ keyword: string; category: string }> } | null>(null);
    const [checking, setChecking] = useState(false);
    const [keywords, setKeywords] = useState([
        { id: "1", keyword: "代写", category: "代写" },
        { id: "2", keyword: "essay代做", category: "代写" },
        { id: "3", keyword: "加V", category: "广告" },
        { id: "4", keyword: "低价转租", category: "广告" },
    ]);
    const [newKw, setNewKw] = useState({ keyword: "", category: "代写" });
    const [toast, setToast] = useState({ message: "", type: "" });

    const showToast = (message: string, type: string = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: "", type: "" }), 3000);
    };

    const handleCheck = async () => {
        if (!text.trim()) return;
        setChecking(true);
        try {
            const res = await fetch(`${API_BASE}/api/keywords/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            setResult(data);
        } catch {
            const matches = keywords.filter(k => text.includes(k.keyword));
            setResult({
                flagged: matches.length > 0,
                matches: matches.map(k => ({ keyword: k.keyword, category: k.category }))
            });
        }
        setChecking(false);
    };

    const handleAddKeyword = () => {
        if (!newKw.keyword.trim()) {
            showToast("关键词不能为空", "error");
            return;
        }
        setKeywords(prev => [...prev, { id: String(prev.length + 1), ...newKw }]);
        setNewKw({ keyword: "", category: "代写" });
        showToast("关键词添加成功");
    };

    const handleRemoveKeyword = (id: string) => {
        setKeywords(prev => prev.filter(k => k.id !== id));
        showToast("关键词移除成功");
    };

    const categoryColors: { [key: string]: { bg: string; text: string } } = {
        "代写": { bg: "#3b82f6", text: "#1e40af" },
        "广告": { bg: "#f59e0b", text: "#92400e" },
        "诈骗": { bg: "#ef4444", text: "#7f1d1d" },
    };

    return (
        <div>
        <Toast {...toast} onClose={() => setToast({ message: "", type: "" })} />

        {/* Detection area */}
        <div style={{ marginBottom: 24, background: "#f9fafb", padding: 24, borderRadius: 10, border: "1px solid #d1d5db" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px 0", color: "#374151" }}>文本检测</h3>
            <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px 0" }}>输入群聊信息，检测是否包含敏感词</p>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="请输入要检测的消息内容..."
                style={{ width: "100%", minHeight: 100, padding: 14, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit",
                    lineHeight: 1.6, boxSizing: "border-box", color: "#374151",
                 }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                <button
                    onClick={() => { setText(""); setResult(null); }}
                    style={{ background: "#3b82f6", color: "#fff", border: "1px solid #3b82f6", padding: "10px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                >清除</button>
                </div>

                {/* Result */}
                {result && (
                    <div style={{ marginTop: 16, padding: 16, background: result.flagged ? "#fee2e2" : "#d1fae5", 
                                border: `1px solid ${result.flagged ? '#ef4444' : '#10b981'}`, borderRadius: 8 
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: result.flagged ? "#991b1b" : "#065f46", marginBottom: 8 }}>
                            {result.flagged ? "检测到敏感词" : "未检测到敏感词"}
                        </div>
                        {result.flagged && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {result.matches.map((m, i) => (
                                    <span key={i} style={{
                                        padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                                        backgroundColor: categoryColors[m.category as keyof typeof categoryColors]?.bg || "#f3f4f6",
                                        color: categoryColors[m.category as keyof typeof categoryColors]?.text || "#374151",
                                    }}>
                                        {m.keyword} ({m.category})
                                    </span>
                                    ))}
                            </div>
                        )}
                    </div>
                )}
        </div>

        {/* Keywords management */}
        <div style={{ background: "#f9fafb", padding: 24, borderRadius: 10, border: "1px solid #d1d5db" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px 0", color: "#374151" }}>敏感词管理</h3>
            
            {/* Add keyword form */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <input
                    placeholder="输入新关键词"
                    value={newKw.keyword}
                    onChange={e => setNewKw({ ...newKw, keyword: e.target.value })}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none", color: "#374151" }}
                />
                <select
                    value={newKw.category}
                    onChange={e => setNewKw({ ...newKw, category: e.target.value })}
                    style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, outline: "none", color: "#374151" }}
                >
                    <option value="代写">代写</option>
                    <option value="广告">广告</option>
                    <option value="诈骗">诈骗</option>
                </select>
                <button
                    onClick={handleAddKeyword}
                    style={{ background: "#3b82f6", color: "#fff", border: "1px solid #3b82f6", padding: "8px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
                >
                    添加
                </button>
            </div>

            {/* Keywords list */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {keywords.map(k => (
                    <div key={k.id} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 20, fontSize: 13,
                        backgroundColor: categoryColors[k.category]?.bg || "#f3f4f6",
                        color: categoryColors[k.category]?.text || "#374151",
                        border: "1px solid transparent",
                    }}>
                        <span style={{ fontWeight: 600 }}>{k.keyword}</span>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>({k.category})</span>
                        <span
                            onClick={() => handleRemoveKeyword(k.id)}
                            style={{ marginLeft: 2, cursor: "pointer", opacity: 0.5, fontSize: 14 }}
                        >
                            X
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
    );
}


//Main APP
export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("blacklist");

    return (
        <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", }}>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            * { box-sizing: border-box; }
            `}</style>

            {/*Header*/}
            <div style={{ padding: "20px 32px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#fff", }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>GPS Anti-Fraud</span>
                        <span style={{ fontSize: 11, color: "#6b7280", background: "#e0e7ff", padding: "2px 8px", borderRadius: 4, fontWeight: 600, }}>Module 2</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#374151" }}>反代写/反广告风控管理系统</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: "0px 32px", background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 0 }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: "14px 24px",
                                border: "none",
                                background: "none",
                                color: activeTab === tab.id ? "#3b82f6" : "#374151",
                                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                                cursor: "pointer",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px" }}>
                {activeTab === "blacklist" && <BlacklistTab />}
                {activeTab === "keywords" && <KeywordsTab />}
                {activeTab === "reports" && <ReportsTab />}
            </div>
        </div>
    );
}
