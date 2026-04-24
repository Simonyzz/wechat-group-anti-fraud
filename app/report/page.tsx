"use client";

import { useState } from "react";

type FormData = {
    target_wxid: string;
    target_nickname: string;
    target_email: string;
    category: string;
    description: string;
    reporter_name: string;
    reporter_email: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

const CATEGORIES = [
    { value: "代写", label: "代写服务", desc: "essay, assignment 代写广告" },
    { value: "广告", label: "商业广告", desc: "中介，租房，培训等非官方广告" },
    { value: "诈骗", label: "诈骗行为", desc: "虚假信息，骗钱，钓鱼链接等" },
    { value: "其他", label: "其他违规行为", desc: "骚扰，恶意言论等" },
];

export default function ReportPage() {
    const [formData, setFormData] = useState<FormData>({
        target_wxid: "",
        target_nickname: "",
        target_email: "",
        category: "代写",
        description: "",
        reporter_name: "",
        reporter_email: "",
    });
    const [submitState, setSubmitState] = useState<SubmitState>("idle");
    const [message, setMessage] = useState("");

    const updateField = (key: keyof FormData, value: string) => {
        setFormData(prev => ({ ...formData, [key]: value }));
    };

    const validate = (): string | null => {
        if (!formData.target_wxid && !formData.target_nickname && !formData.target_email) {
            return "请至少提供被举报人的微信号，昵称或邮箱的其中一项";
        }
        if (!formData.category) {
            return "请选择举报类别";
        }
        if (!formData.description.trim() || formData.description.length < 10) {
            return "请提供举报描述";
        }
        if (!formData.reporter_name.trim()) {
            return "请提供举报人姓名";
        }
        if (!formData.reporter_email.trim()) {
            return "请提供举报人邮箱";
        }
        if (!/\S+@\S+\.\S+/.test(formData.reporter_email)) {
            return "请输入有效的举报人邮箱";
        }
        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) {
            setMessage(error);
            setSubmitState("error");
            return;
        }

        setSubmitState("submitting");
        setMessage("");

        try {
            const response = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target_wxid: formData.target_wxid,
                    target_email: formData.target_email,
                    description: `[${formData.category}] ${formData.target_nickname ? `昵称: ${formData.target_nickname}, ` : ""}${formData.description}`,
                    reporter_name: formData.reporter_name,
                    reporter_email: formData.reporter_email,
                }),
            });

            if (!response.ok) throw new Error("提交失败");
            setSubmitState("success");
        } catch {
            setMessage("提交举报时发生错误，请稍后再试");
            setSubmitState("error");
        }
    };

    const resetForm = () => {
        setFormData({
            target_wxid: "",
            target_nickname: "",
            target_email: "",
            category: "",
            description: "",
            reporter_name: "",
            reporter_email: "",
        });
        setSubmitState("idle");
        setMessage("");
    };

    // Success screen
    if (submitState === "success") {
        return (
            <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32, }}>✓</div>
                    <h2 style={{ margin: "0 0 12px", fontSize: 22, color: "#065f46", fontWeight: 700 }}>举报提交成功</h2>
                    <p style={{ margin: "0 0 24px", fontSize: 14, color: "#4b5563", lineHeight: 1.6 }}>感谢您的举报，我们会尽快处理。</p>
                    <button onClick={resetForm} style={{ background: "#fff", color: "#3b82f6", border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>继续举报</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "Arial, sans-serif", padding: "40px 20px" }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                        display: "inline-block", padding: "4px 12px", background: "#3b82f6", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 600, marginBottom: 12, letterSpacing: "1px",
                    }}>
                        新生群代写广告举报平台
                    </div>
                    <h1 style={{
                        margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px",
                    }}>举报可疑用户</h1>
                    <p style={{ margin: 0, fontSize: 15, color: "#6b7280" }}>让我们共同维护新生群的优良环境</p>
                </div>

                {/* Form card */}
                <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb" }}>
                    {/* Section 1: Target info */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "0.3PX",
                        }}>
                            被举报人信息
                        </div>
                        <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>
                            请至少提供微信号、昵称或邮箱中的一项，以便我们更有效地处理举报
                        </div>
                        <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                            <LabeledInput
                                label="微信号"
                                placeholder="请输入被举报人的微信号"
                                value={formData.target_wxid}
                                onChange={v => updateField("target_wxid", v)}
                            />
                            <LabeledInput
                                label="昵称"
                                placeholder="请输入被举报人的昵称"
                                value={formData.target_nickname}
                                onChange={v => updateField("target_nickname", v)}
                            />
                            <LabeledInput
                                label="邮箱"
                                placeholder="请输入被举报人的邮箱"
                                value={formData.target_email}
                                onChange={v => updateField("target_email", v)}
                            />
                        </div>
                    </div>

                    {/* Section 2: Category */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14, letterSpacing: "0.3PX",
                        }}>
                            举报类别
                        </div>
                        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => updateField("category", cat.value)}
                                    style={{
                                        padding: "12px 14px", borderRadius: 8, textAlign: "left",
                                        border: formData.category === cat.value ? "2px solid #3b82f6" : "1px solid #d1d5db",
                                        background: formData.category === cat.value ? "#3b82f6" : "#fff",
                                        color: formData.category === cat.value ? "#fff" : "#0f172a",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>{cat.label}</div>
                                    <div style={{ fontSize: 11, color: formData.category === cat.value ? "#bfdbfe" : "#94a3b8" }}>{cat.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Desciption */}
                    <div style={{ marginBottom: 28 }}>
                        <LabeledTextarea
                            label="举报描述"
                            value={formData.description}
                            onChange={v => updateField("description", v)}
                            placeholder="请详细描述违规行为"
                            hint="请提供尽可能详细的信息，帮助我们核实举报内容。"
                        />
                    </div>

                    {/* Section 4: Reporter info */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4, letterSpacing: "0.3px",
                        }}>
                            您的信息
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>
                            仅用于审核联系，不会公开
                        </div>
                        <div style={{ display: "grid", gridTemplate: "1fr 1fr", gap: 10 }}>
                            <LabeledInput
                                label="您的姓名"
                                value={formData.reporter_name}
                                onChange={v => updateField("reporter_name", v)}
                                placeholder="真实姓名或常用昵称"
                            />
                            <LabeledInput
                                label="您的邮箱"
                                value={formData.reporter_email}
                                onChange={v => updateField("reporter_email", v)}
                                placeholder="xxx@queensu.ca"
                                type="email"
                            />
                        </div>
                    </div>

                    {/* Error message */}
                    {submitState === "error" && message && (
                        <div style={{
                            padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "#fef2f2", color: "#dc2626", fontSize: 13, border: "1px solid #fecaca",
                        }}>
                            ⚠ {message}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitState == "submitting"}
                        style={{
                            width: "100%", padding: "14px", borderRadius: 10, border: "none",
                            background: submitState === "submitting" ? "#94a3b8" : "#0f172a",
                            color: "#fff", fontSize: 15, fontWeight: 700,
                            cursor: submitState === "submitting" ? "default" : "pointer",
                            letterSpacing: "0.3px", transition: "all 0.15s"
                        }}
                    >
                        {submitState === "submitting" ? "提交中..." : "提交举报"}
                    </button>
                    
                    <div style={{
                        marginTop: 16, fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 1.6,
                    }}>
                        提交即表示您确认所提供信息属实<br />
                        虚假举报可能影响您的社区信誉
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    textAlign: "center", marginTop: 24, fontSize: 12, color: "#94a3b8",
                }}>
                    GPS Smart Campus Platform: Module 2
                </div>
            </div>
        </div>
    );
}

//Reusable Inputs
type InputProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
};

function LabeledInput({ label, value, onChange, placeholder, type = "text" }: InputProps) {
    return (
        <div>
            <label style={{
                display: "block", fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 500,
            }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", color: "#0f172a", boxSizing: "border-box", transition: "border 0.15s"
                }}
                onFocus={e => (e.target.style.borderColor = "#0f172a")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
        </div>
    );
}

type TextareaProps = InputProps & {hint?: string };

function LabeledTextarea({ label, value, onChange, placeholder, hint }: TextareaProps) {
    return (
        <div>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6,
            }}>
                <label style={{ fontSize: 13, color: "#0f172a", fontWeight: 700 }}>
                    {label}
                </label>
                {hint && (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {hint}
                    </span>
                )}
            </div>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%", minHeight: 100, padding: 14, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", color: "#0f172a", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", transition: "border 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "#0f172a")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
            <div style={{
                marginTop: 4, fontSize: 11, color: "#94a3b8", textAlign: "right",
            }}>
                {value.length} 字
            </div>
        </div>
    );
}