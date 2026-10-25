import { useState } from "react"

export interface PlansPageProps {
  onBack: () => void
  currentPlan?: string
  onSelectPlan?: (planId: string) => void
  lang?: "en" | "ar"
}

export function PlansPage({
  onBack,
  currentPlan = "PRO ACADEMY",
  onSelectPlan,
  lang = "en",
}: PlansPageProps) {
  const isAr = lang === "ar"
  const [currency, setCurrency] = useState<"EGP" | "USD">("EGP")
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly")
  const [activePlan, setActivePlan] = useState(currentPlan)
  const [fawryModal, setFawryModal] = useState<{ code: string; plan: string; amount: number } | null>(null)
  const [successToast, setSuccessToast] = useState("")

  const plans = [
    {
      id: "FREE",
      titleEn: "Free Scout",
      titleAr: "المستكشف المجاني",
      taglineEn: "For grassroots scouts and freelance testing",
      taglineAr: "للمستكشفين المبتدئين والتجربة السريعة للذكاء الاصطناعي",
      priceEgp: { monthly: 0, annual: 0 },
      priceUsd: { monthly: 0, annual: 0 },
      badgeEn: "Free Forever",
      badgeAr: "مجاني دائماً",
      limits: [
        isAr ? "3 مباريات شهرياً" : "3 match uploads / month",
        isAr ? "15 دقيقة فيديو" : "15 mins video max",
        isAr ? "3 تقارير بالذكاء الاصطناعي" : "3 AI scouting reports",
        isAr ? "حتى 5 لاعبين" : "5 athlete profiles",
      ],
      popular: false,
    },
    {
      id: "STARTER",
      titleEn: "Starter Coach",
      titleAr: "المدرب المستقل",
      taglineEn: "For private trainers, local analysts & independent scouts in Egypt",
      taglineAr: "للمدربين الخصوصيين ومحللي الأداء ومستكشفي المواهب المستقلين",
      priceEgp: { monthly: 499, annual: 4990 },
      priceUsd: { monthly: 15, annual: 149 },
      badgeEn: "Egyptian Coach Choice",
      badgeAr: "المفضل للمدربين في مصر",
      limits: [
        isAr ? "15 مباراة شهرياً" : "15 matches / month",
        isAr ? "90 دقيقة فيديو" : "90 mins video processing",
        isAr ? "15 تقرير تكتيكي متعمق" : "15 deep AI reports",
        isAr ? "حتى 25 ملف لاعب" : "25 athlete profiles",
        isAr ? "دعم الدفع عبر ميزة وفوري كاش" : "Meeza & Fawry cash supported",
      ],
      popular: false,
    },
    {
      id: "PRO ACADEMY",
      titleEn: "Pro Academy",
      titleAr: "الأكاديمية المحترفة",
      taglineEn: "Tailored for Premier Egyptian academies & regional football clubs",
      taglineAr: "مصمم خصيصاً لأكاديميات وقطاعات الناشئين في مصر والشرق الأوسط",
      priceEgp: { monthly: 1999, annual: 19990 },
      priceUsd: { monthly: 49, annual: 490 },
      badgeEn: "Most Popular in Egypt",
      badgeAr: "الأكثر طلباً للأكاديميات المصرية",
      limits: [
        isAr ? "60 مباراة شهرياً لتغطية المسابقات" : "60 match uploads / month",
        isAr ? "مسح فوري للاعبي الفريق والقمصان" : "Multi-player CV pitch scanning",
        isAr ? "60 ملف تكتيكي معتمد من الفيفا" : "60 FIFA/Olympic verified dossiers",
        isAr ? "إدارة حتى 100 لاعب" : "100 athlete profiles",
        isAr ? "تقارير ثنائية اللغة (عربي / إنجليزي)" : "Bilingual dossiers (Arabic & English)",
      ],
      popular: true,
    },
    {
      id: "ENTERPRISE",
      titleEn: "Enterprise Club",
      titleAr: "الأندية والاتحادات",
      taglineEn: "Complete infrastructure for Premier League clubs & national federations",
      taglineAr: "بنية تحتية متكاملة لأندية الدوري الممتاز والاتحادات الرياضية",
      priceEgp: { monthly: 6999, annual: 69990 },
      priceUsd: { monthly: 199, annual: 1990 },
      badgeEn: "Premier League Tier",
      badgeAr: "لأندية الدوري الممتاز",
      limits: [
        isAr ? "500+ مباراة شهرياً (تغطية كامل القطاع)" : "500+ matches (Full youth sector)",
        isAr ? "تقارير ذكاء اصطناعي غير محدودة" : "Unlimited AI scouting reports",
        isAr ? "إدارة كامل قطاع الناشئين (1000+)" : "Full club roster (1,000+ athletes)",
        isAr ? "خادم GPU مخصص + ربط مستشعرات ESP32" : "Dedicated GPU queue + ESP32 IoT API",
        isAr ? "مدير حسابات ودعم فني بالقاهرة" : "Dedicated Cairo account manager",
      ],
      popular: false,
    },
  ]

  const handleSelect = (plan: typeof plans[0]) => {
    setActivePlan(plan.id)
    if (onSelectPlan) onSelectPlan(plan.id)

    setSuccessToast(
      isAr
        ? `تم تحديث الباقة بنجاح إلى: ${plan.titleAr}`
        : `Subscription successfully updated to: ${plan.titleEn}`
    )
    setTimeout(() => setSuccessToast(""), 3500)
  }

  const handleFawryCheckout = (plan: typeof plans[0]) => {
    const code = Math.floor(1000000000 + Math.random() * 9000000000).toString()
    setFawryModal({
      code,
      plan: isAr ? plan.titleAr : plan.titleEn,
      amount: cycle === "annual" ? plan.priceEgp.annual : plan.priceEgp.monthly,
    })
  }

  return (
    <div className="page-shell subpage-shell" dir={isAr ? "rtl" : "ltr"}>
      {/* Top Breadcrumb Header */}
      <section className="subpage-heading" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <button
              type="button"
              onClick={onBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--line)",
                color: "var(--muted)",
                fontSize: 12,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              <span>{isAr ? "→ العودة للملف الشخصي" : "← Back to Profile"}</span>
            </button>
            <p className="eyebrow">
              <span /> {isAr ? "الاشتراكات والفوترة المصرية" : "SAAS SUBSCRIPTION & LOCALIZED PRICING"}
            </p>
            <h1>
              {isAr ? "باقات" : "SUBSCRIPTION"}
              <br />
              <em>{isAr ? "الاشتراك والأسعار." : "PLANS & QUOTAS."}</em>
            </h1>
          </div>

          {/* Active Plan Pill */}
          <div
            style={{
              padding: "12px 20px",
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))",
              border: "1px solid rgba(56,189,248,0.4)",
              boxShadow: "0 0 20px rgba(6,182,212,0.15)",
              textAlign: isAr ? "right" : "left",
            }}
          >
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted)", textTransform: "uppercase", display: "block" }}>
              {isAr ? "باقتك النشطة حالياً" : "Current Active Plan"}
            </span>
            <strong style={{ fontSize: 18, color: "#38bdf8", fontFamily: "'Space Grotesk', sans-serif" }}>
              ⚡ {activePlan}
            </strong>
          </div>
        </div>
      </section>

      {/* Success Notification Banner */}
      {successToast && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 12,
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#34d399",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Currency & Frequency Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          padding: "16px 20px",
          borderRadius: 16,
          background: "rgba(18,18,21,0.9)",
          border: "1px solid var(--line)",
          marginBottom: 24,
        }}
      >
        {/* Currency Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", textTransform: "uppercase" }}>
            {isAr ? "العملة:" : "Currency:"}
          </span>
          <div style={{ display: "flex", gap: 4, background: "#0c0c0e", padding: 3, borderRadius: 10, border: "1px solid var(--line)" }}>
            <button
              type="button"
              onClick={() => setCurrency("EGP")}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: currency === "EGP" ? "linear-gradient(135deg, #059669, #0d9488)" : "transparent",
                color: currency === "EGP" ? "#fff" : "var(--muted)",
              }}
            >
              🇪🇬 {isAr ? "الجنيه المصري (EGP)" : "EGP (Egypt PPP)"}
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: currency === "USD" ? "linear-gradient(135deg, #4f46e5, #06b6d4)" : "transparent",
                color: currency === "USD" ? "#fff" : "var(--muted)",
              }}
            >
              🌐 {isAr ? "دولار أمريكي (USD)" : "USD (Global)"}
            </button>
          </div>
        </div>

        {/* Frequency Switcher */}
        <div style={{ display: "flex", gap: 4, background: "#0c0c0e", padding: 3, borderRadius: 10, border: "1px solid var(--line)" }}>
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: cycle === "monthly" ? "var(--panel-raised, #303038)" : "transparent",
              color: cycle === "monthly" ? "#fff" : "var(--muted)",
            }}
          >
            {isAr ? "شهري" : "Monthly"}
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              background: cycle === "annual" ? "var(--panel-raised, #303038)" : "transparent",
              color: cycle === "annual" ? "#fff" : "var(--muted)",
            }}
          >
            {isAr ? "سنوي (خصم 20%)" : "Annual (-20%)"}
          </button>
        </div>
      </div>

      {/* Egyptian Payment Methods Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 18px",
          borderRadius: 12,
          background: "rgba(56, 189, 248, 0.05)",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          marginBottom: 24,
          fontSize: 12,
          color: "#94a3b8",
        }}
      >
        <span style={{ fontWeight: 600, color: "#e2e8f0" }}>
          {isAr ? "طرق السداد المعتمدة في مصر:" : "Egyptian Local Payment Methods:"}
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#38bdf8" }}>
            💳 Meeza (بطاقة ميزة)
          </span>
          <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#f59e0b" }}>
            🏪 Fawry Pay (فوري كاش)
          </span>
          <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#10b981" }}>
            📱 Vodafone Cash / InstaPay
          </span>
          <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#a855f7" }}>
            🏦 Visa / Mastercard
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {plans.map((p) => {
          const isCurrent = activePlan.toUpperCase() === p.id.toUpperCase()
          const priceObj = currency === "EGP" ? p.priceEgp : p.priceUsd
          const price = cycle === "annual" ? priceObj.annual : priceObj.monthly
          const sym = currency === "EGP" ? (isAr ? "ج.م" : "EGP") : "$"

          return (
            <div
              key={p.id}
              style={{
                position: "relative",
                padding: "24px 20px",
                borderRadius: 18,
                background: p.popular
                  ? "linear-gradient(180deg, rgba(17,24,54,0.95), rgba(10,14,32,0.95))"
                  : "rgba(18,18,21,0.9)",
                border: p.popular ? "1px solid rgba(99, 102, 241, 0.6)" : "1px solid var(--line)",
                boxShadow: p.popular ? "0 0 30px rgba(99, 102, 241, 0.2)" : "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {p.popular && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    padding: "3px 12px",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #4f46e5, #06b6d4)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {isAr ? p.badgeAr : p.badgeEn}
                </div>
              )}

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#fff" }}>
                    {isAr ? p.titleAr : p.titleEn}
                  </h3>
                  {isCurrent && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(56, 189, 248, 0.2)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                      }}
                    >
                      {isAr ? "باقتك الحالية" : "Active"}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, minHeight: 32 }}>
                  {isAr ? p.taglineAr : p.taglineEn}
                </p>

                {/* Price Display */}
                <div style={{ margin: "20px 0", paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk', monospace" }}>
                      {price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>{sym}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {cycle === "annual" ? (isAr ? "/ سنوياً" : "/ yr") : (isAr ? "/ شهرياً" : "/ mo")}
                    </span>
                  </div>
                </div>

                {/* Limits Checklist */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.limits.map((lim, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#cbd5e1" }}>
                      <span style={{ color: "#34d399", fontSize: 14, fontWeight: "bold" }}>✓</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleSelect(p)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    border: isCurrent ? "1px solid var(--line)" : "none",
                    cursor: isCurrent ? "default" : "pointer",
                    background: isCurrent
                      ? "rgba(255,255,255,0.05)"
                      : p.popular
                        ? "linear-gradient(135deg, #4f46e5, #06b6d4)"
                        : "linear-gradient(135deg, #059669, #0d9488)",
                    color: isCurrent ? "var(--muted)" : "#fff",
                    boxShadow: isCurrent ? "none" : "0 0 16px rgba(99,102,241,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {isCurrent
                    ? (isAr ? "باقتك الحالية" : "Current Plan")
                    : (isAr ? "تفعيل الباقة الآن" : "Select & Activate")}
                </button>

                {currency === "EGP" && price > 0 && !isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleFawryCheckout(p)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      color: "#fbbf24",
                      cursor: "pointer",
                    }}
                  >
                    🏪 {isAr ? "كود فوري كاش للدفع" : "Pay Cash via Fawry Code"}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fawry Cash Code Modal */}
      {fawryModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
            padding: 16,
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              padding: 24,
              borderRadius: 20,
              background: "#0c1228",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              boxShadow: "0 0 40px rgba(245, 158, 11, 0.25)",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏪</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24", margin: "0 0 6px 0" }}>
              {isAr ? "كود السداد النقدي عبر فوري" : "Fawry Cash Payment Reference"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px 0" }}>
              {isAr
                ? `لسداد باقة ${fawryModal.plan} بمبلغ ${fawryModal.amount} ج.م`
                : `For ${fawryModal.plan} (${fawryModal.amount} EGP)`}
            </p>

            <div
              style={{
                padding: "16px",
                borderRadius: 12,
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted)", textTransform: "uppercase" }}>
                {isAr ? "الرقم المرجعي للدفع:" : "Reference Code:"}
              </span>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "monospace", color: "#fbbf24", letterSpacing: 3, marginTop: 4 }}>
                {fawryModal.code}
              </div>
            </div>

            <p style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.5, marginBottom: 20, textAlign: isAr ? "right" : "left" }}>
              {isAr
                ? "توجه لأي سوبرماركت أو كشك به ماكينة فوري واطلب الدفع على كود الخدمة (788) برقم الكود أعلاه."
                : "Present this 10-digit code at any Fawry retail kiosk or supermarket. Pay under service code 788."}
            </p>

            <button
              type="button"
              onClick={() => {
                setActivePlan(fawryModal.plan)
                if (onSelectPlan) onSelectPlan(fawryModal.plan)
                setFawryModal(null)
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#000",
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
              }}
            >
              {isAr ? "تم، تفعيل الباقة والعودة" : "Done, Activate & Return"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlansPage
