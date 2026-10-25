from typing import Dict, Any

# Egyptian Purchasing Power Parity (PPP) localized pricing tiers
TIER_PLANS: Dict[str, Dict[str, Any]] = {
    "FREE": {
        "id": "FREE",
        "name_en": "Free Scout",
        "name_ar": "المستكشف المجاني",
        "tagline_en": "Ideal for freelance scouts and grassroot testing",
        "tagline_ar": "مثالي للمستكشفين المبتدئين والتجربة السريعة",
        "pricing": {
            "EGP": {"monthly": 0, "annual": 0, "symbol": "ج.م"},
            "USD": {"monthly": 0, "annual": 0, "symbol": "$"},
        },
        "limits": {
            "video_uploads_per_month": 3,
            "video_duration_minutes": 15.0,
            "ai_reports_per_month": 3,
            "players_managed": 5,
        },
        "features_en": [
            "3 Match Video Uploads / month",
            "3 AI Scouting Reports",
            "Up to 5 Player Profiles Tracked",
            "Standard 1080p Video Processing",
            "Community Support",
        ],
        "features_ar": [
            "3 فيديوهات مباريات شهرياً",
            "3 تقارير كشفية بالذكاء الاصطناعي",
            "حتى 5 ملفات لاعبين",
            "معالجة فيديو بدقة 1080p",
            "دعم فني عام عبر المجتمع",
        ],
        "popular": False,
        "badge_en": "Free Forever",
        "badge_ar": "مجاني دائماً",
    },
    "STARTER": {
        "id": "STARTER",
        "name_en": "Starter Coach",
        "name_ar": "المدرب المستقل",
        "tagline_en": "For private trainers, local analysts & independent scouts",
        "tagline_ar": "للمدربين الخصوصيين والمحللين ومستكشفي المواهب المستقلين",
        "pricing": {
            "EGP": {"monthly": 499, "annual": 4990, "symbol": "ج.م"},
            "USD": {"monthly": 15, "annual": 149, "symbol": "$"},
        },
        "limits": {
            "video_uploads_per_month": 15,
            "video_duration_minutes": 90.0,
            "ai_reports_per_month": 15,
            "players_managed": 25,
        },
        "features_en": [
            "15 Match Video Uploads / month",
            "15 Deep AI Scouting Reports",
            "Up to 25 Athlete Profiles Tracked",
            "Kinematic Jump & Hang-Time Analysis",
            "Export Branded PDF Dossiers",
            "Local Payment: Meeza cards & Fawry kiosk collection",
        ],
        "features_ar": [
            "15 فيديو مباراة شهرياً",
            "15 تقرير تكتيكي متعمق بالذكاء الاصطناعي",
            "إدارة حتى 25 ملف لاعب ورياضي",
            "التحليل الحركي للارتقاء وزمن الطيران",
            "تصدير التقارير الكشفية المعتمدة (PDF)",
            "دفع محلي فوري: بطاقات ميزة والدفع النقدي بفروع فوري",
        ],
        "popular": False,
        "badge_en": "Egyptian Coaches Favorite",
        "badge_ar": "المفضل للمدربين في مصر",
    },
    "PRO": {
        "id": "PRO",
        "name_en": "Pro Academy",
        "name_ar": "الأكاديمية المحترفة",
        "tagline_en": "Built for Egyptian Premier academies and regional scouting departments",
        "tagline_ar": "مصمم للأكاديميات وقطاعات الناشئين في مصر والشرق الأوسط",
        "pricing": {
            "EGP": {"monthly": 1999, "annual": 19990, "symbol": "ج.م"},
            "USD": {"monthly": 49, "annual": 490, "symbol": "$"},
        },
        "limits": {
            "video_uploads_per_month": 60,
            "video_duration_minutes": 360.0,
            "ai_reports_per_month": 60,
            "players_managed": 100,
        },
        "features_en": [
            "60 Match Video Uploads / month (Full Matches & Clips)",
            "60 Biomechanical & Tactical Scouting Dossiers",
            "Up to 100 Player Profiles Across Age Categories",
            "Bilingual Reports (Arabic & Professional English)",
            "Multi-Player Pitch Scanning with Jersey Identification",
            "FIFA & Olympic Accreditation Verification Badge",
            "Priority Support & Multi-Coach Access (Up to 5 accounts)",
        ],
        "features_ar": [
            "60 مباراة شهرياً (مباريات كاملة ومقاطع تكتيكية)",
            "60 ملف كشفي وتحليلي متقدم بالذكاء الاصطناعي",
            "إدارة حتى 100 لاعب عبر مختلف الفئات العمرية",
            "تقارير باللغة العربية الفصحى والإنجليزية الاحترافية",
            "مسح جماعي فوري للاعبين مع التعرف على أرقام القمصان",
            "شعار الاعتماد الرياضي المعتمد من الفيفا واللجنة الأولمبية",
            "دعم فني مباشر وصلاحيات دخول لـ 5 مدربين ومساعدين",
        ],
        "popular": True,
        "badge_en": "Most Popular in Egypt",
        "badge_ar": "الأكثر طلباً للأكاديميات المصرية",
    },
    "ACADEMY": {
        "id": "ACADEMY",
        "name_en": "Pro Academy",
        "name_ar": "الأكاديمية المحترفة",
        "tagline_en": "Built for Egyptian Premier academies and regional scouting departments",
        "tagline_ar": "مصمم للأكاديميات وقطاعات الناشئين في مصر والشرق الأوسط",
        "pricing": {
            "EGP": {"monthly": 1999, "annual": 19990, "symbol": "ج.م"},
            "USD": {"monthly": 49, "annual": 490, "symbol": "$"},
        },
        "limits": {
            "video_uploads_per_month": 60,
            "video_duration_minutes": 360.0,
            "ai_reports_per_month": 60,
            "players_managed": 100,
        },
        "features_en": [
            "60 Match Video Uploads / month",
            "60 Biomechanical & Tactical Scouting Dossiers",
            "Up to 100 Player Profiles",
            "Bilingual Reports (Arabic & Professional English)",
            "Multi-Player Pitch Scanning",
            "FIFA / Olympic Accreditation",
        ],
        "features_ar": [
            "60 مباراة شهرياً",
            "60 ملف كشفي وتحليلي متقدم",
            "إدارة حتى 100 لاعب",
            "تقارير ثنائية اللغة",
            "مسح جماعي فوري للاعبين",
            "شعار الاعتماد الرياضي",
        ],
        "popular": True,
        "badge_en": "Most Popular in Egypt",
        "badge_ar": "الأكثر طلباً للأكاديميات المصرية",
    },
    "ENTERPRISE": {
        "id": "ENTERPRISE",
        "name_en": "Enterprise Club",
        "name_ar": "الأندية والاتحادات",
        "tagline_en": "Full club infrastructure for Premier League clubs, federations & global syndicates",
        "tagline_ar": "بنية تحتية متكاملة لأندية الدوري الممتاز والاتحادات الرياضية",
        "pricing": {
            "EGP": {"monthly": 6999, "annual": 69990, "symbol": "ج.م"},
            "USD": {"monthly": 199, "annual": 1990, "symbol": "$"},
        },
        "limits": {
            "video_uploads_per_month": 500,
            "video_duration_minutes": 5000.0,
            "ai_reports_per_month": 500,
            "players_managed": 1000,
        },
        "features_en": [
            "500+ Match Uploads / month (Unlimited Youth Sector Coverage)",
            "Unlimited AI Tactical & Biomechanical Evaluations",
            "Full Club Roster Management (Youth to 1st Team)",
            "Dedicated Computer Vision GPU Processing Queue",
            "Direct API & Wearable Sensor Integration (ESP32 IoT)",
            "Dedicated Local Technical Account Manager (Cairo & Giza)",
            "SLA 99.9% Uptime & Custom Legal Contracts",
        ],
        "features_ar": [
            "رفع حتى 500+ مباراة شهرياً لتغطية كافة فرق النادي",
            "تقارير وتوليفات ذكاء اصطناعي غير محدودة",
            "إدارة شاملة لجميع فرق النادي من البراعم حتى الفريق الأول",
            "طابور معالجة فائق السرعة عبر خوادم GPU مخصصة",
            "ربط مباشر بـ API ومستشعرات أجهزة القياس الحركية ESP32",
            "مدير حسابات ودعم فني مباشر متواجد بالقاهرة والجيزة",
            "عقود رسمية للشركات واتفاقية مستوى خدمة SLA 99.9%",
        ],
        "popular": False,
        "badge_en": "Elite Pro Clubs",
        "badge_ar": "لأندية النخبة والمحترفين",
    },
}


def normalize_tier(tier: str) -> str:
    """Normalizes tier strings safely to uppercase key."""
    if not tier:
        return "FREE"
    cleaned = tier.strip().upper()
    if cleaned in TIER_PLANS:
        return cleaned
    # Map common aliases
    alias_map = {
        "BASIC": "FREE",
        "TRIAL": "FREE",
        "STANDARD": "STARTER",
        "COACH": "STARTER",
        "PREMIUM": "PRO",
        "CLUB": "ENTERPRISE",
        "FEDERATION": "ENTERPRISE",
    }
    return alias_map.get(cleaned, "PRO")


def get_tier_limits(tier: str) -> Dict[str, Any]:
    norm = normalize_tier(tier)
    return TIER_PLANS[norm]["limits"]
